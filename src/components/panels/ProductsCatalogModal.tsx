import React, { useState } from 'react';
import { CanvasNode, NodeType } from '../../types/canvas';
import {
  Package,
  X,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Plus,
  ShoppingCart,
  TrendingUp,
  Tag,
  ArrowRight,
  Sparkles,
  Layers,
  CheckSquare,
  PlusCircle,
} from 'lucide-react';

interface FiscalData {
  ncm: string;
  cest: string;
  aliquotaIcms: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  stockQty: number;
  minStockQty: number;
  supplier: string;
  dimensions: string;
  material: string;
  description: string;
  fiscal: FiscalData;
}

interface ProductsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  onAddProductNodes: (products: Product[]) => void;
  onLinkProductsToOrder: (orderId: string, products: Product[]) => void;
  onLinkProductsToProduct: (targetProductId: string, products: Product[]) => void;
}

// Default list of registered products
export const REGISTERED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Prensa Hidráulica X-500',
    sku: 'PRD-H500-X',
    category: 'Produtos Acabados',
    unitPrice: 250000,
    stockQty: 5,
    minStockQty: 2,
    supplier: 'HidroMetal Brasil',
    dimensions: '2200 x 1400 x 3100 mm',
    material: 'Aço Carbono Estrutural ASTM A36',
    description: 'Prensa hidráulica industrial de alta precisão operando a 350 bar.',
    fiscal: { ncm: '8462.10.90', cest: '01.001.00', aliquotaIcms: 18 },
  },
  {
    id: 'prod-2',
    name: 'Prensa de Estampagem 50T',
    sku: 'PRD-P050-T',
    category: 'Imobilizados',
    unitPrice: 148000,
    stockQty: 45,
    minStockQty: 10,
    supplier: 'MetalicPress S/A',
    dimensions: '1800 x 1200 x 2600 mm',
    material: 'Aço Forjado & Ferro Fundido Nodular',
    description: 'Prensa mecânica excêntrica ideal para estampagem veloz.',
    fiscal: { ncm: '8462.90.10', cest: '01.002.00', aliquotaIcms: 18 },
  },
  {
    id: 'prod-3',
    name: 'Torno CNC HighPrecision-90',
    sku: 'PRD-CNC-90',
    category: 'Imobilizados',
    unitPrice: 380000,
    stockQty: 12,
    minStockQty: 3,
    supplier: 'GigaMach CNC',
    dimensions: '2900 x 1650 x 1900 mm',
    material: 'Base em Ferro Fundido Mecanite',
    description: 'Torno industrial computadorizado de 4 eixos.',
    fiscal: { ncm: '8458.11.90', cest: '01.003.00', aliquotaIcms: 18 },
  },
  {
    id: 'prod-4',
    name: 'Chapa de Aço 1020',
    sku: 'MAT-ACO-1020',
    category: 'Matéria Prima',
    unitPrice: 2500,
    stockQty: 500,
    minStockQty: 50,
    supplier: 'Siderúrgica Nacional',
    dimensions: '1000 x 2000 x 5 mm',
    material: 'Aço 1020',
    description: 'Chapa de aço 1020 para corte e dobra.',
    fiscal: { ncm: '7208.38.00', cest: '05.001.00', aliquotaIcms: 12 },
  },
  {
    id: 'prod-5',
    name: 'Rolamento SKF 6205',
    sku: 'PEC-ROL-6205',
    category: 'Peças de Reposição',
    unitPrice: 150,
    stockQty: 200,
    minStockQty: 50,
    supplier: 'Distribuidora SKF',
    dimensions: '25 x 52 x 15 mm',
    material: 'Aço Rolamento',
    description: 'Rolamento de esferas de precisão.',
    fiscal: { ncm: '8482.10.10', cest: '02.001.00', aliquotaIcms: 18 },
  },
  {
    id: 'prod-6',
    name: 'Óleo de Corte',
    sku: 'INS-OLEO-COR',
    category: 'Insumos',
    unitPrice: 450,
    stockQty: 80,
    minStockQty: 20,
    supplier: 'LubriIndustrial',
    dimensions: '20 Litros',
    material: 'Óleo Mineral',
    description: 'Óleo solúvel de alto desempenho.',
    fiscal: { ncm: '2710.19.32', cest: '06.001.00', aliquotaIcms: 18 },
  },
];

export const ProductsCatalogModal: React.FC<ProductsCatalogModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onAddProductNodes,
  onLinkProductsToOrder,
  onLinkProductsToProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(REGISTERED_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['all', ...Array.from(new Set(REGISTERED_PRODUCTS.map((p) => p.category)))]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  if (!isOpen) return null;

  // Filter categories
  // Removed hardcoded categories const here as it is now in state

  // Search filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  // Action 1: Create Product Nodes in Canvas
  const handleSpawnOnCanvas = () => {
    const selectedList = products.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) return;

    onAddProductNodes(selectedList);
    setActionSuccessMsg(`Sucesso! ${selectedList.length} nó(s) de produto criado(s) no centro da Lousa Digital.`);
    setSelectedProductIds([]);
    setTimeout(() => {
      setActionSuccessMsg('');
      onClose();
    }, 2500);
  };

  // Action 2: Link Selected Products to an Order Node
  const handleLinkToOrder = () => {
    if (!targetOrderId) return;
    const selectedList = products.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) return;

    onLinkProductsToOrder(targetOrderId, selectedList);
    const orderName = nodes.find((n) => n.id === targetOrderId)?.name || 'Pedido';
    setActionSuccessMsg(`Sucesso! ${selectedList.length} produto(s) vinculados ao quadro "${orderName}".`);
    setSelectedProductIds([]);
    setTargetOrderId('');
    setTimeout(() => {
      setActionSuccessMsg('');
      onClose();
    }, 2500);
  };

  // Action 3: Link Selected Products to a Product Node (Sub-assembly)
  const handleLinkToProduct = () => {
    if (!targetProductId) return;
    const selectedList = products.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) return;

    onLinkProductsToProduct(targetProductId, selectedList);
    const prodName = nodes.find((n) => n.id === targetProductId)?.name || 'Produto';
    setActionSuccessMsg(`Estrutura atualizada! ${selectedList.length} item(ns) vinculados como subconjuntos de "${prodName}".`);
    setSelectedProductIds([]);
    setTargetProductId('');
    setTimeout(() => {
      setActionSuccessMsg('');
      onClose();
    }, 2500);
  };

  const activeOrders = nodes.filter((n) => n.type === 'order');
  const finishedProductsNodes = nodes.filter((n) => n.type === 'product' || n.type === 'custom');

  return (
    <div
      id="products-catalog-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="products-catalog-content"
        className="bg-slate-900 border border-slate-700/80 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Package className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Catálogo de Produtos Cadastrados</h2>
              <p className="text-xs text-slate-400">
                Visualize fichas técnicas completas de equipamentos, selecione os itens desejados e associe-os à sua linha de produção.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Novo Item</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Registration Form Modal (Internal) */}
        {isAddingProduct && (
          <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-white font-bold">Cadastrar Novo Produto ou Peça</h3>
                </div>
                <button onClick={() => setIsAddingProduct(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="product-registration-form" className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newProd: Product = {
                    id: `prod-custom-${Date.now()}`,
                    name: formData.get('name') as string,
                    sku: formData.get('sku') as string,
                    category: formData.get('category') as string,
                    unitPrice: Number(formData.get('unitPrice')),
                    stockQty: Number(formData.get('stockQty')),
                    minStockQty: Number(formData.get('minStockQty')),
                    supplier: formData.get('supplier') as string,
                    dimensions: formData.get('dimensions') as string,
                    material: formData.get('material') as string,
                    description: formData.get('description') as string,
                    fiscal: {
                      ncm: formData.get('ncm') as string || '0000.00.00',
                      cest: formData.get('cest') as string || '00.000.00',
                      aliquotaIcms: 18,
                    }
                  };
                  setProducts([newProd, ...products]);
                  setIsAddingProduct(false);
                  setActionSuccessMsg('Item cadastrado com sucesso e adicionado ao seu catálogo local!');
                  setTimeout(() => setActionSuccessMsg(''), 3000);
                }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Item</label>
                      <input name="name" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Ex: Prensa Hidráulica Y-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SKU / Código</label>
                      <input name="sku" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Ex: PRD-123-X" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                      <select name="category" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                        {categories.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="Nova">Outra / Nova</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Unitário (R$)</label>
                      <input name="unitPrice" type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Estoque Inicial</label>
                      <input name="stockQty" type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Estoque Mínimo (Alerta)</label>
                      <input name="minStockQty" type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="0" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fornecedor Principal</label>
                    <input name="supplier" required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Nome da empresa fornecedora" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dimensões</label>
                      <input name="dimensions" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Ex: 1000x500x200 mm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Material Principal</label>
                      <input name="material" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Ex: Aço Carbono" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição Técnica / Observações</label>
                    <textarea name="description" rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none" placeholder="Detalhes importantes do item..."></textarea>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
                <button onClick={() => setIsAddingProduct(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="product-registration-form" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
                  Confirmar Cadastro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Split layout: products list + product detail sidebar (if open) */}
        <div className="flex-1 overflow-hidden flex flex-row">
          {/* Main Products Grid Column */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/30 p-3 rounded-xl border border-white/5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, SKU, fornecedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <div className="flex gap-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase mr-2">Buscar por:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'TODOS' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>
                  <input
                    type="text"
                    placeholder="Nova Categoria..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono w-32"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleSelectAll}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
                >
                  {selectedProductIds.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProductIds.includes(prod.id);
                const isLowStock = prod.stockQty <= prod.minStockQty;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleSelectProduct(prod.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500'
                        : 'bg-slate-950/40 border-white/5 hover:border-slate-700 hover:bg-slate-900/30'
                    }`}
                  >
                    {/* Header line */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {prod.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">SKU:</span>
                          <span className="text-[10px] font-mono text-slate-300 font-bold">{prod.sku}</span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled by outer div click
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={isSelected ? 'text-indigo-300' : 'text-slate-200'}>
                          {prod.name}
                        </span>
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8 leading-snug">
                        {prod.description}
                      </p>
                    </div>

                    {/* Stock, Price and Details CTA */}
                    <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">ESTOQUE</span>
                        <span className={`font-mono font-bold ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {prod.stockQty} un. {isLowStock && '⚠️'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">PREÇO UNITÁRIO</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(prod.unitPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Floating Detail Eye trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailProduct(prod);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-white/5"
                      title="Abrir Detalhes e Ficha Técnica"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Detail Sliding Sidebar */}
          {detailProduct && (
            <div className="w-80 bg-slate-950/80 border-l border-slate-800 p-6 flex flex-col gap-5 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Ficha Técnica
                </h3>
                <button
                  onClick={() => setDetailProduct(null)}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500">NOME DO PRODUTO</span>
                <h4 className="font-bold text-base text-white">{detailProduct.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {detailProduct.sku}</p>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-white/5 space-y-3 text-xs">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">FORNECEDOR INTEGRADO</span>
                  <span className="font-semibold text-slate-200">{detailProduct.supplier}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">DIMENSÕES DE DESIGN</span>
                  <span className="font-semibold text-slate-200">{detailProduct.dimensions}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">MATERIAL CONSTRUTIVO</span>
                  <span className="font-semibold text-slate-200">{detailProduct.material}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">DADOS FISCAIS (NCM/CEST/ICMS)</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {detailProduct.fiscal.ncm} / {detailProduct.fiscal.cest} / {detailProduct.fiscal.aliquotaIcms}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block mb-1">ESPECIFICAÇÃO DE PROCESSO</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  {detailProduct.description}
                </p>
              </div>

              {/* Mini analytics stock level */}
              <div className="bg-gradient-to-r from-indigo-950/20 to-blue-950/20 border border-indigo-500/20 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold block mb-1 uppercase tracking-wider">Nível de Atendimento</span>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, (detailProduct.stockQty / 100) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Mínimo: {detailProduct.minStockQty} un.</span>
                  <span>Estoque Atual: {detailProduct.stockQty} un.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Items Float Action Box */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Selecionados:{' '}
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 rounded">
                {selectedProductIds.length} item(ns)
              </span>
            </span>
            {selectedProductIds.length > 0 && (
              <span className="text-xs text-slate-500">
                Total estimado:{' '}
                <span className="font-mono text-emerald-400 font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(
                    REGISTERED_PRODUCTS.filter((p) => selectedProductIds.includes(p.id)).reduce(
                      (acc, curr) => acc + curr.unitPrice,
                      0
                    )
                  )}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Action 1: Create Nodes */}
            <button
              onClick={handleSpawnOnCanvas}
              disabled={selectedProductIds.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                selectedProductIds.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
              title="Cria nós do tipo Produto Industrial diretamente no centro da sua Lousa"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar como Quadro(s) no Canvas</span>
            </button>

            <span className="text-slate-700 text-xs hidden md:inline">ou</span>

            {/* Action 2: Link Selector */}
            <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase px-1">Vincular a Pedido</span>
                <div className="flex items-center gap-1">
                  <select
                    value={targetOrderId}
                    onChange={(e) => {
                      setTargetOrderId(e.target.value);
                      setTargetProductId('');
                    }}
                    disabled={selectedProductIds.length === 0 || activeOrders.length === 0}
                    className="bg-slate-950 border border-white/5 text-[10px] text-slate-300 rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-40"
                  >
                    <option value="">-- Selecionar Pedido --</option>
                    {activeOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.name} ({ord.data.orderCode || `#${ord.id.slice(0, 4)}`})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkToOrder}
                    disabled={selectedProductIds.length === 0 || !targetOrderId}
                    className={`p-1.5 rounded-lg transition-all ${
                      selectedProductIds.length > 0 && targetOrderId
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-850 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-px h-8 bg-white/10 mx-1" />

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase px-1">Vincular a Produto (Subconjunto)</span>
                <div className="flex items-center gap-1">
                  <select
                    value={targetProductId}
                    onChange={(e) => {
                      setTargetProductId(e.target.value);
                      setTargetOrderId('');
                    }}
                    disabled={selectedProductIds.length === 0 || finishedProductsNodes.length === 0}
                    className="bg-slate-950 border border-white/5 text-[10px] text-slate-300 rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-40"
                  >
                    <option value="">-- Selecionar Produto --</option>
                    {finishedProductsNodes.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.data.sku || `#${prod.id.slice(0, 4)}`})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkToProduct}
                    disabled={selectedProductIds.length === 0 || !targetProductId}
                    className={`p-1.5 rounded-lg transition-all ${
                      selectedProductIds.length > 0 && targetProductId
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-850 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
