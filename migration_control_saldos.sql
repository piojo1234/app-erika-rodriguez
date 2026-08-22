-- Añadir la columna contrato_id a evoluciones_clinicas si no existe
ALTER TABLE public.evoluciones_clinicas
ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL;

-- Índices recomendados para optimizar la consulta
CREATE INDEX IF NOT EXISTS idx_evoluciones_contrato ON public.evoluciones_clinicas(contrato_id);
