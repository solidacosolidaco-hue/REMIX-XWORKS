import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Flag,
  Briefcase,
  Layers,
  Search,
} from 'lucide-react';
import { CanvasNode } from '../../types/canvas';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'deadline' | 'meeting' | 'milestone' | 'production' | 'review';
  priority: 'alta' | 'média' | 'baixa';
  assignee?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  linkedNodeId?: string;
  description?: string;
}

interface ImmersiveCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
}

export const ImmersiveCalendarModal: React.FC<ImmersiveCalendarModalProps> = ({
  isOpen,
  onClose,
  nodes,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // Initial mock events combined with any node deadlines/dates
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'evt-1',
      title: 'Entrega do Lote Piloto de Usinagem',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      type: 'deadline',
      priority: 'alta',
      assignee: 'Carlos Engenharia',
      status: 'pendente',
      description: 'Verificação dimensional final das peças e teste de tolerância no setor A.',
    },
    {
      id: 'evt-2',
      title: 'Reunião de Alinhamento de PCP com Diretoria',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:30',
      type: 'meeting',
      priority: 'média',
      assignee: 'Ana Diretora',
      status: 'pendente',
      description: 'Revisão dos gargalos operacionais e prazos de entrega de Q3.',
    },
    {
      id: 'evt-3',
      title: 'Manutenção Preventiva - Centro de Usinagem CNC #2',
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      time: '08:00',
      type: 'production',
      priority: 'alta',
      assignee: 'Roberto Manutenção',
      status: 'pendente',
      description: 'Troca de fluido refrigerante e calibração de eixos.',
    },
    {
      id: 'evt-4',
      title: 'Aprovação de Orçamento e Nota Fiscal Cliente Alpha',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      time: '16:00',
      type: 'milestone',
      priority: 'alta',
      assignee: 'Juliana Comercial',
      status: 'concluido',
      description: 'Faturamento emitido e enviado ao financeiro.',
    },
  ]);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventType, setNewEventType] = useState<'deadline' | 'meeting' | 'milestone' | 'production' | 'review'>('deadline');
  const [newEventPriority, setNewEventPriority] = useState<'alta' | 'média' | 'baixa'>('média');
  const [newEventAssignee, setNewEventAssignee] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  if (!isOpen) return null;

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      type: newEventType,
      priority: newEventPriority,
      assignee: newEventAssignee.trim() || 'Equipe Geral',
      status: 'pendente',
      description: newEventDesc.trim(),
    };

    setEvents([newEvent, ...events]);
    setNewEventTitle('');
    setNewEventDesc('');
    setIsAddEventOpen(false);
  };

  const toggleEventStatus = (id: string) => {
    setEvents(
      events.map((evt) =>
        evt.id === id
          ? { ...evt, status: evt.status === 'concluido' ? 'pendente' : 'concluido' }
          : evt
      )
    );
  };

  const filteredEvents = events.filter((evt) => {
    const matchesFilter = filterType === 'all' || evt.type === filterType;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.assignee && evt.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b101f] border border-blue-500/40 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[90vh] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Calendário Executivo & Agenda Imersiva
              </h2>
              <p className="text-xs text-slate-400">
                Gestão integrada de prazos, entregas de PCP, reuniões e marcos de engenharia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Prazo / Evento</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/40 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white min-w-[160px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-white/10 transition-colors ml-2"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar eventos ou responsáveis..."
                className="bg-slate-950/70 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-52"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">Todos os Tipos</option>
              <option value="deadline">Prazos & Entregas</option>
              <option value="meeting">Reuniões</option>
              <option value="production">Produção / Manutenção</option>
              <option value="milestone">Marcos Estratégicos</option>
            </select>

            <div className="flex bg-slate-950/70 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'agenda' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Agenda Imersiva
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {viewMode === 'month' ? (
            <div className="lg:col-span-3 bg-slate-900/30 border border-white/10 rounded-2xl p-4 flex flex-col">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-slate-950/20 rounded-xl border border-white/5 opacity-30" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const formattedDay = String(dayNum).padStart(2, '0');
                  const formattedMonth = String(month + 1).padStart(2, '0');
                  const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

                  const dayEvents = filteredEvents.filter((evt) => evt.date === dateStr);
                  const isToday =
                    new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div
                      key={dateStr}
                      className={`bg-slate-950/60 border rounded-xl p-2 flex flex-col transition-all overflow-hidden min-h-[90px] ${
                        isToday ? 'border-blue-500/60 bg-blue-950/10 shadow-lg shadow-blue-500/10' : 'border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                          {dayNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded-full font-mono">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 overflow-y-auto flex-1 pr-0.5">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => toggleEventStatus(evt.id)}
                            className={`text-[10px] p-1 rounded-md border truncate cursor-pointer transition-all ${
                              evt.status === 'concluido'
                                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 line-through opacity-70'
                                : evt.priority === 'alta'
                                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                                : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                            }`}
                            title={`${evt.title} (${evt.assignee || 'Geral'})`}
                          >
                            <span className="font-semibold">{evt.time || ''}</span> {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Linha do Tempo de Prazos & Agenda ({filteredEvents.length} eventos)
              </h3>
              {filteredEvents.length === 0 ? (
                <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-12 text-center text-slate-400">
                  Nenhum evento encontrado para os filtros selecionados.
                </div>
              ) : (
                filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      evt.status === 'concluido'
                        ? 'bg-slate-950/40 border-white/5 opacity-60'
                        : 'bg-slate-900/60 border-white/10 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => toggleEventStatus(evt.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          evt.status === 'concluido'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {evt.status === 'concluido' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold text-white ${evt.status === 'concluido' ? 'line-through text-slate-400' : ''}`}>
                            {evt.title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            evt.priority === 'alta' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {evt.priority}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {evt.date} {evt.time ? `às ${evt.time}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            {evt.assignee || 'Não atribuído'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Right Sidebar Widget inside modal: Summary & Upcoming Deadlines */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
                Resumo de Prazos Próximos
              </h4>
              <div className="space-y-2.5">
                {events
                  .filter((e) => e.status !== 'concluido')
                  .slice(0, 4)
                  .map((evt) => (
                    <div key={evt.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-xs font-bold text-white truncate">{evt.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="text-amber-400 font-mono">{evt.date}</span>
                        <span className="capitalize px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                          {evt.type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                💡 Dica Imersiva
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este calendário sincroniza prazos de Ordens de Produção (PCP), projetos de engenharia e notas fiscais para garantir que nenhum deadline fabril seja perdido.
              </p>
            </div>
          </div>

        </div>

        {/* Modal for adding new event */}
        {isAddEventOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
            <div className="bg-[#0D1221] border border-blue-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Agendar Novo Prazo / Evento
                </h3>
                <button
                  onClick={() => setIsAddEventOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Título do Prazo / Evento</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Ex: Entrega de Matéria-Prima Setor B"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Horário</label>
                    <input
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="deadline">Prazo / Entrega</option>
                      <option value="meeting">Reunião</option>
                      <option value="production">Produção / Manutenção</option>
                      <option value="milestone">Marco Estratégico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Prioridade</label>
                    <select
                      value={newEventPriority}
                      onChange={(e) => setNewEventPriority(e.target.value as any)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="alta">Alta</option>
                      <option value="média">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={newEventAssignee}
                    onChange={(e) => setNewEventAssignee(e.target.value)}
                    placeholder="Ex: Carlos Engenharia"
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Descrição / Observações</label>
                  <textarea
                    rows={2}
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                  >
                    Salvar Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
