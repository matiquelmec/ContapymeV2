-- Migración 08: Trazabilidad Contable y Reversiones estructuradas
-- Crea la tabla accounting_events, asocia journal_entries, migra históricos y limpia columnas obsoletas.

CREATE TABLE IF NOT EXISTS public.accounting_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_type character varying NOT NULL,
  source_id character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reversed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reversed_at timestamp with time zone,
  notes text,
  CONSTRAINT accounting_events_pkey PRIMARY KEY (id),
  CONSTRAINT accounting_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Crear índice único parcial para asegurar que solo haya un evento activo por origen
CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_events_active 
ON public.accounting_events (organization_id, event_type, source_id) 
WHERE (status = 'active');

-- Agregar la columna event_id a journal_entries
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.accounting_events(id) ON DELETE SET NULL;

-- Migración de datos históricos
DO $$
BEGIN
  -- Insertar los eventos agrupando las fuentes existentes de journal_entries
  INSERT INTO public.accounting_events (organization_id, event_type, source_id, status)
  SELECT DISTINCT organization_id, source_type, source_id, 'active'
  FROM public.journal_entries
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL
  ON CONFLICT (organization_id, event_type, source_id) WHERE (status = 'active') DO NOTHING;

  -- Asociar las entradas contables al evento correspondiente
  UPDATE public.journal_entries je
  SET event_id = ae.id
  FROM public.accounting_events ae
  WHERE je.organization_id = ae.organization_id
    AND je.source_type = ae.event_type
    AND je.source_id = ae.source_id;
END $$;

-- Eliminar las columnas obsoletas de journal_entries
ALTER TABLE public.journal_entries
DROP COLUMN IF EXISTS source_type,
DROP COLUMN IF EXISTS source_id;
