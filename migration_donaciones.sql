-- Ejecutar este script en el editor SQL de Supabase para añadir las columnas de donaciones en pagos
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS monto_donacion NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS es_donacion_anonima BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS donante_nombre TEXT,
ADD COLUMN IF NOT EXISTS donante_identificacion TEXT;
