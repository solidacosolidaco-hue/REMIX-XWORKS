import { syncAllBoardsToSupabase } from './src/lib/supabase.ts';
import { initialIndustrialNodes, initialIndustrialConnections } from './src/data/templates.ts';

const mockBoard = {
  id: 'board-1',
  name: 'Test',
  nodes: initialIndustrialNodes,
  connections: initialIndustrialConnections,
  viewport: { x: 0, y: 0, scale: 1 },
  theme: 'dark'
};

syncAllBoardsToSupabase([mockBoard]).then(console.log).catch(console.error);
