const express = require('express');
const sql = require('mssql');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Configuración SQL Server
const sqlConfig = {
    user: 'sa',         
    password: 'Password123!',
    database: 'MiUniversidad',
    server: 'localhost', 
    port: 1433, 
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Configuración MongoDB
const mongoURI = 'mongodb://localhost:27017/miBaseDocumentos'; 
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const documentoSchema = new mongoose.Schema({
    doc_id: { type: String, unique: true },
    contenido: String,
    fechaCreacion: { type: Date, default: Date.now }
});
const Documento = mongoose.model('Documento', documentoSchema);

// Configuración Redis
const redisClient = createClient({
    url: 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

// Función para registrar errores en Redis
async function logErrorEnRedis(errorInfo) {
    const key = `error:${Date.now()}`;
    await redisClient.set(key, JSON.stringify(errorInfo));
}

// Conexión a SQL (pool de conexiones)
const poolPromise = sql.connect(sqlConfig);


app.post('/estudiantes', async (req, res) => {
    const { Nombre, Carnet, Creditos } = req.body;
    let transaction;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request.input('Nombre', sql.VarChar(100), Nombre)
                      .input('Carnet', sql.VarChar(50), Carnet)
                      .input('Creditos', sql.Int, Creditos)
                      .query(`INSERT INTO Estudiante (Nombre, Carnet, Creditos) 
                              VALUES (@Nombre, @Carnet, @Creditos)`);

        await transaction.commit();
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'insercion',
            status: 'successs',
            funcion: 'insertarEstudiante',
            controlador: 'EstudianteController',
            descripcion: `Se añadio correctamente al estudiante`
        });
        res.status(201).json({ status: 'ok', message: 'Estudiante insertado correctamente' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'insercion',
            status: 'error',
            funcion: 'insertarEstudiante',
            controlador: 'EstudianteController',
            descripcion: `Error al insertar el estudiante: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al insertar estudiante' });
    }
});

// Endpoint: Insertar curso en SQL con transacción
app.post('/cursos', async (req, res) => {
    const { Nombre, CreditosMinimos } = req.body;
    let transaction;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request.input('Nombre', sql.VarChar(100), Nombre)
                      .input('CreditosMinimos', sql.Int, CreditosMinimos)
                      .query(`INSERT INTO Curso (Nombre, CreditosMinimos) VALUES (@Nombre, @CreditosMinimos)`);

        await transaction.commit();
        res.status(201).json({ status: 'ok', message: 'Curso insertado correctamente' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'insercion',
            status: 'error',
            funcion: 'insertarCurso',
            controlador: 'CursoController',
            descripcion: `Error al insertar el curso: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al insertar curso' });
    }
});

// Endpoint: Asignar un curso a un estudiante (INSERT en Asignacion)
app.post('/asignaciones', async (req, res) => {
    const { IdEstudiante, IdCurso } = req.body;
    let transaction;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request.input('IdEstudiante', sql.Int, IdEstudiante)
                      .input('IdCurso', sql.Int, IdCurso)
                      .query(`INSERT INTO Asignacion (IdEstudiante, IdCurso) VALUES (@IdEstudiante, @IdCurso)`);

        await transaction.commit();
        res.status(201).json({ status: 'ok', message: 'Asignación insertada correctamente' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'insercion',
            status: 'error',
            funcion: 'insertarAsignacion',
            controlador: 'AsignacionController',
            descripcion: `Error al insertar la asignación: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al insertar asignación' });
    }
});

// Endpoint: Insertar documento en Mongo (transacción Mongo)
app.post('/documentos', async (req, res) => {
    const { doc_id, contenido } = req.body;

    try {
        const documento = new Documento({ doc_id, contenido });
        await documento.save();
        res.status(201).json({ status: 'ok', message: 'Documento insertado correctamente en Mongo' });
    } catch (error) {
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'insercion',
            status: 'error',
            funcion: 'insertarDocumento',
            controlador: 'DocumentoController',
            descripcion: `Error al insertar el documento en Mongo: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al insertar documento en Mongo' });
    }
});

// Endpoint: Obtener documento de Mongo y generar PDF
app.get('/documentos/:doc_id/pdf', async (req, res) => {
    const { doc_id } = req.params;
    try {
        const documento = await Documento.findOne({ doc_id });
        if (!documento) {
            return res.status(404).json({ status: 'error', message: 'Documento no encontrado' });
        }

        // Generar PDF en memoria
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc_id}.pdf"`);

        doc.text(`Documento ID: ${documento.doc_id}`);
        doc.text(`Contenido: ${documento.contenido}`);
        doc.text(`Fecha Creación: ${documento.fechaCreacion}`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'seleccion',
            status: 'error',
            funcion: 'generarPDF',
            controlador: 'DocumentoController',
            descripcion: `Error al generar PDF: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al generar el PDF del documento' });
    }
});

// Endpoint: Seleccionar información de Estudiantes (ejemplo GET)
app.get('/estudiantes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Estudiante');
        res.status(200).json({ status: 'ok', data: result.recordset });
    } catch (error) {
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'seleccion',
            status: 'error',
            funcion: 'obtenerEstudiantes',
            controlador: 'EstudianteController',
            descripcion: `Error al obtener estudiantes: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al obtener estudiantes' });
    }
});

// Endpoint: Seleccionar documentos en Mongo (ejemplo GET)
app.get('/documentos', async (req, res) => {
    try {
        const docs = await Documento.find();
        res.status(200).json({ status: 'ok', data: docs });
    } catch (error) {
        await logErrorEnRedis({
            log_id: new Date().toISOString().replace(/[:.-]/g, ''),
            tipo: 'seleccion',
            status: 'error',
            funcion: 'obtenerDocumentos',
            controlador: 'DocumentoController',
            descripcion: `Error al obtener documentos: ${error.message}`
        });
        res.status(500).json({ status: 'error', message: 'Error al obtener documentos' });
    }
});


app.get('/errores', async (req, res) => {
    try {
        const keys = await redisClient.keys('error:*');
        const errores = await Promise.all(
            keys.map(async (key) => {
                const errorData = await redisClient.get(key);
                return {
                    key,
                    error: JSON.parse(errorData)
                };
            })
        );
        res.json(errores);
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error al recuperar errores de Redis' 
        });
    }
});

app.listen(5000, () => {
    console.log('Servidor iniciado en puerto 5000');
});
