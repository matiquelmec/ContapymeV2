
-- Permitir lectura pública de indicadores económicos
-- Estos datos son públicos para la Landing Page y Dashboard informativo.

ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for economic_indicators"
ON public.economic_indicators
FOR SELECT
TO public
USING (true);
