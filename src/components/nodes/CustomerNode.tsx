import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Building2, Phone, Mail, MapPin, Search, ExternalLink, Tag, Check } from 'lucide-react';

interface CustomerNodeProps {
  node: CanvasNode;
  onUpdateData?: (nodeId: string, data: Partial<CanvasNode['data']>) => void;
  onUpdateTitle?: (nodeId: string, title: string) => void;
  onOpenCustomerModal?: () => void;
}

export const CustomerNode: React.FC<CustomerNodeProps> = ({
  node,
  onUpdateData,
  onUpdateTitle,
  onOpenCustomerModal,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const cnpj = node.data.cnpj || '12.345.678/0001-90';
  const corporateName = node.data.corporateName || '';
  const tradeName = node.data.tradeName || node.name || 'Novo Cliente';
  const personType = node.data.personType || 'PJ';
  const contactName = node.data.contactName || 'Diretor Comercial';
  const customerSegment = node.data.customerSegment || '';
  const city = node.data.city || '';
  const state = node.data.state || '';
  const location = city && state ? `${city} - ${state}` : (node.data.address || 'São Paulo - SP');
  const ordersCount = node.data.ordersCount ?? 1;
  const totalRevenue = node.data.totalRevenue || 'R$ 100.000';
  const email = node.data.email || 'contato@novocliente.com';
  const phone = node.data.cellphone || node.data.phone || '(11) 98765-4321';
  const assignee = node.data.assignee || node.assignee || 'Comercial';

  const [tempValue, setTempValue] = useState('');

  const startEditing = (field: string, initialVal: string) => {
    setEditingField(field);
    setTempValue(initialVal);
  };

  const saveEditing = (field: string) => {
    setEditingField(null);
    const val = tempValue.trim();

    if (field === 'title') {
      if (val) {
        onUpdateTitle?.(node.id, val);
        onUpdateData?.(node.id, { tradeName: val });
      }
    } else if (field === 'corporateName') {
      onUpdateData?.(node.id, { corporateName: val });
    } else if (field === 'cnpj') {
      onUpdateData?.(node.id, { cnpj: val || '12.345.678/0001-90' });
    } else if (field === 'location') {
      onUpdateData?.(node.id, { address: val || 'São Paulo - SP' });
    } else if (field === 'contactName') {
      onUpdateData?.(node.id, { contactName: val || 'Contato Comercial' });
    } else if (field === 'totalRevenue') {
      onUpdateData?.(node.id, { totalRevenue: val || 'R$ 0' });
    } else if (field === 'ordersCount') {
      const parsed = parseInt(val, 10);
      onUpdateData?.(node.id, { ordersCount: isNaN(parsed) ? 0 : parsed });
    } else if (field === 'assignee') {
      onUpdateData?.(node.id, { assignee: val || 'Comercial' });
    } else if (field === 'phone') {
      onUpdateData?.(node.id, { cellphone: val, phone: val });
    } else if (field === 'email') {
      onUpdateData?.(node.id, { email: val });
    } else if (field === 'customerSegment') {
      onUpdateData?.(node.id, { customerSegment: val });
    }
  };

  const togglePersonType = () => {
    const next = personType === 'PJ' ? 'PF' : 'PJ';
    onUpdateData?.(node.id, { personType: next });
  };

  const toggleStatus = () => {
    const statuses = ['Ativo', 'Em Análise', 'Inativo'];
    const currentIdx = statuses.indexOf(node.status || 'Ativo');
    const nextStatus = statuses[(currentIdx + 1) % statuses.length < 0 ? 0 : (currentIdx + 1) % statuses.length];
    onUpdateData?.(node.id, { status: nextStatus });
  };

  return (
    <div
      id={`customer-node-${node.id}`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenCustomerModal?.();
      }}
      className="p-4 bg-[#1A2235]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col justify-between w-full h-full group/cust"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              CLIENTE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePersonType();
              }}
              title="Clique para alternar PJ / PF"
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
            >
              {personType}
            </button>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-mono font-bold text-emerald-300">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Editable Title / Trade Name */}
        {editingField === 'title' ? (
          <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('title');
                if (e.key === 'Escape') setEditingField(null);
              }}
              className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() => saveEditing('title')}
              className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="group/title relative mb-1">
            <h3
              onClick={(e) => {
                e.stopPropagation();
                startEditing('title', tradeName);
              }}
              className="font-bold text-base text-white leading-snug cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all flex items-center justify-between"
              title="Clique para editar o nome do cliente"
            >
              <span>{tradeName}</span>
              <span className="text-[10px] text-blue-400 opacity-0 group-hover/title:opacity-100 transition-opacity ml-1">
                ✏️
              </span>
            </h3>
            {corporateName && (
              <p className="text-[10px] text-slate-400 truncate -mt-0.5">
                {corporateName}
              </p>
            )}
          </div>
        )}

        {/* CNPJ & Location Line */}
        <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center gap-1 flex-wrap">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          
          {/* CNPJ Field */}
          {editingField === 'cnpj' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('cnpj')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('cnpj');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500/80 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-32 font-mono"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('cnpj', cnpj);
              }}
              className="cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all border-b border-dashed border-slate-600 hover:border-blue-400"
              title="Clique para editar o CNPJ"
            >
              {cnpj}
            </span>
          )}

          <span>•</span>

          {/* Location / Address Field */}
          {editingField === 'location' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('location')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('location');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500/80 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-28 font-mono"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('location', location);
              }}
              className="truncate max-w-[120px] cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all border-b border-dashed border-slate-600 hover:border-blue-400"
              title="Clique para editar a localização / endereço"
            >
              {location}
            </span>
          )}
        </div>

        {/* Customer Segment Tag */}
        <div className="mb-2">
          {editingField === 'customerSegment' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('customerSegment')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('customerSegment');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Ex: Industrial, Atacado"
              className="bg-slate-900 border border-blue-500/80 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none w-full"
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEditing('customerSegment', customerSegment);
              }}
              className="flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-0.5 rounded w-fit max-w-full truncate cursor-pointer transition-all"
              title="Clique para editar o segmento do cliente"
            >
              <Tag className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{customerSegment || '+ Definir Segmento'}</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/40 rounded-lg border border-white/5 text-[10px]">
          {/* CONTATO */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              CONTATO
            </span>
            {editingField === 'contactName' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('contactName')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('contactName');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('contactName', contactName);
                }}
                className="text-slate-300 font-medium truncate block cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar o contato"
              >
                {contactName}
              </span>
            )}
          </div>

          {/* FATURADO */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              FATURADO
            </span>
            {editingField === 'totalRevenue' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('totalRevenue')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('totalRevenue');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-emerald-400 font-mono font-bold focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('totalRevenue', totalRevenue);
                }}
                className="text-emerald-400 font-bold block font-mono text-xs cursor-pointer hover:bg-emerald-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar o valor faturado"
              >
                {totalRevenue}
              </span>
            )}
          </div>

          {/* PEDIDOS */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              PEDIDOS
            </span>
            {editingField === 'ordersCount' ? (
              <input
                type="number"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('ordersCount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('ordersCount');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-blue-300 font-mono focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('ordersCount', String(ordersCount));
                }}
                className="text-blue-300 font-medium font-mono cursor-pointer hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all block"
                title="Clique para editar número de pedidos ativos"
              >
                {ordersCount} ativos
              </span>
            )}
          </div>

          {/* RESPONSÁVEL */}
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              RESPONSÁVEL
            </span>
            {editingField === 'assignee' ? (
              <input
                type="text"
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEditing('assignee')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('assignee');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-full"
              />
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing('assignee', assignee);
                }}
                className="text-slate-300 font-medium truncate block cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 -mx-1 transition-all"
                title="Clique para editar responsável"
              >
                {assignee}
              </span>
            )}
          </div>
        </div>

        {/* Cadastral Contact Details */}
        <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5">
          {/* Telefone */}
          {editingField === 'phone' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('phone')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('phone');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Telefone"
              className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-28"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('phone', phone);
              }}
              className="flex items-center gap-1 text-slate-300 cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/10 rounded px-1 transition-all"
              title="Clique para editar telefone"
            >
              <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>{phone}</span>
            </span>
          )}

          {/* Email */}
          {editingField === 'email' ? (
            <input
              type="text"
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveEditing('email')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('email');
                if (e.key === 'Escape') setEditingField(null);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="E-mail"
              className="bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none w-36"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                startEditing('email', email);
              }}
              className="flex items-center gap-1 text-slate-300 truncate max-w-[160px] cursor-pointer hover:text-blue-300 hover:bg-blue-500/10 rounded px-1 transition-all"
              title="Clique para editar e-mail"
            >
              <Mail className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="truncate">{email}</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Action: Cadastro & Busca Completa */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCustomerModal?.();
        }}
        className="mt-3 w-full py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-sm"
      >
        <Search className="w-3.5 h-3.5 text-blue-400" />
        <span>Buscar / Cadastro Completo</span>
        <ExternalLink className="w-3 h-3 text-blue-400 opacity-60 ml-auto" />
      </button>
    </div>
  );
};
