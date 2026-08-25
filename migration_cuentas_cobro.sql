-- Migración para el Módulo de Cuentas de Cobro

CREATE TYPE estado_cuenta_cobro AS ENUM ('pendiente', 'pagada', 'anulada');

CREATE TABLE IF NOT EXISTS cuentas_cobro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consecutivo SERIAL,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    nombre_cliente TEXT NOT NULL,
    documento_cliente TEXT NOT NULL,
    telefono_cliente TEXT,
    concepto TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    valor_letras TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    banco TEXT DEFAULT 'Bancolombia',
    tipo_cuenta TEXT DEFAULT 'Cuenta de Ahorros',
    numero_cuenta TEXT,
    estado estado_cuenta_cobro DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Seguridad RLS
ALTER TABLE cuentas_cobro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios autenticados pueden ver todas las cuentas"
ON cuentas_cobro FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los usuarios autenticados pueden insertar cuentas"
ON cuentas_cobro FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Los usuarios autenticados pueden actualizar cuentas"
ON cuentas_cobro FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Los usuarios autenticados pueden eliminar cuentas"
ON cuentas_cobro FOR DELETE
TO authenticated
USING (true);
