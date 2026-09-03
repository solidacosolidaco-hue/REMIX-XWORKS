import React, { useState } from 'react';
import { CanvasNode } from '../../types/canvas';
import { Building2, Phone, Mail, MapPin, Search, ExternalLink, Tag } from 'lucide-react';

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || 'Cliente');

  const cnpj = node.data.cnpj || '12.345.678/0001-90';
  const corporateName = node.data.corporateName;
  const tradeName = node.data.tradeName || node.name;
  const personType = node.data.personType || 'PJ';
  const contactName = node.data.contactName || 'Diretor Comercial';
  const customerSegment = node.data.customerSegment;
  const city = node.data.city;
  const state = node.data.state;
  const location = city && state ? `${city} - ${state}` : (node.data.address || 'São Paulo - SP');
  const ordersCount = node.data.ordersCount ?? 1;
  const totalRevenue = node.data.totalRevenue || 'R$ 100.000';
  const email = node.data.email;
  const phone = node.data.cellphone || node.data.phone;

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && onUpdateTitle) {
      onUpdateTitle(node.id, titleInput.trim());
    }
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
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {personType}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-mono text-slate-300">
                {node.status || 'Ativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Title / Trade Name */}
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
            }}
            className="bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full mb-1"
          />
        ) : (
          <div>
            <h3
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="font-bold text-base text-white leading-snug cursor-pointer hover:underline hover:text-blue-300 transition-colors"
              title="Clique para editar o nome ou dê duplo clique para cadastro completo"
            >
              {tradeName}
            </h3>
            {corporateName && corporateName !== tradeName && (
              <p className="text-[10px] text-slate-400 truncate -mt-0.5 mb-1">
                {corporateName}
              </p>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-400 mb-2 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{cnpj} • {location}</span>
        </p>

        {customerSegment && (
          <div className="mb-2 flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit max-w-full truncate">
            <Tag className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{customerSegment}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/40 rounded-lg border border-white/5 text-[10px]">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              CONTATO
            </span>
            <span className="text-slate-300 font-medium truncate block">
              {contactName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              FATURADO
            </span>
            <span className="text-emerald-400 font-bold block font-mono text-xs">
              {totalRevenue}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              PEDIDOS
            </span>
            <span className="text-blue-300 font-medium font-mono">
              {ordersCount} ativos
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-0.5">
              RESPONSÁVEL
            </span>
            <span className="text-slate-300 font-medium truncate block">
              {node.assignee || 'Comercial'}
            </span>
          </div>
        </div>

        {/* Cadastral Contact Details */}
        {(email || phone) && (
          <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5">
            {phone && (
              <span className="flex items-center gap-1 text-slate-400">
                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 text-slate-400 truncate max-w-[170px]">
                <Mail className="w-2.5 h-2.5 text-blue-400" />
                {email}
              </span>
            )}
          </div>
        )}
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

