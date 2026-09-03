import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlayCircle,
  Play,
  Pause,
  Timer,
  Trophy,
  Filter,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { CanvasNode, Connection } from '../../types/canvas';
import { getSimplifiedViewData } from '../../utils/flowIntelligence';

interface SimplifiedViewProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isAutopilotActive?: boolean;
  onClose: () => void;
  onNavigateToNode: (nodeId: string) => void;
}

export const SimplifiedView: React.FC<SimplifiedViewProps> = ({
  nodes,
  connections,
  isAutopilotActive = false,
  onClose,
  onNavigateToNode
}) => {
  const [filter, setFilter] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [count, setCount] = useState(0);
  const [hideValues, setHideValues] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(10000); // Default 10s
  const [progress, setProgress] = useState(0);

  const [isScanning, setIsScanning] = useState(false);

  const data = getSimplifiedViewData(nodes, connections, filter, isAutopilotActive);

  const availableFilters = [
    { id: 'all', label: 'Toda a Fábrica' },
    { id: 'production', label: 'Produção' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'projects', label: 'Projetos' },
    { id: 'tasks', label: 'Tarefas' },
    ...nodes.filter(n => ['order', 'project', 'customer'].includes(n.type)).map(n => ({
      id: n.id,
      label: `${n.type === 'customer' ? 'Cliente' : n.type === 'order' ? 'Pedido' : 'Projeto'}: ${n.name}`
    }))
  ];

  // Auto-play logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    if (isPlaying) {
      const startTime = Date.now();
      
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / playInterval) * 100;
        if (newProgress <= 100) {
          setProgress(newProgress);
        }
      }, 100);

      timer = setTimeout(() => {
        const currentIndex = availableFilters.findIndex(f => f.id === filter);
        const nextIndex = (currentIndex + 1) % availableFilters.length;
        setFilter(availableFilters[nextIndex].id);
        setProgress(0);
      }, playInterval);
    } else {
      setProgress(0);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [isPlaying, filter, playInterval, availableFilters.length]);

  // Trigger scan effect on filter change
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => setIsScanning(false), 1000);
    return () => clearTimeout(timer);
  }, [filter]);

  // Animate counter
  useEffect(() => {
    let start = 0;
    const end = data.percentage;
    if (start === end) return;
    
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [data.percentage, filter]);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-rose-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-blue-500';
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-xl text-white overflow-hidden ${isFullScreen ? 'p-0' : 'p-6'}`}
    >
      {/* Auto-play Progress Bar at the very top */}
      {isPlaying && (
        <div className="absolute top-0 left-0 right-0 h-1 z-[110] overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8 px-4">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-slate-300 font-medium backdrop-blur-md"
        >
          <ArrowLeft size={18} />
          <span>Voltar ao Canvas</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Auto Play Controls */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 backdrop-blur-md">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isPlaying ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`}
              title={isPlaying ? "Pausar Apresentação" : "Iniciar Apresentação Automática"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="text-xs font-bold uppercase tracking-wider">{isPlaying ? 'Pausar' : 'Auto Play'}</span>
            </button>
            
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            
            <div className="relative group/interval">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                <Timer size={16} />
                <span className="text-xs font-bold">{playInterval / 1000}s</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/interval:opacity-100 group-hover/interval:visible transition-all z-50">
                {[5, 10, 15, 30].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setPlayInterval(s * 1000);
                      setProgress(0);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-white/5 transition-colors text-xs font-bold ${playInterval === s * 1000 ? 'text-blue-400' : 'text-slate-400'}`}
                  >
                    {s} SEGUNDOS
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-slate-300 backdrop-blur-md">
              <Filter size={18} />
              <span className="font-medium">{availableFilters.find(f => f.id === filter)?.label}</span>
              <ChevronDown size={16} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900/90 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-96 overflow-y-auto backdrop-blur-xl">
              {availableFilters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors text-sm ${filter === f.id ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setHideValues(!hideValues)}
            className={`p-2 rounded-xl border transition-all ${hideValues ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
            title={hideValues ? "Mostrar Valores" : "Ocultar Valores"}
          >
            {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          <button 
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 backdrop-blur-md"
            title="Modo Telão"
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {isScanning && (
            <>
              <motion.div
                initial={{ top: '-10%', opacity: 0 }}
                animate={{ top: '110%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "linear" }}
                className={`absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-${data.statusType === 'error' ? 'rose' : data.statusType === 'warning' ? 'amber' : 'emerald'}-500/20 to-transparent z-50 border-y border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]`}
              />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.2, 0.1, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay z-40"
              />
            </>
          )}
        </AnimatePresence>

        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Particle Overlay (Simple CSS implementation) */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-4 text-center relative z-10 overflow-hidden py-4">
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-50 pointer-events-none"
            >
              <span className="text-4xl md:text-6xl font-black text-emerald-400/30 tracking-[1em] blur-sm animate-pulse">
                ANALYZING...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-4"
            >
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className={`h-[2px] w-24 mx-auto mb-4 ${getStatusBg(data.statusType)}`} 
              />
              <h2 className={`font-black tracking-[0.4em] text-xs mb-3 uppercase ${getStatusColor(data.statusType)}`}>{data.subtitle}</h2>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-none">
                {data.title.split(' ').map((word, i) => (
                  <motion.span 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="inline-block mr-3"
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
            </motion.div>

            {/* Circular Chart with Glow */}
            <div className="relative w-64 h-64 md:w-[380px] md:h-[380px] mb-8 md:mb-12 group shrink-0">
              {/* External Glow Ring */}
              <motion.div 
                animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`absolute inset-0 rounded-full blur-[40px] opacity-20 ${getStatusBg(data.statusType)}`}
              />
              
              <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  className="text-white/5"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                  r="44"
                  cx="50"
                  cy="50"
                />
                {/* Progress circle */}
                <motion.circle
                  initial={{ strokeDasharray: "0 276.5" }}
                  animate={{ strokeDasharray: `${(data.percentage / 100) * 276.5} 276.5` }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className={`${data.percentage === 100 ? 'text-emerald-500' : data.lateTasks > 0 ? 'text-rose-500' : 'text-blue-500'} drop-shadow-[0_0_8px_currentColor]`}
                  strokeWidth="6"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="44"
                  cx="50"
                  cy="50"
                />
                
                {/* Animated Tip Dot */}
                {data.percentage > 0 && (
                  <motion.circle
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="fill-white shadow-xl"
                    r="1.5"
                    cx={50 + 44 * Math.cos((data.percentage / 100) * 2 * Math.PI - Math.PI / 2)}
                    cy={50 + 44 * Math.sin((data.percentage / 100) * 2 * Math.PI - Math.PI / 2)}
                  />
                )}
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center"
                >
                  <div className="flex items-baseline">
                    <motion.span 
                      className="text-7xl md:text-[140px] font-black tabular-nums tracking-tighter"
                    >
                      {count}
                    </motion.span>
                    <span className="text-3xl md:text-5xl font-black text-white/30 ml-1">%</span>
                  </div>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-xs md:text-base font-black text-slate-400 tracking-[0.5em] mt-2 md:mt-4"
                  >
                    CONCLUÍDO
                  </motion.span>
                </motion.div>
              </div>
            </div>

            {/* Indicators with Stagger Animation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-12">
              {[
                { label: 'Tarefas', value: data.totalTasks, color: 'text-white', icon: null },
                { label: 'Concluídas', value: data.completedTasks, color: 'text-emerald-400', icon: <CheckCircle2 size={14} />, action: true },
                { label: 'Em Curso', value: data.inProgressTasks, color: 'text-blue-400', icon: <PlayCircle size={14} />, action: true },
                { label: 'Atrasadas', value: data.lateTasks, color: 'text-rose-400', icon: <AlertTriangle size={14} />, action: true, highlight: data.lateTasks > 0 },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + (index * 0.1) }}
                  onClick={() => item.action && onClose()}
                  className={`relative overflow-hidden group bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${item.highlight ? 'ring-2 ring-rose-500/50' : ''}`}
                >
                  {/* Glossy Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5 ${item.color}`}>
                    {item.icon} {item.label}
                  </span>
                  <span className={`text-4xl font-black tabular-nums transition-transform group-hover:scale-110 block ${item.highlight ? 'text-rose-500 animate-pulse' : ''}`}>
                    {item.value}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Horizontal Status Bar */}
            <div className="w-full max-w-3xl mb-12">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${getStatusBg(data.statusType)}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo Real • Fluxo de Operação</span>
                </div>
                <span className="text-xl font-black text-white tracking-tighter">{data.percentage}%</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.percentage}%` }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${getStatusBg(data.statusType)} relative overflow-hidden`}
                >
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                  />
                </motion.div>
              </div>
            </div>

            {/* Status Alert Message */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, type: "spring" }}
              className={`px-6 py-4 md:px-10 md:py-6 rounded-2xl md:rounded-[2.5rem] border-2 flex flex-col items-center gap-2 md:gap-3 max-w-2xl w-full relative overflow-hidden backdrop-blur-2xl shadow-2xl shrink-0 ${
                data.statusType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                data.statusType === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                data.statusType === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}
            >
              {/* Animated Background Pulse for the Alert */}
              <motion.div 
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 ${getStatusBg(data.statusType)}`}
              />
              
              <div className="flex items-center gap-3 font-black text-2xl md:text-3xl tracking-tighter relative z-10">
                {data.statusType === 'success' ? <Trophy size={32} className="drop-shadow-lg" /> : 
                 data.statusType === 'error' ? <AlertTriangle size={32} className="drop-shadow-lg" /> : 
                 data.statusType === 'warning' ? <Clock size={32} className="drop-shadow-lg" /> : <PlayCircle size={32} className="drop-shadow-lg" />}
                {data.statusType === 'error' ? 'ALERTA CRÍTICO' : 
                 data.statusType === 'success' ? 'SITUAÇÃO SOB CONTROLE' : 'FLUXO ATIVO'}
              </div>
              <p className="text-center text-lg font-bold opacity-90 tracking-tight relative z-10 max-w-md">{data.statusText}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modern Footer Metrics */}
      <div className="relative z-10 p-6 md:p-8 flex justify-center items-center gap-16 text-slate-500 border-t border-white/5 shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-50">{data.secondaryMetricLabel}</span>
          <span className="text-2xl font-black text-white/70 tracking-tighter">
            {hideValues ? '••••••' : data.secondaryMetricValue}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-50">Sincronismo</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-white/70">DADOS EM TEMPO REAL</span>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
