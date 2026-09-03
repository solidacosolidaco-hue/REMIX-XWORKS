import { checkSupabaseHealth } from './src/lib/supabase.ts';
checkSupabaseHealth().then(console.log).catch(console.error);
