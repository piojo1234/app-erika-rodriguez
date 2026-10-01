-- Migración para actualizar la restricción de firmantes en firmas_trazabilidad
-- Permite firmas de adultos/tutores y menores de edad (asentimiento)

-- 1. Eliminar la restricción actual que solo admitía paciente_1 y paciente_2
ALTER TABLE firmas_trazabilidad 
DROP CONSTRAINT IF EXISTS firmas_trazabilidad_firmado_por_check;

-- 2. Crear la nueva restricción con todos los tipos de firmantes soportados por la app
ALTER TABLE firmas_trazabilidad 
ADD CONSTRAINT firmas_trazabilidad_firmado_por_check 
CHECK (firmado_por IN (
    'paciente_1',
    'paciente_2',
    'tutor_1',
    'tutor_2',
    'menor_asentimiento'
));
