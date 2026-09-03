import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShoppingCart, Search, Plus, Minus, CreditCard, 
  Trash2, FileText, UserCircle, Tag, CheckCircle2, ChevronRight
} from 'lucide-react';
import { getRegisteredCustomers, RegisteredCustomer } from '../../data/customerRegistry';
import { REGISTERED_PRODUCTS, Product } from './ProductsCatalogModal';

interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

interface CommercialTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteSale: (saleData: { customer: RegisteredCustomer | null; items: CartItem[]; total: number; paymentMethod: string }) => void;
}

export const CommercialTerminalModal: React.FC<CommercialTerminalModalProps> = ({
  isOpen,
  onClose,
  onCompleteSale
}) => {
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix');
  
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  
  const customers = useMemo(() => getRegisteredCustomers(), []);
  
  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return REGISTERED_PRODUCTS;
    const q = searchProduct.toLowerCase();
    return REGISTERED_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    );
  }, [searchProduct]);

  const filteredCustomers = useMemo(() => {
    if (!searchCustomer.trim()) return customers.slice(0, 5);
    const q = searchCustomer.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.cnpj.includes(q)
    ).slice(0, 5);
  }, [searchCustomer, customers]);

  const totalCart = useMemo(() => cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0), [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, cartId: Math.random().toString(), quantity: 1 }];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleComplete = () => {
    if (cart.length === 0) return;
    setStep('success');
    
    // Auto close and send data after animation
    setTimeout(() => {
      onCompleteSale({
        customer: selectedCustomer,
        items: cart,
        total: totalCart,
        paymentMethod
      });
      // reset
      setStep('cart');
      setCart([]);
      setSelectedCustomer(null);
      setSearchProduct('');
      setSearchCustomer('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Terminal Comercial</h2>
              <p className="text-xs text-slate-400">Lançamento de Vendas e Pedidos Industriais</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {step === 'success' && (
            <div className="absolute inset-0 z-10 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl"
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Venda Concluída!</h3>
                <p className="text-emerald-200/70 text-center max-w-md">Gerando quadros de pedido e produtos no canvas operacional...</p>
              </motion.div>
            </div>
          )}
        
          {/* Left Panel: Products & Customers (Only visible in 'cart' step on mobile) */}
          <div className={`flex-1 flex-col overflow-hidden border-r border-slate-800 ${step === 'checkout' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Customer Selection */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserCircle className="w-4 h-4" /> Cliente / Comprador
                </span>
                {selectedCustomer && (
                  <button onClick={() => setSelectedCustomer(null)} className="text-[10px] text-rose-400 hover:text-rose-300">
                    Remover
                  </button>
                )}
              </div>
              
              {selectedCustomer ? (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{selectedCustomer.name}</div>
                    <div className="text-xs text-blue-200/70 font-mono mt-0.5">{selectedCustomer.cnpj}</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchCustomer}
                    onChange={e => setSearchCustomer(e.target.value)}
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchCustomer && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSearchCustomer('');
                          }}
                          className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0"
                        >
                          <div className="font-semibold text-white text-sm">{c.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{c.cnpj}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Catalog */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-950 shrink-0 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                    placeholder="Buscar produtos (nome, categoria)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="flex flex-col text-left bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 p-3 rounded-xl transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-semibold truncate max-w-[100px]">
                          {prod.category}
                        </span>
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="font-semibold text-slate-200 text-sm mb-1 leading-tight line-clamp-2">{prod.name}</div>
                      <div className="mt-auto font-mono text-emerald-400 font-bold text-lg">
                        R$ {prod.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </button>
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                      Nenhum produto encontrado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Cart & Checkout */}
          <div className={`w-full md:w-[400px] flex-col bg-slate-950 ${step === 'cart' && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
            
            {step === 'cart' ? (
              <>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" /> Resumo do Pedido
                  </h3>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} itens
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                      <ShoppingCart className="w-12 h-12 opacity-20" />
                      <p>O carrinho está vazio</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {cart.map(item => (
                        <div key={item.cartId} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 relative group">
                          <div className="pr-6">
                            <div className="text-sm font-semibold text-slate-200 leading-tight">{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">UN: R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700">
                              <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-white text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
                              <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-white text-slate-400"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="font-mono font-bold text-emerald-400 text-sm">
                              R$ {(item.unitPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.cartId)}
                            className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total</span>
                    <span className="text-3xl font-black text-white tracking-tighter">
                      R$ {totalCart.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep('checkout')}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-900 flex items-center justify-center gap-2 transition-all"
                  >
                    Ir para Pagamento <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Checkout Step
              <>
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                  <button onClick={() => setStep('cart')} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h3 className="font-bold text-white">Finalizar Venda</h3>
                </div>
                
                <div className="flex-1 p-6 flex flex-col gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Método de Pagamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Pix', 'Cartão de Crédito', 'Boleto 30 Dias', 'Dinheiro'].map(m => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                            paymentMethod === m 
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="text-xs font-semibold text-center">{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Itens</span>
                      <span className="text-slate-200 font-mono">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                    </div>
                    {selectedCustomer && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">Cliente</span>
                        <span className="text-slate-200 text-xs truncate max-w-[150px]">{selectedCustomer.name}</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-800 my-3" />
                    <div className="flex justify-between items-end">
                      <span className="text-slate-200 font-bold">Total a Pagar</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        R$ {totalCart.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0">
                  <button
                    onClick={handleComplete}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900 flex items-center justify-center gap-2 transition-all"
                  >
                    Confirmar Venda <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
            
          </div>
        </div>
      </motion.div>
    </div>
  );
};
