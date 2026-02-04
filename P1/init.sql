-- Script de inicialización de base de datos
-- Práctica 1 - Software Avanzado

-- Eliminar tabla si existe (para reiniciar)
DROP TABLE IF EXISTS solicitudes_operativas;

-- Crear tabla
CREATE TABLE solicitudes_operativas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    area_solicitante VARCHAR(255) NOT NULL,
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 5),
    costo_estimado DECIMAL(10, 2) NOT NULL CHECK (costo_estimado >= 0),
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('registrada', 'en_proceso', 'finalizada'))
);

-- Crear índices
CREATE INDEX idx_estado ON solicitudes_operativas(estado);
CREATE INDEX idx_prioridad ON solicitudes_operativas(prioridad);

-- Insertar datos de prueba (opcional)
INSERT INTO solicitudes_operativas (titulo, area_solicitante, prioridad, costo_estimado, estado) VALUES
    ('Adquisición de equipos', 'Tecnología', 5, 15000.00, 'registrada'),
    ('Capacitación de personal', 'Recursos Humanos', 3, 5000.00, 'en_proceso'),
    ('Mantenimiento preventivo', 'Operaciones', 2, 3000.00, 'finalizada');

-- Verificar
SELECT * FROM solicitudes_operativas;