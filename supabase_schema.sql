-- ==============================================================================
-- XWORKS / XCANVAS - SCRIPT DE CRIAÇÃO DE TABELAS NO SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabela de Lousas / Quadros (Boards do Canvas Infinito)
CREATE TABLE IF NOT EXISTS public.boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "scale": 1}'::jsonb,
  theme TEXT DEFAULT 'dark',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Clientes Cadastrados
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  corporate_name TEXT,
  cnpj TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Pedidos / Propostas Comerciais
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  order_number TEXT,
  customer_name TEXT,
  status TEXT,
  total_value NUMERIC DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SEGURANÇA: Habilitar Row Level Security (RLS) e Políticas de Acesso
-- ==============================================================================
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para a chave pública anon / web app
DO $$ 
BEGIN
  -- Boards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon All Boards') THEN
    CREATE POLICY "Anon All Boards" ON public.boards FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Customers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon All Customers') THEN
    CREATE POLICY "Anon All Customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon All Orders') THEN
    CREATE POLICY "Anon All Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
