-- Migración para el Módulo de Documentos y Certificados Clínicos

CREATE TYPE tipo_documento_enum AS ENUM ('certificado_asistencia', 'carta_remision');

CREATE TABLE IF NOT EXISTS documentos_clinicos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo_documento tipo_documento_enum NOT NULL,
    dirigido_a TEXT NOT NULL,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contenido_dinamico JSONB NOT NULL DEFAULT '{}'::jsonb,
    token_acceso UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Seguridad RLS
ALTER TABLE documentos_clinicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios autenticados pueden ver todos los documentos"
ON documentos_clinicos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los usuarios autenticados pueden insertar documentos"
ON documentos_clinicos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Los usuarios autenticados pueden actualizar documentos"
ON documentos_clinicos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Los usuarios autenticados pueden eliminar documentos"
ON documentos_clinicos FOR DELETE
TO authenticated
USING (true);
