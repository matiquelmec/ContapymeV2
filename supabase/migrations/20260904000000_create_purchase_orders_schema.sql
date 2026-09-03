-- 🚀 MIGRACIÓN PURCHASE ORDERS SCHEMA (ContaPymePUQ v20.0)
-- DATE: 2026-09-04
-- DESCRIPTION: Tablas para Órdenes de Compra y sus items, alineadas con el router FastAPI y frontend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    cliente_rut TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_giro TEXT DEFAULT 'GIRO COMERCIAL',
    cliente_direccion TEXT DEFAULT 'Punta Arenas',
    condicion_pago TEXT DEFAULT 'Contado',
    observaciones TEXT DEFAULT '',
    neto BIGINT NOT NULL DEFAULT 0,
    iva BIGINT NOT NULL DEFAULT 0,
    exento BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('borrador', 'emitida', 'facturada', 'anulada')),
    tipo_dte INTEGER,
    folio_dte INTEGER,
    dte_id UUID REFERENCES public.dte_issued(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT purchase_orders_org_numero_unique UNIQUE (organization_id, numero)
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    unidad TEXT DEFAULT 'UNI',
    cantidad NUMERIC(15,4) NOT NULL DEFAULT 1,
    precio_unitario BIGINT NOT NULL DEFAULT 0,
    descuento_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    afecto_iva BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_numero ON public.purchase_orders (organization_id, numero DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_estado ON public.purchase_orders (organization_id, estado);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_orden_id ON public.purchase_order_items (orden_id);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for purchase_orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_member_select'
    ) THEN
        CREATE POLICY "purchase_orders_member_select"
            ON public.purchase_orders
            FOR SELECT
            TO authenticated
            USING (private.is_org_member(organization_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_member_insert'
    ) THEN
        CREATE POLICY "purchase_orders_member_insert"
            ON public.purchase_orders
            FOR INSERT
            TO authenticated
            WITH CHECK (private.has_org_role(organization_id, ARRAY['owner', 'admin', 'accountant']));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_member_update'
    ) THEN
        CREATE POLICY "purchase_orders_member_update"
            ON public.purchase_orders
            FOR UPDATE
            TO authenticated
            USING (private.has_org_role(organization_id, ARRAY['owner', 'admin', 'accountant']));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_member_delete'
    ) THEN
        CREATE POLICY "purchase_orders_member_delete"
            ON public.purchase_orders
            FOR DELETE
            TO authenticated
            USING (private.has_org_role(organization_id, ARRAY['owner', 'admin']));
    END IF;
END $$;

-- Policies for purchase_order_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'purchase_order_items_member_select'
    ) THEN
        CREATE POLICY "purchase_order_items_member_select"
            ON public.purchase_order_items
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.purchase_orders po
                    WHERE po.id = purchase_order_items.orden_id
                      AND private.is_org_member(po.organization_id)
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'purchase_order_items_member_insert'
    ) THEN
        CREATE POLICY "purchase_order_items_member_insert"
            ON public.purchase_order_items
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.purchase_orders po
                    WHERE po.id = purchase_order_items.orden_id
                      AND private.has_org_role(po.organization_id, ARRAY['owner', 'admin', 'accountant'])
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'purchase_order_items_member_update'
    ) THEN
        CREATE POLICY "purchase_order_items_member_update"
            ON public.purchase_order_items
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.purchase_orders po
                    WHERE po.id = purchase_order_items.orden_id
                      AND private.has_org_role(po.organization_id, ARRAY['owner', 'admin', 'accountant'])
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'purchase_order_items_member_delete'
    ) THEN
        CREATE POLICY "purchase_order_items_member_delete"
            ON public.purchase_order_items
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.purchase_orders po
                    WHERE po.id = purchase_order_items.orden_id
                      AND private.has_org_role(po.organization_id, ARRAY['owner', 'admin'])
                )
            );
    END IF;
END $$;
