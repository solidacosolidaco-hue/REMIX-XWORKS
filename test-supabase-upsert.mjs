import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://sfkwyoeykanynywkptnx.supabase.co';
const supabaseKey = 'sb_publishable_430GJDkeYrArR155tTqeeA_RfU2lVQn';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = {
      id: 'test-board-1',
      name: 'Test Board',
      nodes: [],
      connections: [],
      viewport: { x: 0, y: 0, scale: 1 },
      theme: 'dark',
      icon: null,
      updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('boards').upsert(payload, { onConflict: 'id' });
  console.log("Upsert Error:", error);
  console.log("Upsert Data:", data);
}
test();
