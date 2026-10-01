-- ==============================================================================
-- SCRIPT PARA RESTABLECER EL CONTRATO DE PRUEBA A 'PENDIENTE'
-- Paciente: Isabella Alejandra Camues Olaya
-- ==============================================================================

-- PASO 1: Eliminar las firmas de prueba registradas en la trazabilidad
DELETE FROM firmas_trazabilidad
WHERE contrato_id IN (
    SELECT c.id 
    FROM contratos c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE p.nombre_completo ILIKE '%Isabella%Camues%'
);

-- PASO 2: Restablecer el estado del contrato a 'pendiente'
UPDATE contratos
SET estado = 'pendiente'
WHERE id IN (
    SELECT c.id 
    FROM contratos c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE p.nombre_completo ILIKE '%Isabella%Camues%'
);

-- PASO 3: (Opcional) Verificar que quedó en estado 'pendiente' y con 0 firmas
SELECT 
    c.id AS contrato_id,
    p.nombre_completo,
    c.modalidad_atencion,
    c.estado,
    c.token_acceso,
    (SELECT COUNT(*) FROM firmas_trazabilidad f WHERE f.contrato_id = c.id) AS total_firmas
FROM contratos c
JOIN pacientes p ON c.paciente_id = p.id
WHERE p.nombre_completo ILIKE '%Isabella%Camues%';
