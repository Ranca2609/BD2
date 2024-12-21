
const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


app.post("/send-email", async (req, res) => {
    const { to } = req.body;

    if (!to) {
        return res.status(400).json({ error: "El campo 'to' es requerido." });
    }

    try {
        
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio de Pago</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        </head>
        <body style="background-color: #f8f9fa; padding: 20px;">
            <div class="container" style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <h2 class="text-center" style="color: #007bff;">Recordatorio de Pago del Colegiado</h2>
                <p>Estimado/a:</p>
                <p>Le recordamos que debe realizar el pago de su colegiado para mantener activa su membresía y continuar ejerciendo en el hospital.</p>
                <p>Por favor, asegúrese de completar el pago antes del <strong>31 de este mes</strong> para evitar interrupciones en su actividad profesional.</p>
                <div class="text-center">
                    <a href="https://pago.colegiado.com" class="btn btn-primary" style="margin-top: 20px; text-decoration: none;">Realizar Pago</a>
                </div>
                <p class="mt-4">Si ya realizó el pago, por favor ignore este mensaje.</p>
                <p>Atentamente,</p>
                <p><strong>Administración del Hospital</strong></p>
                <hr>
                <footer class="text-muted text-center" style="font-size: 0.9em;">
                    Este es un mensaje automático. Por favor, no responda a este correo.
                </footer>
            </div>
        </body>
        </html>`;

        
        const info = await transporter.sendMail({
            from: `"Administración del Hospital" <${process.env.MAILTRAP_FROM}>`, 
            to,
            subject: "Recordatorio de Pago del Colegiado",
            html: htmlContent, 
        });

        res.status(200).json({
            message: "Correo enviado exitosamente.",
            info,
        });
    } catch (error) {
        console.error("Error enviando el correo:", error);
        res.status(500).json({ error: "No se pudo enviar el correo." });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
