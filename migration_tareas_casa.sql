-- Ejecutar este script en el editor SQL de Supabase para añadir las nuevas columnas de tareas
ALTER TABLE evoluciones_clinicas 
ADD COLUMN IF NOT EXISTS tareas_casa JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS revision_tarea_previa JSONB DEFAULT '[]'::jsonb;
