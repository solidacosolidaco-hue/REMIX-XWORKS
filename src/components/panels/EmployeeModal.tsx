import React, { useState } from 'react';
import { CanvasNode, Connection } from '../../types/canvas';
import {
  X,
  User,
  ShieldCheck,
  Plus,
  Users,
  Building2,
  Award,
  Clock,
  Briefcase,
  Phone,
  Check,
  Sparkles,
  Search,
  CheckCircle2,
  Factory,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  connections: Connection[];
  onAddEmployeeNode: (employeeData: {
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
  }) => void;
  onFocusNode?: (nodeId: string) => void;
}

const CERTIFICATION_OPTIONS = [
  'NR-12 (Segurança em Máquinas)',
  'NR-35 (Trabalho em Altura)',
  'NR-10 (Segurança em Eletricidade)',
  'ISO 9001 (Gestão da Qualidade)',
  'Green Belt Six Sigma',
  'Operador de Empilhadeira (NR-11)',
  'Solda Especializada AWS D1.1',
  'Calibrador de Instrumentos de Medição',
];

const PRESET_ROLES = [
  'Operador de Usinagem CNC',
  'Soldador TIG / MIG-MAG',
  'Mecânico de Manutenção Industrial',
  'Inspetor de Qualidade NDT',
  'Caldeireiro Pesado',
  'Auxiliar de Produção Fabril',
  'Encarregado de Turno / Usinagem',
  'Supervisora de Segurança e QSMA',
  'Programador de Torno & Centro CNC',
  'Eletricista de Manutenção',
];

const PRESET_SHIFTS = [
  'Turno A (07:00 - 16:48)',
  'Turno B (16:40 - 01:20)',
  'Turno C (23:00 - 07:00)',
  'Administrativo (08:00 - 18:00)',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  nodes,
  connections,
  onAddEmployeeNode,
  onFocusNode,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'roster' | 'preset'>('create');
  const [employeeType, setEmployeeType] = useState<'employee' | 'supervisor'>('employee');

  // Form states
  const [name, setName] = useState('Carlos Eduardo Santos');
  const [reCode, setReCode] = useState(() => `RE-${Math.floor(1000 + Math.random() * 9000)}`);
  const [role, setRole] = useState(PRESET_ROLES[0]);
  const [department, setDepartment] = useState('Usinagem Heavy-Duty');
  const [shift, setShift] = useState(PRESET_SHIFTS[0]);
  const [status, setStatus] = useState<'Disponível' | 'Em Serviço' | 'Em Férias' | 'Ausente'>('Em Serviço');
  const [hourlyRate, setHourlyRate] = useState<number>(65);
  const [phone, setPhone] = useState('(11) 98765-4321');
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([
    'NR-12 (Segurança em Máquinas)',
    'ISO 9001 (Gestão da Qualidade)',
  ]);
  const [connectedSectorId, setConnectedSectorId] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(85);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const sectorNodes = nodes.filter((n) => n.type === 'sector');
  const existingEmployeeNodes = nodes.filter((n) => n.type === 'employee' || n.type === 'supervisor');

  const filteredEmployees = existingEmployeeNodes.filter(
    (n) =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.data.employeeId && n.data.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.data.role && n.data.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.data.department && n.data.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCertification = (cert: string) => {
    if (selectedCertifications.includes(cert)) {
      setSelectedCertifications(selectedCertifications.filter((c) => c !== cert));
    } else {
      setSelectedCertifications([...selectedCertifications, cert]);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddEmployeeNode({
      type: employeeType,
      name: name.trim(),
      employeeId: reCode.trim() || `RE-${Math.floor(1000 + Math.random() * 9000)}`,
      role: role.trim(),
      department: department.trim(),
      shift: shift,
      employeeStatus: status,
      hourlyRate: Number(hourlyRate) || 0,
      certifications: selectedCertifications,
      phone: phone.trim(),
      connectedSectorId: connectedSectorId || undefined,
      progressPercent: progressPercent,
    });

    showToast(`Funcionário "${name}" adicionado ao canvas com sucesso!`);
    
    // Regenerate RE for next creation
    setReCode(`RE-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleCreateSquadPreset = () => {
    const sectorId = sectorNodes[0]?.id || undefined;
    const squad = [
      {
        type: 'supervisor' as const,
        name: 'Eng. Roberto Silva',
        employeeId: `ENC-${Math.floor(100 + Math.random() * 900)}`,
        role: 'Encarregado Geral de Usinagem',
        department: 'Setor de Usinagem CNC',
        shift: 'Turno A (07:00 - 16:48)',
        employeeStatus: 'Em Serviço' as const,
        hourlyRate: 110,
        certifications: ['NR-12 (Segurança em Máquinas)', 'Green Belt Six Sigma', 'ISO 9001 (Gestão da Qualidade)'],
        connectedSectorId: sectorId,
        progressPercent: 95,
      },
      {
        type: 'employee' as const,
        name: 'Marcos Oliveira',
        employeeId: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'Operador de Usinagem CNC',
        department: 'Setor de Usinagem CNC',
        shift: 'Turno A (07:00 - 16:48)',
        employeeStatus: 'Em Serviço' as const,
        hourlyRate: 60,
        certifications: ['NR-12 (Segurança em Máquinas)'],
        connectedSectorId: sectorId,
        progressPercent: 88,
      },
      {
        type: 'employee' as const,
        name: 'Juliana Costa',
        employeeId: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'Inspetora de Qualidade NDT',
        department: 'Setor de Usinagem CNC',
        shift: 'Turno A (07:00 - 16:48)',
        employeeStatus: 'Em Serviço' as const,
        hourlyRate: 75,
        certifications: ['ISO 9001 (Gestão da Qualidade)', 'Calibrador de Instrumentos de Medição'],
        connectedSectorId: sectorId,
        progressPercent: 90,
      },
      {
        type: 'employee' as const,
        name: 'Thiago Mendes',
        employeeId: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'Soldador TIG / MIG-MAG',
        department: 'Caldeiraria & Solda',
        shift: 'Turno A (07:00 - 16:48)',
        employeeStatus: 'Disponível' as const,
        hourlyRate: 65,
        certifications: ['Solda Especializada AWS D1.1', 'NR-35 (Trabalho em Altura)'],
        connectedSectorId: sectorId,
        progressPercent: 75,
      },
    ];

    squad.forEach((emp) => onAddEmployeeNode(emp));
    showToast('Equipe Completa (1 Líder + 3 Operadores) adicionada ao canvas!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-semibold shadow-2xl flex items-center gap-2 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Central de Cadastro de Funcionários
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {existingEmployeeNodes.length} Registrados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre novos operadores, encarregados e conecte-os aos setores da fábrica no canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950/40 border-b border-white/5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Funcionário
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'roster'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Quadro de Funcionários ({existingEmployeeNodes.length})
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'preset'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Gerar Equipe Completa
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEmployeeType('employee')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    employeeType === 'employee'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Funcionário Operacional</span>
                    <span className="text-[11px] text-slate-400">Operadores CNC, soldadores, técnicos e manutenção.</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmployeeType('supervisor')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    employeeType === 'supervisor'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-white">Encarregado / Liderança</span>
                    <span className="text-[11px] text-slate-400">Líderes de turno, gerentes de setor e coordenação.</span>
                  </div>
                </button>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Funcionário *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Santos"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registro Funcional (RE) *
                  </label>
                  <input
                    type="text"
                    required
                    value={reCode}
                    onChange={(e) => setReCode(e.target.value)}
                    placeholder="Ex: RE-4029"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cargo / Função *
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Ex: Operador CNC Heavy-Duty"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {PRESET_ROLES.slice(0, 5).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRole(preset)}
                          className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setor / Departamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex: Usinagem & Caldeiraria"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Turno de Trabalho
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Inicial de Serviço
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Em Serviço">🟢 Em Serviço (Ativo na fábrica)</option>
                    <option value="Disponível">🔵 Disponível (Alocação livre)</option>
                    <option value="Em Férias">🟡 Em Férias</option>
                    <option value="Ausente">🔴 Ausente / Afastado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa Horária (R$/hora)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-xs">R$</span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Conectar ao Setor no Canvas (Opcional)
                  </label>
                  <select
                    value={connectedSectorId}
                    onChange={(e) => setConnectedSectorId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Nenhum (Vínculo independente)</option>
                    {sectorNodes.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏢 {s.name} ({s.data.sectorCode || 'Setor'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Certifications Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Certificações & Habilitações Técnicas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  {CERTIFICATION_OPTIONS.map((cert) => {
                    const isChecked = selectedCertifications.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCertification(cert)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all text-left ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{cert}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Criar Quadro do Funcionário no Canvas
                </button>
              </div>
            </form>
          )}

          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar funcionário por nome, RE, cargo ou setor..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Employees List */}
              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm">Nenhum funcionário encontrado no canvas.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    + Clique aqui para cadastrar o primeiro funcionário
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        if (onFocusNode) {
                          onFocusNode(emp.id);
                          onClose();
                        }
                      }}
                      className="p-3 bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all cursor-pointer group flex items-start justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg border ${
                            emp.type === 'supervisor'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {emp.type === 'supervisor' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                            {emp.name}
                          </h4>
                          <p className="text-xs text-slate-300 font-medium">{emp.data.role}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                            <span>RE: {emp.data.employeeId || 'N/A'}</span>
                            <span>•</span>
                            <span>{emp.data.department || 'Setor'}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${
                          emp.data.employeeStatus === 'Disponível'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : emp.data.employeeStatus === 'Em Serviço'
                            ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        {emp.data.employeeStatus || 'Ativo'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="space-y-6 text-center py-6">
              <div className="max-w-md mx-auto space-y-3">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 inline-block text-amber-400">
                  <Sparkles className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-base font-bold text-white">Gerar Esquadrão Industrial Completo</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adiciona instantaneamente ao canvas uma equipe completa composta por 1 Encarregado de Turno e 3 Operadores Especializados (CNC, Qualidade NDT e Solda TIG) já pré-conectados aos setores fabris.
                </p>

                <button
                  onClick={handleCreateSquadPreset}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <Users className="w-4 h-4" />
                  Gerar Equipe Fabril Completa no Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
