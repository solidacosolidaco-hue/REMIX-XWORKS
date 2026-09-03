import React, { useEffect, useState } from 'react';
import { PresentationSlide } from '../../types/canvas';
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize2 } from 'lucide-react';

interface PresentationControllerProps {
  slides: PresentationSlide[];
  currentSlideIndex: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onExit: () => void;
}

export const PresentationController: React.FC<PresentationControllerProps> = ({
  slides,
  currentSlideIndex,
  onNextSlide,
  onPrevSlide,
  onExit,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        onNextSlide();
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, onNextSlide]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      id="presentation-controller"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-500/80 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.25)] backdrop-blur-2xl px-5 py-3 flex items-center gap-4 text-slate-100 font-mono select-none animate-in slide-in-from-bottom-6 duration-200"
    >
      <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
        <span className="text-xs font-bold text-amber-400">APRESENTAÇÃO</span>
        <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
          {currentSlideIndex + 1} / {slides.length}
        </span>
      </div>

      <div className="text-center min-w-[200px] max-w-[320px]">
        <div className="text-xs font-bold text-slate-100 truncate">
          {currentSlide?.title || `Slide ${currentSlideIndex + 1}`}
        </div>
        {currentSlide?.description && (
          <div className="text-[10px] text-slate-400 truncate">
            {currentSlide.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
        <button
          onClick={onPrevSlide}
          disabled={currentSlideIndex === 0}
          className={`p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors ${
            currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          title="Slide Anterior (Seta Esquerda)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-lg shadow-amber-500/20"
          title={isPlaying ? 'Pausar reprodução automática' : 'Iniciar apresentação automática'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={onNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className={`p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors ${
            currentSlideIndex === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          title="Próximo Slide (Seta Direita / Espaço)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" />

        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-rose-900/50 hover:text-rose-300 transition-colors"
          title="Sair da Apresentação (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
