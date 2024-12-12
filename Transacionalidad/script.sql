-- Crear la base de datos
CREATE DATABASE MiUniversidad;
GO

USE MiUniversidad;
GO

-- Crear tabla Estudiante
CREATE TABLE Estudiante (
    IdEstudiante INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Carnet VARCHAR(50) NOT NULL UNIQUE,
    Creditos INT NOT NULL
);

-- Crear tabla Curso
CREATE TABLE Curso (
    IdCurso INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    CreditosMinimos INT NOT NULL
);

-- Crear tabla Asignacion
-- Se asume que la tabla Asignacion relaciona a un Estudiante con un Curso, por lo que necesita IdCurso
CREATE TABLE Asignacion (
    IdAsignacion INT IDENTITY(1,1) PRIMARY KEY,
    IdEstudiante INT NOT NULL,
    IdCurso INT NOT NULL,
    CONSTRAINT FK_Asignacion_Estudiante FOREIGN KEY (IdEstudiante) REFERENCES Estudiante(IdEstudiante),
    CONSTRAINT FK_Asignacion_Curso FOREIGN KEY (IdCurso) REFERENCES Curso(IdCurso)
);
