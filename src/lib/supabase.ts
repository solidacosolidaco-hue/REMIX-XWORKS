/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { CanvasBoard } from '../types/canvas';
import { RegisteredCustomer } from '../data/customerRegistry';
import { RegisteredOrder } from '../data/orderRegistry';

// Normalize the Supabase URL
const rawUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://sfkwyoeykanynywkptnx.supabase.co';

export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_430GJDkeYrArR155tTqeeA_RfU2lVQn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealthStatus {
  connected: boolean;
  latencyMs: number;
  url: string;
  tables: {
    boards: boolean;
    customers: boolean;
    orders: boolean;
  };
  error?: string;
}

export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
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
`;

/**
 * Checks connection health and table existence in Supabase.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const start = performance.now();
  const status: SupabaseHealthStatus = {
    connected: false,
    latencyMs: 0,
    url: SUPABASE_URL,
    tables: {
      boards: false,
      customers: false,
      orders: false,
    },
  };

  try {
    // 1. Check basic auth / ping
    const { error: pingError } = await supabase.auth.getSession();
    const elapsed = Math.round(performance.now() - start);
    status.latencyMs = elapsed;

    if (pingError && !pingError.message.includes('session')) {
      status.error = pingError.message;
      return status;
    }

    status.connected = true;

    // 2. Check if tables exist by doing limit 0 queries
    const [bRes, cRes, oRes] = await Promise.all([
      supabase.from('boards').select('id').limit(0),
      supabase.from('customers').select('id').limit(0),
      supabase.from('orders').select('id').limit(0),
    ]);

    status.tables.boards = !bRes.error || bRes.error.code !== 'PGRST205';
    status.tables.customers = !cRes.error || cRes.error.code !== 'PGRST205';
    status.tables.orders = !oRes.error || oRes.error.code !== 'PGRST205';

    return status;
  } catch (err: any) {
    status.latencyMs = Math.round(performance.now() - start);
    status.error = err?.message || 'Falha ao conectar com o Supabase';
    return status;
  }
}

/**
 * Fetch all boards from Supabase. Returns null if table does not exist or error.
 */
export async function fetchSupabaseBoards(): Promise<CanvasBoard[] | null> {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        // Table does not exist in schema cache
        return null;
      }
      console.warn('Erro ao buscar boards do Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      nodes: row.nodes || [],
      connections: row.connections || [],
      viewport: row.viewport || { x: 0, y: 0, scale: 1 },
      theme: row.theme || 'dark',
      icon: row.icon || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Exceção ao buscar boards do Supabase:', err);
    return null;
  }
}

/**
 * Save / Upsert a board to Supabase.
 */
export async function saveSupabaseBoard(board: CanvasBoard): Promise<boolean> {
  try {
    const payload = {
      id: board.id,
      name: board.name,
      nodes: board.nodes,
      connections: board.connections,
      viewport: board.viewport,
      theme: board.theme || 'dark',
      icon: board.icon || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('boards')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.code === 'PGRST205') {
        console.error('Tabela boards não existe', error);
        return false;
      }
      console.error('Erro ao salvar board no Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exceção ao salvar board no Supabase:', err);
    return false;
  }
}

/**
 * Save all boards to Supabase.
 */
export async function syncAllBoardsToSupabase(boards: CanvasBoard[]): Promise<{ saved: number; total: number; tableMissing?: boolean }> {
  let saved = 0;
  for (const board of boards) {
    const ok = await saveSupabaseBoard(board);
    if (ok) saved++;
  }
  return { saved, total: boards.length };
}

/**
 * Delete a board from Supabase.
 */
export async function deleteSupabaseBoard(boardId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) {
      console.warn('Erro ao deletar board do Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao deletar board do Supabase:', err);
    return false;
  }
}

/**
 * Fetch registered customers from Supabase.
 */
export async function fetchSupabaseCustomers(): Promise<RegisteredCustomer[] | null> {
  try {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
      if (error.code === 'PGRST205') return null;
      console.warn('Erro ao buscar clientes no Supabase:', error);
      return null;
    }
    if (!data) return [];
    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      name: row.name,
      corporateName: row.corporate_name || row.data?.corporateName || row.name,
      cnpj: row.cnpj || row.data?.cnpj || '',
    }));
  } catch (err) {
    console.warn('Exceção ao buscar clientes no Supabase:', err);
    return null;
  }
}

/**
 * Upsert a customer to Supabase.
 */
export async function saveSupabaseCustomer(customer: RegisteredCustomer): Promise<boolean> {
  try {
    const payload = {
      id: customer.id,
      name: customer.name,
      corporate_name: customer.corporateName,
      cnpj: customer.cnpj,
      data: customer,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'id' });
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch registered orders from Supabase.
 */
export async function fetchSupabaseOrders(): Promise<RegisteredOrder[] | null> {
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) {
      if (error.code === 'PGRST205') return null;
      console.warn('Erro ao buscar pedidos no Supabase:', error);
      return null;
    }
    if (!data) return [];
    return data.map((row: any) => ({
      ...row.data,
      id: row.id,
      title: row.title,
      salesOrderNumber: row.order_number || row.data?.salesOrderNumber || '',
      customerName: row.customer_name || row.data?.customerName || '',
      status: row.status || row.data?.status || 'Orçamento em Elaboração',
      totalValue: row.total_value ?? row.data?.totalValue ?? 0,
    }));
  } catch (err) {
    console.warn('Exceção ao buscar pedidos no Supabase:', err);
    return null;
  }
}

/**
 * Upsert an order to Supabase.
 */
export async function saveSupabaseOrder(order: RegisteredOrder): Promise<boolean> {
  try {
    const payload = {
      id: order.id,
      title: order.title,
      order_number: order.salesOrderNumber || order.budgetNumber,
      customer_name: order.customerName,
      status: order.status,
      total_value: order.totalValue,
      data: order,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}
