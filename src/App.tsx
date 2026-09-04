import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CanvasNode,
  Connection,
  Viewport,
  CanvasMode,
  NodeType,
  NodeColor,
  ConnectionHandle,
  PresentationSlide,
  InvoiceDocument,
  CanvasBoard,
  CanvasTheme,
} from './types/canvas';
import { EmployeeUser } from './types/auth';
import { LoginModal } from './components/auth/LoginModal';
import { EmployeeManagementModal } from './components/auth/EmployeeManagementModal';
import {
  getActiveSession,
  setActiveSession,
  getRegisteredEmployees,
  GENERAL_ADMIN_USER,
} from './data/userRegistry';
import {
  initialIndustrialNodes,
  initialIndustrialConnections,
  industrialPresentationSlides,
  WorkspaceTemplate,
} from './data/templates';
import { CONTROLE_PRODUCAO_NODES, CONTROLE_PRODUCAO_CONNECTIONS } from './data/controleProducaoBoard';
import { Canvas } from './components/canvas/Canvas';
import { CanvasProvider } from './context/CanvasContext';
import { Toolbar } from './components/panels/Toolbar';
import { InspectorPanel } from './components/panels/InspectorPanel';
import { SearchFilterBar } from './components/panels/SearchFilterBar';
import { AIAssistantModal } from './components/panels/AIAssistantModal';
import { InvestigationBar } from './components/panels/InvestigationBar';
import { PresentationController } from './components/panels/PresentationController';
import { TemplatesModal } from './components/panels/TemplatesModal';
import { ShortcutsModal } from './components/panels/ShortcutsModal';
import { InvoiceModal } from './components/panels/InvoiceModal';
import { NodeDetailModal } from './components/panels/NodeDetailModal';
import { EmployeeModal } from './components/panels/EmployeeModal';
import { ProductsCatalogModal } from './components/panels/ProductsCatalogModal';
import { ImmersiveCalendarModal } from './components/panels/ImmersiveCalendarModal';
import { BoardTabBar } from './components/panels/BoardTabBar';
import { SimplifiedView } from './components/panels/SimplifiedView';
import { CommercialTerminalModal } from './components/panels/CommercialTerminalModal';
import { SectorReportModal } from './components/panels/SectorReportModal';
import { synchronizeFlowData } from './utils/flowIntelligence';
import { getUpstreamNodesForIndicator, calculateNodeProgress } from './utils/nodeProgress';
import { calculateBoundingBox, resolveNodeCollisions } from './utils/geometry';
import { generateNextNumber } from './data/orderRegistry';
import {
  Sparkles,
  Layers,
  Search,
  FolderOpen,
  Play,
  Pause,
  Share2,
  Receipt,
  Zap,
  Clock,
  UserPlus,
  Package,
  Database,
  Save,
  Check,
  CheckCircle2,
  Copy,
  Scissors,
  Clipboard,
  Loader2,
  Users,
  LogOut,
  ChevronDown,
  Shield,
  Key,
  Download,
  Upload,
  ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function App() {
  // Initial Board Data from LocalStorage or Defaults
  const initialSavedBoards = (() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('xcanvas_boards_backup') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if parsed boards contain the new transcribed board
          const hasTranscribedBoard = parsed.some(b => b.nodes && b.nodes.some(n => n.id === 'node-cp-1'));
          if (hasTranscribedBoard) {
            parsed.forEach(b => {
              if (b.nodes) {
                b.nodes = b.nodes.filter((n: CanvasNode) => n.id !== 'node-interrupted_flow-1788485540723');
              }
              if (b.connections) {
                b.connections = b.connections.filter(
                  (c: Connection) =>
                    c.id !== 'conn-1788474768322' &&
                    c.id !== 'conn-1788486985371' &&
                    c.fromId !== 'node-interrupted_flow-1788485540723' &&
                    c.toId !== 'node-interrupted_flow-1788485540723'
                );
              }
            });
            return parsed as CanvasBoard[];
          }
        }
      }
    } catch {}
    return null;
  })();

  const defaultMasterBoard: CanvasBoard = {
    id: 'board-1',
    name: 'Controle de Produção — Lousa Única',
    nodes: initialIndustrialNodes,
    connections: initialIndustrialConnections,
    viewport: { x: 40, y: 20, scale: 0.6 },
    createdAt: new Date().toLocaleDateString('pt-BR'),
    userId: 'user-ueliton',
    ownerName: 'Ueliton',
    isShared: true,
  };

  // Core Canvas State
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    const rawNodes = initialSavedBoards?.[0]?.nodes || initialIndustrialNodes;
    return rawNodes.filter((n) => n.id !== 'node-interrupted_flow-1788485540723');
  });
  const [connections, setConnections] = useState<Connection[]>(() => {
    const rawConns = initialSavedBoards?.[0]?.connections || initialIndustrialConnections;
    return rawConns.filter(
      (c: Connection) =>
        c.id !== 'conn-1788474768322' &&
        c.id !== 'conn-1788486985371' &&
        c.fromId !== 'node-interrupted_flow-1788485540723' &&
        c.toId !== 'node-interrupted_flow-1788485540723'
    );
  });
  const [viewport, setViewport] = useState<Viewport>(
    initialSavedBoards?.[0]?.viewport || { x: 40, y: 20, scale: 0.6 }
  );

  // Multiple Boards / Lousas State
  const [boards, setBoards] = useState<CanvasBoard[]>(() => {
    if (initialSavedBoards && initialSavedBoards.length > 0) {
      return initialSavedBoards;
    }
    return [defaultMasterBoard];
  });
  const [activeBoardId, setActiveBoardId] = useState<string>(
    initialSavedBoards?.[0]?.id || 'board-1'
  );

  // Undo/Redo History Stacks
  const [history, setHistory] = useState<{ nodes: CanvasNode[]; connections: Connection[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: CanvasNode[]; connections: Connection[] }[]>([]);

  // Selection & Modes
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('select');
  const [canvasTheme, setCanvasThemeRaw] = useState<CanvasTheme>('black');
  const setCanvasTheme = (t: CanvasTheme) => {
    if (t === 'white' || (t as string) === 'light') {
      setCanvasThemeRaw('black');
    } else {
      setCanvasThemeRaw(t);
    }
  };

  // Investigation Mode
  const [investigatedNodeId, setInvestigatedNodeId] = useState<string | null>(null);

  // Presentation Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>(
    industrialPresentationSlides
  );

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceTargetNodeId, setInvoiceTargetNodeId] = useState<string | null>(null);
  const [isNodeDetailOpen, setIsNodeDetailOpen] = useState(false);
  const [nodeDetailTargetId, setNodeDetailTargetId] = useState<string | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isProductsCatalogOpen, setIsProductsCatalogOpen] = useState(false);
  const [isImmersiveCalendarOpen, setIsImmersiveCalendarOpen] = useState(false);
  const [isSimplifiedViewOpen, setIsSimplifiedViewOpen] = useState(false);
  const [isCommercialTerminalOpen, setIsCommercialTerminalOpen] = useState(false);
  const [isSectorReportOpen, setIsSectorReportOpen] = useState(false);
  const [sectorReportTargetId, setSectorReportTargetId] = useState<string | null>(null);
  const [inspectorDockPosition, setInspectorDockPosition] = useState<'left' | 'right' | 'floating'>('right');
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [inspectorHeight, setInspectorHeight] = useState(600);
  const [simulatedToday, setSimulatedToday] = useState<string>('2026-09-01');
  const [isAutopilotActive, setIsAutopilotActive] = useState<boolean>(false);
  const isSupabaseModalOpen = false;
  const supabaseConnected = false;

  // Clipboard State for Copy, Cut & Paste
  const [clipboard, setClipboard] = useState<{
    nodes: CanvasNode[];
    connections: Connection[];
    isCut?: boolean;
  } | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('xcanvas_clipboard') : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [clipboardToast, setClipboardToast] = useState<{
    message: string;
    type: 'copy' | 'paste' | 'cut' | 'info';
  } | null>(null);

  useEffect(() => {
    if (clipboardToast) {
      const timer = setTimeout(() => {
        setClipboardToast(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [clipboardToast]);

  // User Authentication & Employee Management State
  const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(() => getActiveSession());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [allEmployees, setAllEmployees] = useState<EmployeeUser[]>(() => getRegisteredEmployees());

  // Save State (Supabase + LocalStorage)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async (isAutoSave = false) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveFeedback('saving');

    try {
      // 1. Atualizar a lista de boards com o estado atual do canvas ativo
      const updatedBoards = boards.map((b) =>
        b.id === activeBoardId
          ? {
              ...b,
              nodes,
              connections,
              viewport,
              theme: canvasTheme,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      
      // Update state if not just a background sync
      if (!isAutoSave) {
        setBoards(updatedBoards);
      }

      // 2. Persistir localmente no localStorage
      try {
        localStorage.setItem('xcanvas_boards_backup', JSON.stringify(updatedBoards));
      } catch (e) {
        console.warn('Falha no backup local:', e);
      }

      setSaveFeedback('saved');
      setTimeout(() => {
        setSaveFeedback('idle');
      }, 2500);
    } catch (err) {
      console.error('Erro ao salvar localmente:', err);
      setSaveFeedback('error');
      setTimeout(() => {
        setSaveFeedback('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Backup Functions
  const handleExportData = () => {
    // Atualizar estado com a lousa ativa atual antes de exportar
    const updatedBoards = boards.map((b) =>
      b.id === activeBoardId
        ? {
            ...b,
            nodes,
            connections,
            viewport,
            theme: canvasTheme,
            updatedAt: new Date().toISOString(),
          }
        : b
    );
    
    const exportData = {
      boards: updatedBoards,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `xworks-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDataTrigger = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const importedData = JSON.parse(content);

          if (importedData.boards && Array.isArray(importedData.boards)) {
            setBoards(importedData.boards);
            
            // Seleciona a primeira lousa importada
            if (importedData.boards.length > 0) {
              const firstBoard = importedData.boards[0];
              setActiveBoardId(firstBoard.id);
              setNodes(firstBoard.nodes || []);
              setConnections(firstBoard.connections || []);
              setViewport(firstBoard.viewport || { x: 80, y: 40, scale: 0.85 });
              if (firstBoard.theme) setCanvasTheme(firstBoard.theme as CanvasTheme);
            }

            // Salva no LocalStorage
            localStorage.setItem('xcanvas_boards_backup', JSON.stringify(importedData.boards));
            

            alert('Backup restaurado com sucesso!');
          } else {
            alert('Arquivo de backup inválido. Não foi possível encontrar as lousas.');
          }
        } catch (err) {
          console.error('Erro ao importar backup:', err);
          alert('Erro ao importar arquivo. Verifique se é um arquivo JSON válido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Auto-save effect
  const autoSaveRefs = useRef({ boards, nodes, connections, viewport, canvasTheme, activeBoardId });
  useEffect(() => {
    autoSaveRefs.current = { boards, nodes, connections, viewport, canvasTheme, activeBoardId };
  }, [boards, nodes, connections, viewport, canvasTheme, activeBoardId]);

  useEffect(() => {
    // A cada 30 segundos, dispara o salvamento automático no fundo
    const interval = setInterval(async () => {
      const state = autoSaveRefs.current;

      const updatedBoards = state.boards.map((b) =>
        b.id === state.activeBoardId
          ? {
              ...b,
              nodes: state.nodes,
              connections: state.connections,
              viewport: state.viewport,
              theme: state.canvasTheme,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      
      try {
        localStorage.setItem('xcanvas_boards_backup', JSON.stringify(updatedBoards));
      } catch (e) {
        // Silently fail on background auto-save
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);



  // Light Mode / Performance Mode state
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('xcanvas_performance_light_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleLightMode = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('xcanvas_performance_light_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Garantir remoção permanente de deadline, indicator e progress em qualquer estado ativo
  useEffect(() => {
    setNodes((prev) => {
      const filtered = prev.filter((n) => n.type !== 'deadline' && n.type !== 'indicator' && n.type !== 'progress');
      if (filtered.length !== prev.length) {
        const remainingIds = new Set(filtered.map((n) => n.id));
        setConnections((cPrev) => cPrev.filter((c) => remainingIds.has(c.fromId) && remainingIds.has(c.toId)));
        return filtered;
      }
      return prev;
    });
    setBoards((prevBoards) =>
      prevBoards.map((b) => {
        const filteredNodes = b.nodes.filter((n) => n.type !== 'deadline' && n.type !== 'indicator' && n.type !== 'progress');
        const validIds = new Set(filteredNodes.map((n) => n.id));
        const filteredConns = b.connections.filter((c) => validIds.has(c.fromId) && validIds.has(c.toId));
        return {
          ...b,
          nodes: filteredNodes,
          connections: filteredConns,
        };
      })
    );
  }, []);

  const handleAddEmployeeFromModal = (empData: {
    type: 'employee' | 'supervisor';
    name: string;
    employeeId: string;
    role: string;
    department: string;
    shift: string;
    employeeStatus: 'Disponível' | 'Em Serviço' | 'Em Férias' | 'Ausente';
    hourlyRate?: number;
    certifications?: string[];
    phone?: string;
    connectedSectorId?: string;
    progressPercent?: number;
  }) => {
    pushHistory();
    const newId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existingEmps = nodes.filter((n) => n.type === 'employee' || n.type === 'supervisor');
    const offsetX = (existingEmps.length % 4) * 50;
    const offsetY = Math.floor(existingEmps.length / 4) * 40;

    const posX = Math.round(-viewport.x / (viewport.scale || 1) + 280 + offsetX);
    const posY = Math.round(-viewport.y / (viewport.scale || 1) + 180 + offsetY);

    const newNode: CanvasNode = {
      id: newId,
      type: empData.type,
      name: empData.name,
      x: posX,
      y: posY,
      width: 320,
      height: 220,
      status: empData.employeeStatus === 'Em Serviço' ? 'Em Produção' : empData.employeeStatus === 'Disponível' ? 'Em Andamento' : 'Pendente',
      color: empData.type === 'supervisor' ? 'amber' : 'blue',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      tags: [empData.type, empData.department],
      data: {
        employeeId: empData.employeeId,
        role: empData.role,
        department: empData.department,
        shift: empData.shift,
        employeeStatus: empData.employeeStatus,
        hourlyRate: empData.hourlyRate || 0,
        certifications: empData.certifications || [],
        phone: empData.phone || '',
        progressPercent: empData.progressPercent ?? 85,
      },
      groupId: empData.connectedSectorId, // Assign sector
    };

    let newConns = [...connections];
    if (empData.connectedSectorId) {
      const connId = `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      newConns.push({
        id: connId,
        fromId: empData.connectedSectorId,
        toId: newId,
        label: 'Lotação / Equipe',
        autoSync: true,
        dataFlowRate: 100,
        status: 'active',
        type: 'solid',
      });
    }

    setNodes((prev) => [...prev, newNode]);
    setConnections(newConns);
    setSelectedNodeIds([newId]);
  };

  const handleCompleteSale = (saleData: any) => {
    pushHistory();
    setNodes((prevNodes) => {
      const updated = [...prevNodes];
      
      // 1. Create Order Node
      const orderId = `node-order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderPosX = Math.round(-viewport.x / (viewport.scale || 1) + 200);
      const orderPosY = Math.round(-viewport.y / (viewport.scale || 1) + 150);
      
      const orderNode: CanvasNode = {
        id: orderId,
        type: 'order',
        name: `Pedido - ${saleData.customer ? saleData.customer.name : 'Venda Rápida'}`,
        x: orderPosX,
        y: orderPosY,
        width: 320,
        height: 250,
        status: 'Em Produção',
        color: 'emerald',
        createdAt: new Date().toLocaleDateString('pt-BR'),
        updatedAt: new Date().toLocaleDateString('pt-BR'),
        tags: ['Comercial', 'Venda'],
        data: {
          clientName: saleData.customer ? saleData.customer.name : 'Venda Direta / Balcão',
          deadline: new Date().toLocaleDateString('pt-BR'),
          value: saleData.total,
          details: `Pagamento: ${saleData.paymentMethod}\nItens: ${saleData.items.reduce((a: number, b: any) => a + b.quantity, 0)}`,
        },
      };
      
      updated.push(orderNode);
      
      // 2. Create Product Nodes and Link
      const newConnections = [...connections];
      
      saleData.items.forEach((item: any, idx: number) => {
        // Create as many product nodes as the quantity? Or just one with quantity inside?
        // Our product node currently doesn't have a quantity field in UI, but we can just spawn one node per unique product for simplicity, 
        // or just spawn them based on quantity. Let's just spawn one product node per cart item for simplicity, and note the quantity in description.
        const newId = `node-product-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        const offsetX = (idx % 3) * 60;
        const offsetY = Math.floor(idx / 3) * 60 + 300;
        
        const posX = Math.round(-viewport.x / (viewport.scale || 1) + 200 + offsetX);
        const posY = Math.round(-viewport.y / (viewport.scale || 1) + 150 + offsetY);
        
        const productNode: CanvasNode = {
          id: newId,
          type: 'product',
          name: `${item.quantity}x ${item.name}`,
          x: posX,
          y: posY,
          width: 320,
          height: 270,
          status: 'Em Produção',
          color: 'indigo',
          createdAt: new Date().toLocaleDateString('pt-BR'),
          updatedAt: new Date().toLocaleDateString('pt-BR'),
          tags: ['Produto', item.category, 'Comercial'],
          data: {
            sku: `PED-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            productionStep: 'Separação/Estoque',
            responsible: 'Equipe de Expedição',
            progress: 0,
            qualityCheck: false,
            notes: `Venda via Terminal Comercial. Quantidade: ${item.quantity}\nValor Total: R$ ${(item.unitPrice * item.quantity).toFixed(2)}\n${item.description || ''}`,
          },
        };
        
        updated.push(productNode);
        
        // Link product to order
        newConnections.push({
          id: `conn-${newId}-to-${orderId}`,
          from: newId,
          to: orderId,
          type: 'solid'
        });
      });
      
      setConnections(newConnections);
      return updated;
    });
  };

  const handleAddProductNodes = (products: any[]) => {
    pushHistory();
    setNodes((prevNodes) => {
      const updated = [...prevNodes];
      products.forEach((prod, idx) => {
        const newId = `node-product-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        const offsetX = (idx % 3) * 60;
        const offsetY = Math.floor(idx / 3) * 50;
        
        const posX = Math.round(-viewport.x / (viewport.scale || 1) + 300 + offsetX);
        const posY = Math.round(-viewport.y / (viewport.scale || 1) + 150 + offsetY);
        
        const newNode: CanvasNode = {
          id: newId,
          type: 'product',
          name: prod.name,
          x: posX,
          y: posY,
          width: 320,
          height: 270,
          status: 'Em Produção',
          color: 'indigo',
          createdAt: new Date().toLocaleDateString('pt-BR'),
          updatedAt: new Date().toLocaleDateString('pt-BR'),
          tags: ['Produto', prod.category],
          data: {
            sku: prod.sku,
            unitPrice: prod.unitPrice,
            stockQty: prod.stockQty,
            minStockQty: prod.minStockQty,
            category: prod.category,
            description: prod.description,
            supplier: prod.supplier,
            dimensions: prod.dimensions,
            material: prod.material,
          },
        };
        updated.push(newNode);
      });
      return updated;
    });
  };

  const handleLinkProductsToOrder = (orderId: string, products: any[]) => {
    pushHistory();
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === orderId && node.type === 'order') {
          const currentItems = node.data.itemsList || [];
          const currentVal = node.data.orderValue || 0;
          
          const newItems = [...currentItems];
          let addedValue = 0;
          
          products.forEach((p) => {
            if (!newItems.includes(p.name)) {
              newItems.push(p.name);
            }
            addedValue += p.unitPrice;
          });
          
          return {
            ...node,
            data: {
              ...node.data,
              itemsList: newItems,
              orderValue: currentVal + addedValue,
            },
          };
        }
        return node;
      });
    });
  };

  const handleLinkProductsToProduct = (targetProductId: string, selectedProducts: any[]) => {
    pushHistory();
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === targetProductId && (node.type === 'product' || node.type === 'custom')) {
          const currentComponents = node.data.components || [];
          const currentComponentIds = node.data.componentIds || [];
          
          const newComponents = [...currentComponents];
          const newComponentIds = [...currentComponentIds];
          
          selectedProducts.forEach((p) => {
            if (!newComponents.includes(p.name)) {
              newComponents.push(p.name);
            }
            if (!newComponentIds.includes(p.id)) {
              newComponentIds.push(p.id);
            }
          });
          
          return {
            ...node,
            data: {
              ...node.data,
              components: newComponents,
              componentIds: newComponentIds,
            },
          };
        }
        return node;
      });
    });
  };


  // 🕒 AUTOPILOT TIMER & DATE MANAGEMENT
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutopilotActive) {
      timer = setInterval(() => {
        setSimulatedToday((prev) => {
          const parts = prev.split('-');
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          date.setDate(date.getDate() + 1);
          
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutopilotActive]);

  useEffect(() => {
    const handleOpenCal = () => setIsImmersiveCalendarOpen(true);
    window.addEventListener('open-immersive-calendar', handleOpenCal);
    return () => window.removeEventListener('open-immersive-calendar', handleOpenCal);
  }, []);

  // ⚙️ AUTOMATED AUTOPILOT CASCADING ENGINE
  useEffect(() => {
    // 1. Cascading Engine (Nodes update)
    setNodes((prevNodes) => {
      let hasAnyChange = false;
      let updated = [...prevNodes];

      const orderNodes = prevNodes.filter((n) => n.type === 'order');
      if (orderNodes.length === 0) return prevNodes;

      orderNodes.forEach((order) => {
        const deadline = order.data.deliveryDeadline || '2026-09-20';
        const start = '2026-09-01';

        const startParts = start.split('-');
        const endParts = deadline.split('-');
        const todayParts = simulatedToday.split('-');

        const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        const todayDate = new Date(parseInt(todayParts[0]), parseInt(todayParts[1]) - 1, parseInt(todayParts[2]));

        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedDuration = todayDate.getTime() - startDate.getTime();

        let calculatedProgress = 0;
        if (totalDuration > 0) {
          calculatedProgress = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
          if (calculatedProgress === 99) calculatedProgress = 100;
        } else {
          // If total duration is 0, consider it 100% completed if elapsed duration >= 0
          calculatedProgress = elapsedDuration >= 0 ? 100 : 0;
        }

        const remainingTime = endDate.getTime() - todayDate.getTime();
        const daysRemaining = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

        let orderStatus = 'Em Produção';
        if (calculatedProgress >= 100) {
          orderStatus = 'Entregue';
        } else if (daysRemaining < 0) {
          orderStatus = 'Atrasado';
        } else if (daysRemaining <= 3) {
          orderStatus = 'Alerta';
        }

        updated = updated.map((node) => {
          if (node.id === order.id) {
            if (
              node.status === orderStatus &&
              node.data.orderProgress === calculatedProgress &&
              node.data.deliveryDeadline === deadline
            ) {
              return node;
            }
            hasAnyChange = true;
            return {
              ...node,
              status: orderStatus,
              data: {
                ...node.data,
                orderProgress: calculatedProgress,
                deliveryDeadline: deadline,
              },
            };
          }

          if (false) {

            switch (node.type) {
              case 'project': {
                const newStatus = calculatedProgress >= 100 ? 'Concluído' : 'Em Execução';
                if (node.status === newStatus && node.data.projectProgress === calculatedProgress) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                  data: {
                    ...node.data,
                    projectProgress: calculatedProgress,
                  },
                };
              }
              case 'deadline': {
                const newStatus = daysRemaining < 0 ? 'Atrasado' : daysRemaining <= 3 ? 'Atenção' : 'No Prazo';
                
                const isOverridden = typeof node.data.progressPercent === 'number';
                
                if (
                  node.status === newStatus &&
                  node.data.dueDate === deadline &&
                  (isOverridden || node.data.progressPercent === calculatedProgress)
                ) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                  data: {
                    ...node.data,
                    dueDate: deadline,
                    ...(isOverridden ? {} : { progressPercent: calculatedProgress }),
                  },
                };
              }
              case 'checklist': {
                const items = node.data.items || [];
                const checkCount = Math.round((calculatedProgress / 100) * items.length);
                const updatedItems = items.map((it: any, index: number) => ({
                  ...it,
                  checked: index < checkCount,
                }));
                const newStatus = calculatedProgress >= 100 ? 'Concluído' : 'Em Andamento';
                const itemsChanged = JSON.stringify(items) !== JSON.stringify(updatedItems);
                if (node.status === newStatus && !itemsChanged) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                  data: {
                    ...node.data,
                    items: updatedItems,
                  },
                };
              }
              case 'attachment': {
                const attachments = node.data.attachments || [];
                const checkCount = Math.round((calculatedProgress / 100) * attachments.length);
                const updatedAttachments = attachments.map((att: any, index: number) => ({
                  ...att,
                  checked: index < checkCount,
                }));
                const newStatus = calculatedProgress >= 100 ? 'Concluído' : 'Em Andamento';
                const attChanged = JSON.stringify(attachments) !== JSON.stringify(updatedAttachments);
                if (node.status === newStatus && !attChanged) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                  data: {
                    ...node.data,
                    attachments: updatedAttachments,
                  },
                };
              }
              case 'kanban': {
                const newStatus = calculatedProgress >= 100 ? 'Concluído' : 'Em Andamento';
                
                const isOverridden = typeof node.data.progressPercent === 'number';

                if (
                  node.status === newStatus &&
                  (isOverridden || (node.data.progressPercent === calculatedProgress &&
                  node.data.currentValue === calculatedProgress))
                ) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                  data: {
                    ...node.data,
                    ...(isOverridden ? {} : { progressPercent: calculatedProgress, currentValue: calculatedProgress }),
                  },
                };
              }
              case 'indicator': {
                const newKpi = `${calculatedProgress}%`;
                if (node.data.kpiValue === newKpi) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    kpiValue: newKpi,
                  },
                };
              }
              case 'employee':
              case 'supervisor': {
                const newStatus = calculatedProgress >= 100 ? 'Disponível' : 'Em Serviço';
                if (node.status === newStatus) {
                  return node;
                }
                hasAnyChange = true;
                return {
                  ...node,
                  status: newStatus,
                };
              }
              default:
                return node;
            }
          }
          return node;
        });
      });

      return hasAnyChange ? updated : prevNodes;
    });

    // 2. AutoSync Engine (Connections update)
    setConnections(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (!c.autoSync) {
          const from = nodes.find(n => n.id === c.fromId);
          const to = nodes.find(n => n.id === c.toId);
          if (from && to) {
            const types = [from.type, to.type];
            const functionalTypes = ['progress', 'indicator', 'checklist', 'kanban', 'order', 'project', 'customer', 'invoice', 'financial_module'];
            if (types.every(t => functionalTypes.includes(t as any))) {
              changed = true;
              return { ...c, autoSync: true };
            }
          }
        }
        return c;
      });
      return changed ? next : prev;
    });
  }, [simulatedToday, nodes, connections]);


  // Multiple Boards / Lousas Handlers
  const handleSelectBoard = (targetBoardId: string) => {
    if (targetBoardId === activeBoardId) return;

    // 1. Save current active board's contents in the boards state list
    setBoards((prevBoards) =>
      prevBoards.map((b) =>
        b.id === activeBoardId
          ? { ...b, nodes, connections, viewport }
          : b
      )
    );

    // 2. Load the target board's states
    const targetBoard = boards.find((b) => b.id === targetBoardId);
    if (targetBoard) {
      setNodes(targetBoard.nodes);
      setConnections(targetBoard.connections);
      setViewport(targetBoard.viewport);
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
      setInvestigatedNodeId(null);
      setActiveBoardId(targetBoardId);
    }
  };

  const handleSaveAsDefaultProductTemplate = (boardId?: string) => {
    const targetBoardId = boardId || activeBoardId;
    const targetBoard = boards.find((b) => b.id === targetBoardId);

    const nodesToSave = targetBoardId === activeBoardId ? nodes : (targetBoard?.nodes || []);
    const connectionsToSave = targetBoardId === activeBoardId ? connections : (targetBoard?.connections || []);
    const viewportToSave = targetBoardId === activeBoardId ? viewport : (targetBoard?.viewport || { x: 40, y: 20, scale: 0.6 });

    const templateData = {
      id: 'default-product-template',
      name: targetBoard?.name || 'Modelo Padrão de Produto',
      nodes: JSON.parse(JSON.stringify(nodesToSave)),
      connections: JSON.parse(JSON.stringify(connectionsToSave)),
      viewport: viewportToSave,
      savedAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    localStorage.setItem('xcanvas_default_product_template', JSON.stringify(templateData));

    // Also update/insert into custom templates list
    try {
      const savedCustom = localStorage.getItem('xcanvas_custom_templates');
      const customList: WorkspaceTemplate[] = savedCustom ? JSON.parse(savedCustom) : [];
      const updatedList: WorkspaceTemplate[] = [
        {
          id: 'default-product-template',
          name: `★ Modelo Padrão de Produto (${templateData.name})`,
          description: `Modelo oficial da empresa salvo em ${templateData.savedAt} com ${nodesToSave.length} blocos e ${connectionsToSave.length} conexões.`,
          category: 'Modelo Padrão',
          nodes: JSON.parse(JSON.stringify(nodesToSave)),
          connections: JSON.parse(JSON.stringify(connectionsToSave)),
        },
        ...customList.filter((t) => t.id !== 'default-product-template'),
      ];
      localStorage.setItem('xcanvas_custom_templates', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error updating custom templates list:', e);
    }

    alert(
      `★ Lousa "${targetBoard?.name || 'Atual'}" salva como Modelo Padrão de Produto com sucesso!\n\n` +
      `Todas as novas lousas criadas através do botão "+ Nova Lousa" agora iniciarão automaticamente com esta estrutura.`
    );
  };

  const handleAddBoard = (name?: string) => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.permissions?.canCreateBoards === false) {
      alert('Seu usuário não possui permissão para criar novas lousas. Solicite autorização ao Administrador Geral (Ueliton).');
      return;
    }

    const newBoardId = `board-${Date.now()}`;
    const newBoardName = name || `Lousa ${boards.length + 1}`;

    // Load nodes and connections from saved default product template, or fallback to CONTROLE_PRODUCAO
    let defaultNodes = CONTROLE_PRODUCAO_NODES;
    let defaultConnections = CONTROLE_PRODUCAO_CONNECTIONS;
    let defaultViewport = { x: 40, y: 20, scale: 0.6 };

    try {
      const savedDefault = localStorage.getItem('xcanvas_default_product_template');
      if (savedDefault) {
        const parsed = JSON.parse(savedDefault);
        if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          defaultNodes = parsed.nodes;
          defaultConnections = parsed.connections || [];
          if (parsed.viewport) defaultViewport = parsed.viewport;
        }
      }
    } catch (e) {
      console.error('Error reading default product template:', e);
    }

    const newNodes = JSON.parse(JSON.stringify(defaultNodes));
    const newConnections = JSON.parse(JSON.stringify(defaultConnections));

    const newBoard: CanvasBoard = {
      id: newBoardId,
      name: newBoardName,
      nodes: newNodes,
      connections: newConnections,
      viewport: defaultViewport,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      userId: currentUser?.id,
      ownerName: currentUser?.name || 'Funcionário',
      isShared: currentUser?.role === 'admin',
    };

    // Save current active board first to preserve user progress
    const updatedBoards = boards.map((b) =>
      b.id === activeBoardId
        ? { ...b, nodes, connections, viewport }
        : b
    );

    setBoards([...updatedBoards, newBoard]);

    // Switch states to the new board
    setNodes(newNodes);
    setConnections(newConnections);
    setViewport(defaultViewport);
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
    setInvestigatedNodeId(null);
    setActiveBoardId(newBoardId);
  };

  const handleRenameBoard = (boardId: string, newName: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name: newName } : b))
    );
  };

  const handleDuplicateBoard = (boardId: string) => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.permissions?.canCreateBoards === false) {
      alert('Seu usuário não possui permissão para duplicar lousas. Solicite autorização ao Administrador Geral (Ueliton).');
      return;
    }

    const boardToDup = boardId === activeBoardId
      ? { id: activeBoardId, name: boards.find(b => b.id === activeBoardId)?.name || 'Cópia', nodes, connections, viewport }
      : boards.find((b) => b.id === boardId);

    if (!boardToDup) return;

    const newBoardId = `board-${Date.now()}`;
    const clonedNodes = JSON.parse(JSON.stringify(boardToDup.nodes));
    const clonedConnections = JSON.parse(JSON.stringify(boardToDup.connections));

    const newBoard: CanvasBoard = {
      id: newBoardId,
      name: `${boardToDup.name} (Cópia)`,
      nodes: clonedNodes,
      connections: clonedConnections,
      viewport: { ...boardToDup.viewport },
      createdAt: new Date().toLocaleDateString('pt-BR'),
      userId: currentUser?.id,
      ownerName: currentUser?.name || 'Funcionário',
      isShared: false,
    };

    setBoards((prev) => [...prev, newBoard]);
  };

  const handleClearBoard = (boardId: string) => {
    if (boardId === activeBoardId) {
      pushHistory();
      setNodes([]);
      setConnections([]);
    } else {
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, nodes: [], connections: [] } : b))
      );
    }
  };

  const handleResetAllData = () => {
    if (window.confirm('Tem certeza de que deseja APAGAR TUDO? Isso excluirá permanentemente todas as lousas, quadros, cartões e conexões.')) {
      pushHistory();
      
      const newDefaultBoard: CanvasBoard = {
        id: 'board-1',
        name: 'Controle de Produção — Lousa Única',
        nodes: [],
        connections: [],
        viewport: { x: 40, y: 20, scale: 0.6 },
        createdAt: new Date().toLocaleDateString('pt-BR'),
        userId: currentUser?.id || 'user-ueliton',
        ownerName: currentUser?.name || 'Ueliton',
        isShared: true,
      };

      setNodes([]);
      setConnections([]);
      setViewport({ x: 40, y: 20, scale: 0.6 });
      setBoards([newDefaultBoard]);
      setActiveBoardId('board-1');

      try {
        localStorage.removeItem('xcanvas_boards_backup');
        localStorage.setItem('xcanvas_boards_backup', JSON.stringify([newDefaultBoard]));
      } catch (e) {
        console.warn('Erro ao salvar reset local:', e);
      }
      

      alert('Tudo foi apagado com sucesso! Iniciando com uma lousa totalmente limpa.');
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    const targetBoard = boards.find((b) => b.id === boardId);
    if (!targetBoard) return;

    if (currentUser && currentUser.role !== 'admin' && currentUser.permissions?.canDeleteBoards === false) {
      alert('Seu usuário não possui permissão para excluir lousas. Solicite autorização ao Administrador Geral (Ueliton).');
      return;
    }

    if (currentUser?.role !== 'admin' && targetBoard.userId && targetBoard.userId !== currentUser?.id) {
      alert('Você não tem permissão para excluir um quadro de outro funcionário.');
      return;
    }

    if (boards.length <= 1) return;

    const updatedBoards = boards.filter((b) => b.id !== boardId);
    setBoards(updatedBoards);

    if (activeBoardId === boardId) {
      const nextBoard = updatedBoards[0];
      setNodes(nextBoard.nodes);
      setConnections(nextBoard.connections);
      setViewport(nextBoard.viewport);
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
      setInvestigatedNodeId(null);
      setActiveBoardId(nextBoard.id);
    }
  };

  const handleLoginSuccess = (user: EmployeeUser) => {
    setCurrentUser(user);
    setActiveSession(user);
    setIsLoginModalOpen(false);
    setUserDropdownOpen(false);

    // If regular employee doesn't have a board yet, auto-create one
    if (user.role === 'employee') {
      const userBoards = boards.filter((b) => b.userId === user.id);
      if (userBoards.length === 0) {
        const newEmployeeBoard: CanvasBoard = {
          id: `board-${user.id}-${Date.now()}`,
          name: `Quadro de ${user.name}`,
          nodes: [],
          connections: [],
          viewport: { x: 80, y: 40, scale: 0.85 },
          createdAt: new Date().toLocaleDateString('pt-BR'),
          userId: user.id,
          ownerName: user.name,
          isShared: false,
        };
        setBoards((prev) => [...prev, newEmployeeBoard]);
        setActiveBoardId(newEmployeeBoard.id);
        setNodes([]);
        setConnections([]);
        setViewport({ x: 80, y: 40, scale: 0.85 });
      } else {
        const first = userBoards[0];
        setActiveBoardId(first.id);
        setNodes(first.nodes);
        setConnections(first.connections);
        setViewport(first.viewport);
        if (first.theme) setCanvasTheme(first.theme);
      }
    }
  };

  const handleLogout = () => {
    setActiveSession(null);
    setCurrentUser(null);
    setUserDropdownOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleOpenNodeDetail = (nodeId: string) => {
    setNodeDetailTargetId(nodeId);
    setIsNodeDetailOpen(true);
  };

  const handleOpenSectorReport = (nodeId: string) => {
    setSectorReportTargetId(nodeId);
    setIsSectorReportOpen(true);
  };

  const handleUpdateFullNode = (updatedNode: CanvasNode) => {
    pushHistory();
    setNodes((prevNodes) => {
      let nextNodes = prevNodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
      let nextConns = [...connections];
      let hasUpdates = false;

      connections.forEach((conn) => {
        if (conn.autoSync && (conn.fromId === updatedNode.id || conn.toId === updatedNode.id)) {
          const fromNode = nextNodes.find((n) => n.id === conn.fromId);
          const toNode = nextNodes.find((n) => n.id === conn.toId);
          if (fromNode && toNode) {
            const syncResult = synchronizeFlowData(fromNode, toNode, conn);
            hasUpdates = true;
            nextNodes = nextNodes.map((n) => {
              if (n.id === syncResult.updatedFromNode.id) return syncResult.updatedFromNode;
              if (n.id === syncResult.updatedToNode.id) return syncResult.updatedToNode;
              return n;
            });
            nextConns = nextConns.map((c) =>
              c.id === conn.id ? { ...c, ...syncResult.updatedConnection } : c
            );
          }
        }
      });

      if (hasUpdates) {
        setConnections(nextConns);
      }
      return nextNodes;
    });
  };

  // Push History helper
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), { nodes, connections }]);
    setFuture([]);
  }, [nodes, connections]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [{ nodes, connections }, ...prev]);
    setNodes(previous.nodes);
    setConnections(previous.connections);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }, [history, nodes, connections]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [...prev, { nodes, connections }]);
    setNodes(next.nodes);
    setConnections(next.connections);
    setFuture((prev) => prev.slice(1));
  }, [future, nodes, connections]);

  // Zoom Controls
  const handleZoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 4.0),
    }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.04),
    }));
  };

  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }
    const bb = calculateBoundingBox(nodes);
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const padding = 120;

    const scaleX = (windowW - padding * 2) / bb.width;
    const scaleY = (windowH - padding * 2) / bb.height;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.2);

    const centerX = (windowW - bb.width * fitScale) / 2 - bb.minX * fitScale;
    const centerY = (windowH - bb.height * fitScale) / 2 - bb.minY * fitScale;

    setViewport({ x: centerX, y: centerY, scale: fitScale });
  }, [nodes]);

  // Select Node
  const handleSelectNode = (nodeId: string | null, isMulti?: boolean) => {
    if (!nodeId) {
      setSelectedNodeIds([]);
      if (canvasMode === 'investigation') {
        setInvestigatedNodeId(null);
      }
      return;
    }

    if (canvasMode === 'investigation') {
      setInvestigatedNodeId(nodeId);
      setSelectedNodeIds([nodeId]);
      return;
    }

    if (isMulti) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
    setSelectedConnectionId(null);
  };

  // Move Nodes (Delta)
  const handleMoveNodes = (deltas: { id: string; x: number; y: number }[]) => {
    setNodes((prev) => {
      // Pre-calculate to avoid referencing stale state during map
      const currentNodes = [...prev];
      return prev.map((n) => {
        const found = deltas.find((d) => d.id === n.id);
        if (found && !n.locked) {
          // Resolve collisions against all nodes that are not being moved in this same batch
          // or just resolve against everything for simplicity
          const resolved = resolveNodeCollisions(n.id, found.x, found.y, currentNodes);
          return { ...n, x: resolved.x, y: resolved.y };
        }
        return n;
      });
    });
  };

  // Resize Node
  const handleResizeNode = (id: string, width: number, height: number) => {
    pushHistory();
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, width, height } : n))
    );
  };

  // Create Node
  const handleCreateNode = (type: NodeType, coords: { x: number; y: number }) => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.permissions?.canEditNodes === false) {
      alert('Seu usuário não possui permissão para adicionar novos elementos ao quadro. Solicite autorização ao Administrador Geral (Ueliton).');
      return;
    }

    pushHistory();
    const id = `node-${type}-${Date.now()}`;
    let defaultWidth = 320;
    let defaultHeight = 220;
    let defaultName = 'Novo Objeto';
    let defaultColor: NodeColor = 'blue';
    let defaultData: any = {};

    switch (type) {
      case 'customer':
        defaultName = 'Novo Cliente';
        defaultWidth = 320;
        defaultHeight = 220;
        defaultData = {
          cnpj: '12.345.678/0001-90',
          contactName: 'Diretor Comercial',
          phone: '(11) 98765-4321',
          email: 'contato@novocliente.com',
          address: 'São Paulo - SP',
          ordersCount: 1,
          projectsCount: 1,
          totalRevenue: 'R$ 100.000',
        };
        break;
      case 'order':
        defaultName = 'Pedido #PED-' + Math.floor(1000 + Math.random() * 9000);
        defaultWidth = 320;
        defaultHeight = 290;
        defaultData = {
          orderCode: 'PED-' + Math.floor(1000 + Math.random() * 9000),
          orderValue: 120000,
          customerName: 'Cliente Associado',
          deliveryDeadline: '2026-10-30',
          orderProgress: 15,
          itemsList: ['Estrutura e componentes principais', 'Montagem técnica'],
        };
        break;
      case 'invoice':
        defaultName = 'NF-e 000.' + Math.floor(100 + Math.random() * 900) + '.821';
        defaultWidth = 330;
        defaultHeight = 250;
        defaultData = {
          invoiceNumber: '000.' + Math.floor(100 + Math.random() * 900) + '.821',
          invoiceSeries: '1',
          invoiceStatus: 'autorizada',
          invoiceKey: '3526 0910 2938 4700 0182 5500 1000 1048 2110 9283 7461',
          recipientName: 'Cliente Associado',
          invoiceTotal: 185000,
          issueDate: '01/09/2026',
        };
        break;
      case 'project':
        defaultName = 'Projeto PX-' + Math.floor(100 + Math.random() * 900);
        defaultWidth = 340;
        defaultHeight = 280;
        defaultData = {
          projectCode: 'PX-2026',
          clientName: 'Cliente Associado',
          projectProgress: 25,
          subModules: ['Modelagem 3D', 'Elétrica e Automação', 'Testes'],
        };
        break;
      case 'checklist':
        defaultName = 'Checklist Operacional';
        defaultWidth = 330;
        defaultHeight = 310;
        defaultData = {
          items: [
            { id: '1', text: 'Conferência de matérias-primas', checked: false },
            { id: '2', text: 'Inspeção dimensional preliminar', checked: false },
            { id: '3', text: 'Liberação para montagem', checked: false },
          ],
        };
        break;
      case 'attachment':
        defaultName = 'Central de Anexos & URLs';
        defaultWidth = 350;
        defaultHeight = 340;
        defaultData = {
          attachments: [
            { id: 'att-1', name: 'Desenho Técnico (CAD)', url: 'https://drive.google.com/file/d/sample-cad', type: 'cad', checked: true },
            { id: 'att-2', name: 'Especificação Técnica PDF', url: 'https://drive.google.com/file/d/sample-pdf', type: 'pdf', checked: true },
            { id: 'att-3', name: 'Planilha de Custo / Orçamento', url: 'https://docs.google.com/spreadsheets/d/sample-sheet', type: 'doc', checked: false },
          ],
        };
        break;
      case 'kanban':
        defaultName = 'Fluxo de Tarefas';
        defaultWidth = 620;
        defaultHeight = 360;
        defaultData = {
          columns: [
            { id: 'col-todo', title: 'A FAZER', color: '#64748b' },
            { id: 'col-in-progress', title: 'EM ANDAMENTO', color: '#3b82f6' },
            { id: 'col-done', title: 'CONCLUÍDO', color: '#10b981' },
          ],
          cards: [
            { id: 'c1', title: 'Elaborar plano de montagem', columnId: 'col-todo', priority: 'alta' },
            { id: 'c2', title: 'Comprar componentes de reposição', columnId: 'col-in-progress', priority: 'media' },
          ],
        };
        break;
      case 'deadline':
        defaultName = 'Prazo Crítico de Entrega';
        defaultWidth = 320;
        defaultHeight = 420;
        defaultData = {
          dueDate: '2026-09-30',
          startDate: '2026-09-01',
          progressPercent: 40,
        };
        break;
      case 'calendar':
        defaultName = 'Calendário Executivo & Prazos';
        defaultWidth = 340;
        defaultHeight = 280;
        defaultData = {
          eventsCount: 12,
          activeDeadlines: 4,
        };
        break;
      case 'indicator':
        defaultName = 'Indicador de Eficiência';
        defaultWidth = 240;
        defaultHeight = 140;
        defaultData = {
          kpiTitle: 'EFICIÊNCIA GLOBAL (OEE)',
          kpiValue: '91.4%',
          kpiTrend: '+4.2%',
          kpiTrendType: 'up',
          kpiUnit: 'Turno A',
        };
        break;
      case 'progress':
        defaultName = 'Barra de Progresso';
        defaultWidth = 320;
        defaultHeight = 185;
        defaultData = {
          currentValue: 65,
          colorTheme: 'emerald',
          subtitle: 'Barra de Progresso Personalizada',
        };
        break;
      case 'note':
        defaultName = 'Lembrete Importante';
        defaultWidth = 260;
        defaultHeight = 200;
        defaultData = {
          noteText: 'Reunião de alinhamento com a equipe de engenharia na sexta-feira às 14h.',
          isWarning: false,
        };
        break;
      case 'group':
        defaultName = 'Novo Setor';
        defaultWidth = 680;
        defaultHeight = 460;
        defaultData = {
          groupIcon: 'Layers',
          description: 'Setor delimitado de processos',
        };
        break;
      case 'document':
        defaultName = 'Especificação Técnica';
        defaultWidth = 300;
        defaultHeight = 200;
        defaultData = {
          docType: 'PDF',
          docVersion: 'v1.0',
          fileSize: '4.2 MB',
          description: 'Documento contendo especificações técnicas e requisitos normativos.',
        };
        break;
      case 'custom':
        defaultName = 'Objeto Personalizado';
        defaultWidth = 320;
        defaultHeight = 250;
        defaultData = {
          description: 'Objeto configurado com ferramentas específicas',
          attributes: [
            { label: 'Setor', value: 'Engenharia' },
            { label: 'Prioridade', value: 'Alta' },
            { label: 'Status', value: 'Ativo' },
          ],
          enabledTools: ['checklist', 'notes', 'timer'],
        };
        break;
      case 'finalized_order':
        defaultName = 'Pedido Finalizado & Aprovado';
        defaultWidth = 340;
        defaultHeight = 360;
        defaultData = {
          orderCode: 'PED-' + Math.floor(1000 + Math.random() * 9000),
          customerName: 'Indústria Metalúrgica Delta S/A',
          customerCnpj: '61.239.401/0001-12',
          orderValue: 412000,
          finalizedDate: new Date().toISOString().split('T')[0],
          invoiceNumber: 'NF-' + Math.floor(10000 + Math.random() * 90000),
          qualityScore: '100% Aprovado',
          itemsList: [
            'Linha de Montagem Automatizada',
            'Painel CLP e Inversores de Frequência',
            'Laudo de Conformidade NR-12',
          ],
        };
        break;
      case 'financial_module':
        defaultName = 'Módulo Financeiro & Fiscal';
        defaultWidth = 350;
        defaultHeight = 380;
        defaultData = {
          grossRevenue: 480000,
          productionCost: 285000,
          taxes: 52800,
          paymentStatus: 'Liquidado / Recebido',
          fiscalCode: 'NF-e 0049219 - SP',
        };
        break;
      case 'product':
        defaultName = 'Redutor de Velocidade 50HP';
        defaultWidth = 320;
        defaultHeight = 270;
        defaultColor = 'indigo';
        defaultData = {
          sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000),
          unitPrice: 28500,
          stockQty: 32,
          minStockQty: 8,
          category: 'Transmissão Mecânica',
        };
        break;
      case 'part':
        defaultName = 'Engrenagem Helicoidal Z-45';
        defaultWidth = 320;
        defaultHeight = 260;
        defaultColor = 'cyan';
        defaultData = {
          partNumber: 'PN-' + Math.floor(1000 + Math.random() * 9000),
          material: 'Aço Liga SAE 4340 Temprado',
          dimensions: 'Ø 180mm x 55mm',
          partStock: 85,
          supplier: 'Metalúrgica Precision Ltda',
        };
        break;
      case 'service':
        defaultName = 'Usinagem CNC de Alta Precisão';
        defaultWidth = 320;
        defaultHeight = 265;
        defaultColor = 'purple';
        defaultData = {
          serviceCode: 'SRV-' + Math.floor(1000 + Math.random() * 9000),
          hourlyRate: 220,
          estimatedHours: 18,
          serviceCategory: 'Usinagem & Calibração',
        };
        break;
      case 'employee':
        defaultName = 'Marcos Oliveira';
        defaultWidth = 300;
        defaultHeight = 240;
        defaultColor = 'blue';
        defaultData = {
          employeeId: 'RE-' + Math.floor(1000 + Math.random() * 9000),
          role: 'Operador de Usinagem CNC',
          shift: 'Turno A (07:00 - 16:48)',
          department: 'Usinagem Heavy-Duty',
          employeeStatus: 'Em Serviço',
        };
        break;
      case 'supervisor':
        defaultName = 'Eng. Roberto Silva';
        defaultWidth = 320;
        defaultHeight = 270;
        defaultColor = 'amber';
        defaultData = {
          supervisorId: 'ENC-' + Math.floor(100 + Math.random() * 900),
          managedSector: 'Caldeiraria & Solda Especializada',
          subordinatesCount: 16,
          certifications: ['NR-12', 'ISO 9001', 'Green Belt Six Sigma'],
        };
        break;
      case 'sector':
        defaultName = 'Setor de Usinagem CNC';
        defaultWidth = 320;
        defaultHeight = 270;
        defaultColor = 'emerald';
        defaultData = {
          sectorCode: 'ST-USINAGEM-' + Math.floor(10 + Math.random() * 90),
          sectorCapacity: '92% Ocupação',
          activeWorkers: 18,
          activeMachineCount: 9,
        };
        break;
      case 'interrupted_flow':
        defaultName = 'Fluxo Interrompido';
        defaultWidth = 360;
        defaultHeight = 420;
        defaultColor = 'rose';
        defaultData = {
          incidentDescription: 'Parada não planejada do processo por falha operacional.',
          incidentDate: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          incidentResponsible: 'Líder de Turno',
          incidentResolutionDate: 'Previsão: Hoje às 18:00',
          isResolved: false,
        };
        break;
      case 'order':
        defaultName = 'Pedido';
        defaultWidth = 320;
        defaultHeight = 350;
        defaultColor = 'emerald';
        defaultData = {
          orderNumber: '#' + Math.floor(10000 + Math.random() * 90000),
          customerName: 'Empresa ABC S/A',
          orderValue: 250000,
          deliveryDeadline: '2026-09-20',
        };
        break;
      case 'production_order':
        defaultName = 'Ordem de Produção';
        defaultWidth = 320;
        defaultHeight = 350;
        defaultColor = 'amber';
        defaultData = {
          opNumber: 'OP-' + Math.floor(1000 + Math.random() * 9000),
          refOrder: '#' + Math.floor(10000 + Math.random() * 90000),
          priority: 'Normal',
          deadline: '2026-09-15',
        };
        break;
      case 'production_route':
        defaultName = 'Roteiro de Produção: Usinagem & Montagem';
        defaultWidth = 360;
        defaultHeight = 460;
        defaultColor = 'cyan';
        defaultData = {
          routeCode: 'ROT-2026-' + Math.floor(10 + Math.random() * 90),
          productTarget: 'Eixo de Transmissão 50HP',
          startDate: '2026-09-02',
          dueDate: '2026-09-22',
          overallRouteProgress: 40,
          steps: [
            {
              id: 'step-10',
              sequence: 10,
              name: 'Corte e Preparação de Tarugo SAE 4340',
              machineOrWorkcenter: 'Serra Fita Automática S-320',
              operator: 'Marcos Silva (RE-204)',
              startDate: '2026-09-02',
              deadline: '2026-09-04',
              estimatedHours: 4,
              status: 'Concluído',
            },
            {
              id: 'step-20',
              sequence: 20,
              name: 'Torneamento CNC e Desbaste Pesado',
              machineOrWorkcenter: 'Torno CNC Romi GL-240',
              operator: 'Carlos Eduardo (RE-118)',
              startDate: '2026-09-05',
              deadline: '2026-09-09',
              estimatedHours: 12,
              status: 'Em Andamento',
            },
            {
              id: 'step-30',
              sequence: 30,
              name: 'Fresamento de Canais e Rasgos de Chaveta',
              machineOrWorkcenter: 'Centro de Usinagem 4 Eixos Haas',
              operator: 'André Luiz (RE-305)',
              startDate: '2026-09-10',
              deadline: '2026-09-14',
              estimatedHours: 8,
              status: 'Pendente',
            },
            {
              id: 'step-40',
              sequence: 40,
              name: 'Tratamento Térmico por Indução & Retífica',
              machineOrWorkcenter: 'Forno de Têmpera / Retífica Cilíndrica',
              operator: 'Eng. Roberto (RE-102)',
              startDate: '2026-09-15',
              deadline: '2026-09-18',
              estimatedHours: 10,
              status: 'Pendente',
            },
            {
              id: 'step-50',
              sequence: 50,
              name: 'Inspeção Dimensional & Controle de Qualidade (CQ)',
              machineOrWorkcenter: 'Laboratório Metrológico 3D Tridimensional',
              operator: 'Inspetor Qualidade CQ',
              startDate: '2026-09-19',
              deadline: '2026-09-22',
              estimatedHours: 4,
              status: 'Pendente',
            },
          ],
        };
        break;
      default:
        defaultName = 'Texto';
        defaultWidth = 280;
        defaultHeight = 180;
        defaultData = {
          content: 'Clique duas vezes para editar o texto...',
        };
    }

    // Resolve collision for the new node
    const resolved = resolveNodeCollisions(id, coords.x, coords.y, [...nodes, { id, width: defaultWidth, height: defaultHeight, type } as any]);

    // Attempt to auto-assign to a sector if possible
    const enclosingSector = nodes.find(n => 
      n.type === 'sector' &&
      resolved.x >= n.x &&
      resolved.y >= n.y &&
      resolved.x + defaultWidth <= n.x + n.width &&
      resolved.y + defaultHeight <= n.y + n.height
    );

    const newNode: CanvasNode = {
      id,
      name: defaultName,
      type,
      x: resolved.x,
      y: resolved.y,
      width: defaultWidth,
      height: defaultHeight,
      status: 'Ativo',
      color: defaultColor,
      createdAt: '01/09/2026',
      updatedAt: '01/09/2026',
      tags: [type],
      data: defaultData,
      groupId: enclosingSector?.id, // Assign sector
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeIds([id]);
  };

  // Quick Add Node from bottom dock
  const handleQuickAddNode = (type: NodeType) => {
    // Add near center of current viewport
    const centerX = -viewport.x / viewport.scale + window.innerWidth / (2 * viewport.scale) - 150;
    const centerY = -viewport.y / viewport.scale + window.innerHeight / (2 * viewport.scale) - 100;
    handleCreateNode(type, { x: Math.round(centerX), y: Math.round(centerY) });
  };

  // Connect Nodes with Intelligent Flow Synchronization
  const handleConnectNodes = (
    fromId: string,
    toId: string,
    fromHandle?: ConnectionHandle,
    toHandle?: ConnectionHandle
  ) => {
    if (fromId === toId) return;
    pushHistory();

    const fromNode = nodes.find((n) => n.id === fromId);
    const toNode = nodes.find((n) => n.id === toId);

    const isInterruptedType = fromNode?.type === 'interrupted_flow' || toNode?.type === 'interrupted_flow';

    // Initial connection object
    let newConn: Connection = {
      id: `conn-${Date.now()}`,
      fromId,
      toId,
      fromHandle: fromHandle || 'right-2',
      toHandle: toHandle || 'left-2',
      label: isInterruptedType ? 'Interrupção de Fluxo' : 'relacionado',
      lineStyle: 'curved',
      color: isInterruptedType ? '#f43f5e' : '#38bdf8',
      strokePattern: isInterruptedType ? 'dashed' : 'solid',
      arrow: 'end',
      animated: true,
      autoSync: true, // Habilitar sincronização automática por padrão
    };

    // Auto synchronize data between connected nodes (e.g. Customer -> Order, Order -> Project, Order -> Invoice)
    if (fromNode && toNode) {
      const syncResult = synchronizeFlowData(fromNode, toNode, newConn);
      newConn = {
        ...newConn,
        ...syncResult.updatedConnection,
      };

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === syncResult.updatedFromNode.id) return syncResult.updatedFromNode;
          if (n.id === syncResult.updatedToNode.id) return syncResult.updatedToNode;
          return n;
        })
      );
    }

    setConnections((prev) => [...prev, newConn]);
    setSelectedConnectionId(newConn.id);
  };

  // Connect Node directly to an existing Connection Line
  const handleConnectToLine = (
    fromId: string,
    targetConnectionId: string,
    fromHandle?: ConnectionHandle
  ) => {
    pushHistory();
    const targetConn = connections.find((c) => c.id === targetConnectionId);
    if (!targetConn) return;

    const fromNode = nodes.find((n) => n.id === fromId);

    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      fromId,
      toId: targetConn.fromId,
      toConnectionId: targetConnectionId,
      fromHandle: fromHandle || 'bottom-2',
      toHandle: 'top-2',
      label: fromNode?.type === 'interrupted_flow' ? 'Interrupção de Fluxo' : 'Conectado à Linha',
      lineStyle: 'curved',
      color: fromNode?.type === 'interrupted_flow' ? '#f43f5e' : '#38bdf8',
      strokePattern: fromNode?.type === 'interrupted_flow' ? 'dashed' : 'solid',
      arrow: 'end',
      animated: true,
    };

    setConnections((prev) => [...prev, newConn]);
    setSelectedConnectionId(newConn.id);
  };

  // Explicitly sync data for a specific connection
  const handleSyncConnectionData = (connId: string) => {
    const conn = connections.find((c) => c.id === connId);
    if (!conn) return;
    const fromNode = nodes.find((n) => n.id === conn.fromId);
    const toNode = nodes.find((n) => n.id === conn.toId);
    if (!fromNode || !toNode) return;

    pushHistory();
    const syncResult = synchronizeFlowData(fromNode, toNode, conn);

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === syncResult.updatedFromNode.id) return syncResult.updatedFromNode;
        if (n.id === syncResult.updatedToNode.id) return syncResult.updatedToNode;
        return n;
      })
    );
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, ...syncResult.updatedConnection } : c))
    );
  };

  // Automatically reorganize nodes in clean, sequential workflow columns
  const handleReorganizeNodes = () => {
    if (nodes.length === 0) return;
    pushHistory();

    // Mapping industrial process steps to layout column levels
    const typeOrderMap: Record<string, number> = {
      customer: 0,
      invoice: 0,
      order: 1,
      kanban: 2,
      part: 3,
      product: 3,
      service: 3,
      custom: 3,
      employee: 4,
      supervisor: 4,
      sector: 4,
      deadline: 5,
      indicator: 5,
      group: 5,
    };

    const nodeLevels: Record<string, number> = {};
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    nodes.forEach((n) => {
      nodeLevels[n.id] = -1;
      inDegree[n.id] = 0;
      adjList[n.id] = [];
    });

    connections.forEach((c) => {
      if (adjList[c.fromId] && adjList[c.toId]) {
        adjList[c.fromId].push(c.toId);
        inDegree[c.toId]++;
      }
    });

    // Solve levels topologically using Breadth-First Search
    const queue: string[] = [];
    nodes.forEach((n) => {
      if (inDegree[n.id] === 0) {
        nodeLevels[n.id] = 0;
        queue.push(n.id);
      }
    });

    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentLevel = nodeLevels[currentId];
      adjList[currentId].forEach((neighborId) => {
        const nextLevel = Math.max(nodeLevels[neighborId], currentLevel + 1);
        nodeLevels[neighborId] = nextLevel;
        queue.push(neighborId);
      });
    }

    // Set fallback level for disconnected components based on their logical stage
    nodes.forEach((n) => {
      if (nodeLevels[n.id] === -1) {
        const typeLevel = typeOrderMap[n.type] ?? 3;
        nodeLevels[n.id] = typeLevel;
      }
    });

    // Column groups list
    const columns: Record<number, CanvasNode[]> = {};
    nodes.forEach((n) => {
      const lvl = nodeLevels[n.id];
      if (!columns[lvl]) columns[lvl] = [];
      columns[lvl].push(n);
    });

    const columnWidth = 650;
    const rowHeight = 450;

    // Apply structured grid coordinates based on levels
    const updatedNodes = nodes.map((n) => {
      const lvl = nodeLevels[n.id];
      const columnNodes = columns[lvl];
      const indexInColumn = columnNodes.indexOf(n);

      const totalInColumn = columnNodes.length;
      const startY = -((totalInColumn - 1) * rowHeight) / 2;

      const posX = lvl * columnWidth + 100;
      const posY = startY + indexInColumn * rowHeight + 150;

      return {
        ...n,
        x: Math.round(posX),
        y: Math.round(posY),
      };
    });

    setNodes(updatedNodes);

    // Smoothly focus the newly reorganized view in the middle of the viewport
    setTimeout(() => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      updatedNodes.forEach((node) => {
        const w = node.width || 280;
        const h = node.height || 180;
        if (node.x < minX) minX = node.x;
        if (node.x + w > maxX) maxX = node.x + w;
        if (node.y < minY) minY = node.y;
        if (node.y + h > maxY) maxY = node.y + h;
      });

      if (minX === Infinity) return;

      const padding = 120;
      const boundsWidth = maxX - minX + padding * 2;
      const boundsHeight = maxY - minY + padding * 2;

      const scaleX = window.innerWidth / boundsWidth;
      const scaleY = window.innerHeight / boundsHeight;
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.0);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setViewport({
        x: window.innerWidth / 2 - centerX * newScale,
        y: window.innerHeight / 2 - centerY * newScale,
        scale: Number(newScale.toFixed(2)),
      });
    }, 100);
  };

  // Open Invoice Modal with optional target node focus
  const handleOpenInvoiceModal = (targetNodeId?: string) => {
    setInvoiceTargetNodeId(targetNodeId || null);
    setIsInvoiceModalOpen(true);
  };

  // Attach an emitted NF-e directly as a node to the canvas
  const handleAttachInvoiceNodeToCanvas = (doc: InvoiceDocument, originNodeId?: string) => {
    pushHistory();
    const originNode = nodes.find((n) => n.id === originNodeId);
    const posX = originNode ? originNode.x + originNode.width + 120 : 600;
    const posY = originNode ? originNode.y : 300;

    const newInvoiceNodeId = `node-invoice-${Date.now()}`;
    const newInvoiceNode: CanvasNode = {
      id: newInvoiceNodeId,
      name: `NF-e ${doc.nfeNumber}`,
      type: 'invoice',
      x: posX,
      y: posY,
      width: 340,
      height: 250,
      status: 'Aprovado',
      color: 'emerald',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      tags: ['nfe', 'fiscal', doc.recipientName.split(' ')[0].toLowerCase()],
      data: {
        invoiceNumber: doc.nfeNumber,
        nfeKey: doc.nfeKey,
        nfeProtocol: doc.protocolNumber,
        recipientName: doc.recipientName,
        customerCnpj: doc.recipientCnpj,
        invoiceValue: doc.grandTotal,
        issueDate: doc.issueDate,
        nfeStatus: 'Autorizada',
        description: `Nota fiscal eletrônica emitida referente a ${doc.items.map((i) => i.description).join(', ')}`,
      },
    };

    setNodes((prev) => [...prev, newInvoiceNode]);

    // If there is an origin node, connect them automatically
    if (originNodeId) {
      const conn: Connection = {
        id: `conn-inv-${Date.now()}`,
        fromId: originNodeId,
        toId: newInvoiceNodeId,
        fromHandle: 'right-2',
        toHandle: 'left-2',
        label: 'emitiu NF-e',
        relationType: 'order_to_invoice',
        lineStyle: 'curved',
        color: '#10b981',
        arrow: 'end',
        animated: true,
        dataExchange: {
          customerName: doc.recipientName,
          orderValue: doc.grandTotal,
        },
      };
      setConnections((prev) => [...prev, conn]);
    }

    setSelectedNodeIds([newInvoiceNodeId]);
  };

  // Delete Selection
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length === 0 && !selectedConnectionId) return;

    if (currentUser && currentUser.role !== 'admin' && currentUser.permissions?.canEditNodes === false) {
      alert('Seu usuário não possui permissão para excluir elementos do quadro. Solicite autorização ao Administrador Geral (Ueliton).');
      return;
    }

    pushHistory();

    if (selectedNodeIds.length > 0) {
      setNodes((prev) => prev.filter((n) => !selectedNodeIds.includes(n.id)));
      setConnections((prev) =>
        prev.filter(
          (c) => !selectedNodeIds.includes(c.fromId) && !selectedNodeIds.includes(c.toId)
        )
      );
      setSelectedNodeIds([]);
    }

    if (selectedConnectionId) {
      setConnections((prev) => prev.filter((c) => c.id !== selectedConnectionId));
      setSelectedConnectionId(null);
    }
  }, [selectedNodeIds, selectedConnectionId, pushHistory]);

  // Update Node Data
  const handleUpdateNodeData = (nodeId: string, data: Partial<CanvasNode['data']>) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    handleUpdateFullNode({ ...node, data: { ...node.data, ...data } });
  };

  const handleConvertToOrder = (budgetId: string) => {
    const node = nodes.find((n) => n.id === budgetId);
    if (!node) return;
    const newSalesNum = generateNextNumber('order');
    const custName = node.data.customerName || 'Cliente';
    const newTitle = `Pedido #${newSalesNum} - ${custName}`;
    
    const updated: CanvasNode = {
      ...node,
      type: 'order',
      name: newTitle,
      color: 'emerald',
      updatedAt: new Date().toISOString(),
      data: {
        ...node.data,
        orderType: 'order',
        salesOrderNumber: newSalesNum,
        commercialStatus: 'Pedido de Venda Confirmado',
      },
    };
    handleUpdateFullNode(updated);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    pushHistory();
    const newId = `node-${node.type}-${Date.now()}`;
    // Resolve collision for the new duplicated node
    const resolved = resolveNodeCollisions(newId, node.x + 40, node.y + 40, nodes);
    
    const duplicatedNode: CanvasNode = {
      ...node,
      id: newId,
      name: `${node.name} (Cópia)`,
      x: resolved.x,
      y: resolved.y,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      data: JSON.parse(JSON.stringify(node.data)),
    };
    setNodes((prev) => [...prev, duplicatedNode]);
    setSelectedNodeIds([newId]);
  };

  // Copy Nodes to Clipboard (Ctrl+C)
  const handleCopyNodes = useCallback((nodeIdsToCopy?: string[]) => {
    const targetIds = (nodeIdsToCopy && nodeIdsToCopy.length > 0) ? nodeIdsToCopy : selectedNodeIds;
    if (!targetIds || targetIds.length === 0) return;

    const targetNodes = nodes.filter((n) => targetIds.includes(n.id));
    if (targetNodes.length === 0) return;

    const internalConns = connections.filter(
      (c) => targetIds.includes(c.fromId) && targetIds.includes(c.toId)
    );

    const clonedNodes = JSON.parse(JSON.stringify(targetNodes));
    const clonedConns = JSON.parse(JSON.stringify(internalConns));

    const clipboardData = {
      nodes: clonedNodes,
      connections: clonedConns,
      isCut: false,
    };

    setClipboard(clipboardData);
    try {
      localStorage.setItem('xcanvas_clipboard', JSON.stringify(clipboardData));
    } catch {}

    const nodeName = clonedNodes.length === 1 ? `"${clonedNodes[0].name}"` : `${clonedNodes.length} quadros`;
    setClipboardToast({
      message: `${nodeName} copiado${clonedNodes.length > 1 ? 's' : ''}! Pressione Ctrl+V ou use o botão direito para colar.`,
      type: 'copy',
    });
  }, [nodes, connections, selectedNodeIds]);

  // Cut Nodes to Clipboard (Ctrl+X)
  const handleCutNodes = useCallback((nodeIdsToCut?: string[]) => {
    const targetIds = (nodeIdsToCut && nodeIdsToCut.length > 0) ? nodeIdsToCut : selectedNodeIds;
    if (!targetIds || targetIds.length === 0) return;

    const targetNodes = nodes.filter((n) => targetIds.includes(n.id));
    if (targetNodes.length === 0) return;

    const internalConns = connections.filter(
      (c) => targetIds.includes(c.fromId) && targetIds.includes(c.toId)
    );

    const clipboardData = {
      nodes: JSON.parse(JSON.stringify(targetNodes)),
      connections: JSON.parse(JSON.stringify(internalConns)),
      isCut: true,
    };

    setClipboard(clipboardData);
    try {
      localStorage.setItem('xcanvas_clipboard', JSON.stringify(clipboardData));
    } catch {}

    pushHistory();
    setNodes((prev) => prev.filter((n) => !targetIds.includes(n.id)));
    setConnections((prev) => prev.filter((c) => !targetIds.includes(c.fromId) && !targetIds.includes(c.toId)));
    setSelectedNodeIds([]);

    const nodeName = targetNodes.length === 1 ? `"${targetNodes[0].name}"` : `${targetNodes.length} quadros`;
    setClipboardToast({
      message: `${nodeName} recortado${targetNodes.length > 1 ? 's' : ''}! Pressione Ctrl+V para colar na nova posição.`,
      type: 'cut',
    });
  }, [nodes, connections, selectedNodeIds, pushHistory]);

  // Paste Nodes from Clipboard (Ctrl+V)
  const handlePasteNodes = useCallback((targetCanvasCoords?: { x: number; y: number }) => {
    if (!clipboard || !clipboard.nodes || clipboard.nodes.length === 0) {
      setClipboardToast({
        message: 'Nenhum quadro na área de transferência. Selecione um quadro e pressione Ctrl+C.',
        type: 'info',
      });
      return;
    }

    pushHistory();

    const nodesToPaste = clipboard.nodes;
    const connsToPaste = clipboard.connections || [];

    const minX = Math.min(...nodesToPaste.map((n) => n.x));
    const minY = Math.min(...nodesToPaste.map((n) => n.y));

    let anchorX: number;
    let anchorY: number;

    if (targetCanvasCoords) {
      anchorX = targetCanvasCoords.x;
      anchorY = targetCanvasCoords.y;
    } else {
      anchorX = minX + 40;
      anchorY = minY + 40;
    }

    const idMap = new Map<string, string>();
    const timestamp = Date.now();

    const newPastedNodes: CanvasNode[] = nodesToPaste.map((origNode, idx) => {
      const newId = `node-${origNode.type}-${timestamp}-${idx}-${Math.floor(Math.random() * 1000)}`;
      idMap.set(origNode.id, newId);

      const relX = origNode.x - minX;
      const relY = origNode.y - minY;
      const posX = Math.round(anchorX + relX);
      const posY = Math.round(anchorY + relY);

      const clonedData = { ...origNode.data };
      if (clonedData.budgetNumber) {
        clonedData.budgetNumber = `${clonedData.budgetNumber}-C`;
      }
      if (clonedData.salesOrderNumber) {
        clonedData.salesOrderNumber = `${clonedData.salesOrderNumber}-C`;
      }

      return {
        ...origNode,
        id: newId,
        name: clipboard.isCut ? origNode.name : `${origNode.name} (Cópia)`,
        x: posX,
        y: posY,
        data: clonedData,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        updatedAt: new Date().toLocaleDateString('pt-BR'),
        locked: false,
      };
    });

    const newPastedConns: Connection[] = connsToPaste
      .filter((c) => idMap.has(c.fromId) && idMap.has(c.toId))
      .map((origConn, idx) => ({
        ...origConn,
        id: `conn-${timestamp}-${idx}-${Math.floor(Math.random() * 1000)}`,
        fromId: idMap.get(origConn.fromId)!,
        toId: idMap.get(origConn.toId)!,
      }));

    setNodes((prev) => [...prev, ...newPastedNodes]);
    setConnections((prev) => [...prev, ...newPastedConns]);

    const newIds = newPastedNodes.map((n) => n.id);
    setSelectedNodeIds(newIds);
    setSelectedConnectionId(null);

    if (clipboard.isCut) {
      const updatedClipboard = { ...clipboard, isCut: false };
      setClipboard(updatedClipboard);
      try {
        localStorage.setItem('xcanvas_clipboard', JSON.stringify(updatedClipboard));
      } catch {}
    }

    setClipboardToast({
      message: `${newPastedNodes.length === 1 ? `Quadro "${newPastedNodes[0].name}"` : `${newPastedNodes.length} quadros`} colado${newPastedNodes.length > 1 ? 's' : ''}!`,
      type: 'paste',
    });
  }, [clipboard, pushHistory]);

  const handleToggleLock = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, locked: !n.locked } : n))
    );
  };

  // Update Node Properties
  const handleUpdateNode = (nodeId: string, updates: Partial<CanvasNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
    );
  };

  const handleUpdateNodeTitle = (nodeId: string, name: string) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, name } : n)));
  };

  // Update Connection Properties
  const handleUpdateConnection = (connId: string, updates: Partial<Connection>) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteConnection = (connId: string) => {
    pushHistory();
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    if (selectedConnectionId === connId) setSelectedConnectionId(null);
  };

  // Focus & Center on a specific node
  const handleFocusNode = (nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    setSelectedNodeIds([nodeId]);
    setSelectedConnectionId(null);

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const targetScale = 1.0;

    const newX = windowW / 2 - (targetNode.x + targetNode.width / 2) * targetScale;
    const newY = windowH / 2 - (targetNode.y + targetNode.height / 2) * targetScale;

    setViewport({ x: newX, y: newY, scale: targetScale });
  };

  // Presentation Mode Transition helper
  const navigateToSlide = useCallback((index: number) => {
    if (index < 0 || index >= presentationSlides.length) return;
    const slide = presentationSlides[index];
    setCurrentSlideIndex(index);

    if (slide.targetNodeIds && slide.targetNodeIds.length > 0) {
      setSelectedNodeIds(slide.targetNodeIds);
      const targetNodes = nodes.filter((n) => slide.targetNodeIds.includes(n.id));
      if (targetNodes.length > 0) {
        const bb = calculateBoundingBox(targetNodes);
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;
        const padding = 160;

        const scaleX = (windowW - padding * 2) / bb.width;
        const scaleY = (windowH - padding * 2) / bb.height;
        const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), slide.zoomLevel || 1.1);

        const centerX = (windowW - bb.width * fitScale) / 2 - bb.minX * fitScale;
        const centerY = (windowH - bb.height * fitScale) / 2 - bb.minY * fitScale;

        setViewport({ x: centerX, y: centerY, scale: fitScale });
      }
    }
  }, [presentationSlides, nodes]);

  const handleStartPresentation = () => {
    setIsPresentationMode(true);
    navigateToSlide(0);
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < presentationSlides.length - 1) {
      navigateToSlide(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      navigateToSlide(currentSlideIndex - 1);
    }
  };

  // Apply AI Updates
  const handleApplyAICanvasUpdate = (result: any) => {
    pushHistory();
    if (result.addedNodes && Array.isArray(result.addedNodes)) {
      setNodes((prev) => [...prev, ...result.addedNodes]);
    }
    if (result.addedConnections && Array.isArray(result.addedConnections)) {
      setConnections((prev) => [...prev, ...result.addedConnections]);
    }
    if (result.updatedNodes && Array.isArray(result.updatedNodes)) {
      setNodes((prev) =>
        prev.map((n) => {
          const update = result.updatedNodes.find((u: any) => u.id === n.id);
          return update ? { ...n, ...update } : n;
        })
      );
    }
  };

  // Get selected objects for Inspector
  const selectedNode = nodes.find((n) => selectedNodeIds.includes(n.id)) || null;
  const selectedConnection =
    connections.find((c) => c.id === selectedConnectionId) || null;

  const investigatedNode = nodes.find((n) => n.id === investigatedNodeId) || null;

  // Compute visible boards according to logged in user role & ownership
  const visibleBoards = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      return boards;
    }

    // Funcionário regular: apenas seus quadros próprios ou quadros compartilhados
    return boards.filter((b) => b.userId === currentUser.id || b.isShared || !b.userId);
  }, [boards, currentUser]);

  // Keep activeBoardId aligned with visible boards
  useEffect(() => {
    if (visibleBoards.length > 0 && !visibleBoards.some((b) => b.id === activeBoardId)) {
      const first = visibleBoards[0];
      setActiveBoardId(first.id);
      setNodes(first.nodes);
      setConnections(first.connections);
      setViewport(first.viewport);
      if (first.theme) setCanvasTheme(first.theme);
    }
  }, [visibleBoards, activeBoardId]);

  // Get live rendered boards list mapping active states in-flight
  const renderedBoards = visibleBoards.map((b) => {
    if (b.id === activeBoardId) {
      return {
        ...b,
        nodes,
        connections,
        viewport,
      };
    }
    return b;
  });

  return (
    <div className="h-screen w-full bg-[#0B0F1A] text-slate-200 font-sans flex flex-col overflow-hidden relative selection:bg-blue-500/30">
      {/* Sleek Interface Top Navigation Bar */}
      <nav
        id="sleek-top-navbar"
        className="h-14 border-b border-white/5 bg-[#0D1221]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-50 shrink-0 select-none"
      >
        {/* Left Brand and Search Pill */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/25" />
                <svg className="w-5 h-5 text-cyan-400 relative z-10 filter drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">
                XWorks
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold leading-none mt-0.5">
                sistemas
              </span>
            </div>
          </div>

          {/* Quick Search Pill */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center bg-slate-800/40 hover:bg-slate-800/70 rounded-full px-4 py-1.5 border border-white/5 transition-all cursor-pointer group"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 mr-2 shrink-0 transition-colors" />
            <span className="text-sm text-slate-400 w-48 md:w-64 truncate">
              Pesquisar no workspace...
            </span>
            <span className="ml-2 text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right Actions & Profile Container */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Scrollable Action Buttons Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">


            {/* Backup/Restore Buttons */}
            <div className="flex items-center bg-slate-800/30 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={handleImportDataTrigger}
                className="flex items-center justify-center hover:bg-slate-700/50 text-slate-300 hover:text-white p-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                title="Restaurar backup do computador"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
              </button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5"></div>
              <button
                onClick={handleExportData}
                className="flex items-center justify-center hover:bg-slate-700/50 text-slate-300 hover:text-white p-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                title="Fazer backup no computador"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            {/* Modelos / Templates Button */}
            <button
              id="nav-btn-templates"
              onClick={() => setIsTemplatesOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              title="Modelos de Workspace e Exportação"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Modelos</span>
            </button>


          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block shrink-0" />

          {/* User Profile & Auth Dropdown (Outside scrolling container to prevent vertical clipping) */}
          {currentUser ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                id="header-user-badge"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserDropdownOpen((prev) => !prev);
                }}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border transition-all shadow-sm cursor-pointer select-none ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                }`}
                title={`Conectado como: ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador Geral' : 'Funcionário'})`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-inner shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor || '#10b981' }}
                >
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className="text-xs font-bold truncate max-w-[90px] sm:max-w-[120px]">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'admin' && (
                      <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {currentUser.role === 'admin' ? 'Admin Geral' : currentUser.department || 'Funcionário'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-[#0F1424] border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 z-[9999] space-y-1.5 animate-fadeIn backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Summary Card */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md"
                        style={{ backgroundColor: currentUser.avatarColor || '#10b981' }}
                      >
                        {currentUser.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          {currentUser.role === 'admin' ? '★ Administrador Geral' : `Setor: ${currentUser.department}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Feature: Gerenciar Funcionários */}
                  {currentUser.role === 'admin' && (
                    <button
                      id="dropdown-btn-manage-employees"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsUserManagementModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-100 transition-colors cursor-pointer text-left"
                    >
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Gerenciar Funcionários & Senhas</span>
                    </button>
                  )}

                  {/* Switch User / Logout Button */}
                  <button
                    id="dropdown-btn-logout"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Trocar de Usuário / Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shrink-0 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </nav>

      {/* Board Tab Bar Panel */}
      {!isPresentationMode && (
        <BoardTabBar
          boards={renderedBoards}
          activeBoardId={activeBoardId}
          theme={canvasTheme}
          currentUser={currentUser}
          allEmployees={allEmployees}
          onChangeTheme={setCanvasTheme}
          onSelectBoard={handleSelectBoard}
          onAddBoard={handleAddBoard}
          onRenameBoard={handleRenameBoard}
          onDuplicateBoard={handleDuplicateBoard}
          onDeleteBoard={handleDeleteBoard}
          onClearBoard={handleClearBoard}
          onResetAllData={handleResetAllData}
          onSaveAsDefaultProductTemplate={handleSaveAsDefaultProductTemplate}
        />
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar Rail & Bottom Pill */}
        {!isPresentationMode && (
          <div style={{ order: 0 }}>
            <Toolbar
              mode={canvasMode}
              canUndo={history.length > 0}
              canRedo={future.length > 0}
              zoomPercent={Math.round(viewport.scale * 100)}
              theme={canvasTheme}
              onChangeTheme={setCanvasTheme}
              onSetMode={setCanvasMode}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitView={handleFitView}
              onReorganize={handleReorganizeNodes}
              onQuickAddNode={handleQuickAddNode}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenAI={() => setIsAIOpen(true)}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onOpenSimplifiedView={() => setIsSimplifiedViewOpen(true)}
              onStartPresentation={handleStartPresentation}
              onOpenEmployeeModal={() => setIsEmployeeModalOpen(true)}
              onOpenGlobalReport={() => {
                setSectorReportTargetId(null);
                setIsSectorReportOpen(true);
              }}
              isLightMode={isLightMode}
              onToggleLightMode={handleToggleLightMode}
            />
          </div>
        )}

        {/* Main Infinite Canvas Engine */}
        <main 
          style={{ order: 5 }}
          className="flex-1 relative overflow-hidden"
        >
          <CanvasProvider nodes={nodes} connections={connections}>
            <Canvas
              nodes={nodes}
              connections={connections}
              viewport={viewport}
              mode={canvasMode}
              selectedNodeIds={selectedNodeIds}
              selectedConnectionId={selectedConnectionId}
              investigatedNodeId={investigatedNodeId}
              isLightMode={isLightMode}
              theme={canvasTheme}
              onChangeTheme={setCanvasTheme}
              onUpdateViewport={setViewport}
              onSelectNode={handleSelectNode}
              onSelectConnection={(id) => {
                setSelectedConnectionId(id);
                if (id) setSelectedNodeIds([]);
              }}
              onMoveNodes={handleMoveNodes}
              onResizeNode={handleResizeNode}
              onCreateNode={handleCreateNode}
              onDeleteSelected={handleDeleteSelected}
              onUpdateNodeData={handleUpdateNodeData}
              onUpdateNodeTitle={handleUpdateNodeTitle}
              onUpdateNode={handleUpdateNode}
              onDuplicateNode={handleDuplicateNode}
              onCopyNodes={handleCopyNodes}
              onCutNodes={handleCutNodes}
              onPasteNodes={handlePasteNodes}
              clipboardCount={clipboard?.nodes.length || 0}
              onConvertToOrder={handleConvertToOrder}
              onToggleLock={handleToggleLock}
              onConnectNodes={handleConnectNodes}
              onConnectToLine={handleConnectToLine}
              onDeleteConnection={handleDeleteConnection}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenAI={() => setIsAIOpen(true)}
              onOpenInvoiceModal={handleOpenInvoiceModal}
              onExpandNode={handleOpenNodeDetail}
              onOpenSectorReport={handleOpenSectorReport}
              onFitView={handleFitView}
              onSetMode={setCanvasMode}
              onOpenProductsCatalog={() => setIsProductsCatalogOpen(true)}
              onOpenEmployeeModal={() => setIsEmployeeModalOpen(true)}
              onOpenCalendarModal={() => setIsImmersiveCalendarOpen(true)}
            />
          </CanvasProvider>
        </main>

        {/* Right Inspector Aside (Integrated into Sleek Right Rail) */}
        {!isPresentationMode && (selectedNode || selectedConnection) && (
          <motion.aside 
            layout
            drag={inspectorDockPosition === 'floating'}
            dragMomentum={false}
            dragElastic={0.1}
            style={{ 
              width: inspectorDockPosition === 'floating' ? inspectorWidth : inspectorWidth,
              position: inspectorDockPosition === 'floating' ? 'absolute' : 'relative',
              right: inspectorDockPosition === 'right' ? 0 : 'auto',
              left: inspectorDockPosition === 'left' ? 0 : 'auto',
              top: inspectorDockPosition === 'floating' ? '100px' : 'auto',
              height: inspectorDockPosition === 'floating' ? inspectorHeight : '100%',
              zIndex: inspectorDockPosition === 'floating' ? 100 : 40,
              order: inspectorDockPosition === 'left' ? 1 : 10,
            }}
            className={`${
              inspectorDockPosition === 'floating' 
                ? 'shadow-2xl rounded-2xl border border-white/10' 
                : 'border-l border-white/5 shrink-0'
            } bg-[#0D1221]/95 backdrop-blur-2xl overflow-hidden transition-all flex flex-col`}
          >
            <InspectorPanel
              selectedNode={selectedNode}
              selectedConnection={selectedConnection}
              allNodes={nodes}
              connections={connections}
              dockPosition={inspectorDockPosition}
              onSetDockPosition={setInspectorDockPosition}
              panelWidth={inspectorWidth}
              onSetPanelWidth={setInspectorWidth}
              panelHeight={inspectorHeight}
              onSetPanelHeight={setInspectorHeight}
              onClose={() => {
                setSelectedNodeIds([]);
                setSelectedConnectionId(null);
              }}
              onUpdateNode={handleUpdateNode}
              onUpdateNodeData={handleUpdateNodeData}
              onDeleteNode={(id) => {
                pushHistory();
                setNodes((prev) => prev.filter((n) => n.id !== id));
                setConnections((prev) =>
                  prev.filter((c) => c.fromId !== id && c.toId !== id)
                );
                setSelectedNodeIds([]);
              }}
              onUpdateConnection={handleUpdateConnection}
              onDeleteConnection={handleDeleteConnection}
              onFocusNode={handleFocusNode}
              onOpenInvoiceModal={handleOpenInvoiceModal}
              onExpandNode={handleOpenNodeDetail}
              onDuplicateNode={handleDuplicateNode}
              onCopyNode={(id) => handleCopyNodes([id])}
              onSyncConnectionData={handleSyncConnectionData}
            />
          </motion.aside>
        )}
      </div>

      {/* Investigation Mode Header Bar Overlay */}
      {canvasMode === 'investigation' && (
        <InvestigationBar
          investigatedNode={investigatedNode}
          connectedCount={
            connections.filter(
              (c) => c.fromId === investigatedNodeId || c.toId === investigatedNodeId
            ).length
          }
          onExit={() => {
            setCanvasMode('select');
            setInvestigatedNodeId(null);
          }}
        />
      )}

      {/* Presentation Mode Controller Overlay */}
      {isPresentationMode && (
        <PresentationController
          slides={presentationSlides}
          currentSlideIndex={currentSlideIndex}
          onNextSlide={handleNextSlide}
          onPrevSlide={handlePrevSlide}
          onExit={() => setIsPresentationMode(false)}
        />
      )}

      {/* Global Search & Filter Bar (Ctrl+K) */}
      <SearchFilterBar
        nodes={nodes}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAndFocusNode={handleFocusNode}
      />

      {/* AI Assistant Copilot Drawer */}
      <AIAssistantModal
        isOpen={isAIOpen}
        nodes={nodes}
        connections={connections}
        onClose={() => setIsAIOpen(false)}
        onApplyAICanvasUpdate={handleApplyAICanvasUpdate}
      />

      {/* Templates & Export/Import Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        nodes={nodes}
        connections={connections}
        onClose={() => setIsTemplatesOpen(false)}
        onSaveAsDefaultProductTemplate={() => handleSaveAsDefaultProductTemplate()}
        onLoadTemplate={(newNodes, newConns) => {
          pushHistory();
          setNodes(newNodes);
          setConnections(newConns);
          setSelectedNodeIds([]);
          setSelectedConnectionId(null);
          setTimeout(() => handleFitView(), 50);
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Invoice (NF-e) Generator & DANFE Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        nodes={nodes}
        connections={connections}
        targetNodeId={invoiceTargetNodeId}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setInvoiceTargetNodeId(null);
        }}
        onAttachInvoiceNode={handleAttachInvoiceNodeToCanvas}
        onUpdateNodeData={handleUpdateNodeData}
      />

      {/* Node Detail & Full Editor Modal */}
      <NodeDetailModal
        isOpen={isNodeDetailOpen}
        nodeId={nodeDetailTargetId}
        nodes={nodes}
        connections={connections}
        onClose={() => {
          setIsNodeDetailOpen(false);
          setNodeDetailTargetId(null);
        }}
        onUpdateNode={handleUpdateFullNode}
        onDuplicateNode={handleDuplicateNode}
        onCopyNode={(id) => handleCopyNodes([id])}
        onDeleteNode={(id) => {
          pushHistory();
          setNodes((prev) => prev.filter((n) => n.id !== id));
          setConnections((prev) =>
            prev.filter((c) => c.fromId !== id && c.toId !== id)
          );
          setSelectedNodeIds([]);
        }}
      />

      {/* Central de Cadastro e Gestão de Funcionários */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        nodes={nodes}
        connections={connections}
        onAddEmployeeNode={handleAddEmployeeFromModal}
        onFocusNode={handleFocusNode}
      />

      {/* Catálogo de Produtos Cadastrados */}
      <ProductsCatalogModal
        isOpen={isProductsCatalogOpen}
        onClose={() => setIsProductsCatalogOpen(false)}
        nodes={nodes}
        onAddProductNodes={handleAddProductNodes}
        onLinkProductsToOrder={handleLinkProductsToOrder}
        onLinkProductsToProduct={handleLinkProductsToProduct}
      />

      {/* Terminal Comercial */}
      <CommercialTerminalModal
        isOpen={isCommercialTerminalOpen}
        onClose={() => setIsCommercialTerminalOpen(false)}
        onCompleteSale={handleCompleteSale}
      />

      <ImmersiveCalendarModal
        isOpen={isImmersiveCalendarOpen}
        onClose={() => setIsImmersiveCalendarOpen(false)}
        nodes={nodes}
      />

      <SectorReportModal
        isOpen={isSectorReportOpen}
        onClose={() => setIsSectorReportOpen(false)}
        sectorId={sectorReportTargetId}
        nodes={nodes}
        connections={connections}
        boards={renderedBoards}
        activeBoardId={activeBoardId}
        onSelectBoard={(boardId) => handleSelectBoard(boardId)}
      />


      {/* Simplified Executive View Layer */}
      <AnimatePresence>
        {isSimplifiedViewOpen && (
          <SimplifiedView
            nodes={nodes}
            connections={connections}
            isAutopilotActive={isAutopilotActive}
            onClose={() => setIsSimplifiedViewOpen(false)}
            onNavigateToNode={(nodeId) => {
              handleFocusNode(nodeId);
              setIsSimplifiedViewOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Clipboard Action Feedback Toast */}
      <AnimatePresence>
        {clipboardToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] pointer-events-none"
          >
            <div className={`px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-medium font-sans ${
              clipboardToast.type === 'copy'
                ? 'bg-sky-950/90 border-sky-500/40 text-sky-200 shadow-sky-950/50'
                : clipboardToast.type === 'cut'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/50'
                : clipboardToast.type === 'paste'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-200 shadow-slate-950/50'
            }`}>
              {clipboardToast.type === 'copy' && <Copy className="w-4 h-4 text-sky-400 shrink-0" />}
              {clipboardToast.type === 'cut' && <Scissors className="w-4 h-4 text-amber-400 shrink-0" />}
              {clipboardToast.type === 'paste' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {clipboardToast.type === 'info' && <Clipboard className="w-4 h-4 text-slate-400 shrink-0" />}
              <span>{clipboardToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Screen Modal (Aparece se não houver usuário logado) */}
      <LoginModal
        isOpen={!currentUser || isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Employee Management Modal (Acesso exclusivo do Administrador Geral Ueliton) */}
      {currentUser && (
        <EmployeeManagementModal
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          currentUser={currentUser}
          boards={boards}
          onRefreshEmployees={() => setAllEmployees(getRegisteredEmployees())}
        />
      )}
    </div>
  );
}
export default App;
