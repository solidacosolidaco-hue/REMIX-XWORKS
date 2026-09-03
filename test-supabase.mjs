import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://sfkwyoeykanynywkptnx.supabase.co';
const supabaseKey = 'sb_publishable_430GJDkeYrArR155tTqeeA_RfU2lVQn';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('boards').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
