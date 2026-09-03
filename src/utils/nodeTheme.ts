import { NodeColor } from '../types/canvas';

export interface NodeColorTheme {
  color: NodeColor;
  ringSelected: string;
  shadowSelected: string;
  borderNormal: string;
  borderHover: string;
  bgGradient: string;
  bgSubtle: string;
  textAccent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconBg: string;
  iconBorder: string;
  iconText: string;
}

export const NODE_COLOR_THEMES: Record<NodeColor, NodeColorTheme> = {
  blue: {
    color: 'blue',
    ringSelected: 'ring-2 ring-blue-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(59,130,246,0.6)]',
    borderNormal: 'border-blue-500/50',
    borderHover: 'hover:border-blue-400',
    bgGradient: 'from-blue-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-blue-950/20',
    textAccent: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-300',
    iconBg: 'bg-blue-500/20',
    iconBorder: 'border-blue-500/30',
    iconText: 'text-blue-400',
  },
  emerald: {
    color: 'emerald',
    ringSelected: 'ring-2 ring-emerald-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(16,185,129,0.6)]',
    borderNormal: 'border-emerald-500/50',
    borderHover: 'hover:border-emerald-400',
    bgGradient: 'from-emerald-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-emerald-950/20',
    textAccent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    iconBorder: 'border-emerald-500/30',
    iconText: 'text-emerald-400',
  },
  cyan: {
    color: 'cyan',
    ringSelected: 'ring-2 ring-cyan-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(6,182,212,0.6)]',
    borderNormal: 'border-cyan-500/50',
    borderHover: 'hover:border-cyan-400',
    bgGradient: 'from-cyan-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-cyan-950/20',
    textAccent: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    iconBg: 'bg-cyan-500/20',
    iconBorder: 'border-cyan-500/30',
    iconText: 'text-cyan-400',
  },
  amber: {
    color: 'amber',
    ringSelected: 'ring-2 ring-amber-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(245,158,11,0.6)]',
    borderNormal: 'border-amber-500/50',
    borderHover: 'hover:border-amber-400',
    bgGradient: 'from-amber-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-amber-950/20',
    textAccent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
    iconBorder: 'border-amber-500/30',
    iconText: 'text-amber-400',
  },
  rose: {
    color: 'rose',
    ringSelected: 'ring-2 ring-rose-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(244,63,94,0.6)]',
    borderNormal: 'border-rose-500/50',
    borderHover: 'hover:border-rose-400',
    bgGradient: 'from-rose-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-rose-950/20',
    textAccent: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    iconBg: 'bg-rose-500/20',
    iconBorder: 'border-rose-500/30',
    iconText: 'text-rose-400',
  },
  purple: {
    color: 'purple',
    ringSelected: 'ring-2 ring-purple-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(168,85,247,0.6)]',
    borderNormal: 'border-purple-500/50',
    borderHover: 'hover:border-purple-400',
    bgGradient: 'from-purple-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-purple-950/20',
    textAccent: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
    iconBg: 'bg-purple-500/20',
    iconBorder: 'border-purple-500/30',
    iconText: 'text-purple-400',
  },
  indigo: {
    color: 'indigo',
    ringSelected: 'ring-2 ring-indigo-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(99,102,241,0.6)]',
    borderNormal: 'border-indigo-500/50',
    borderHover: 'hover:border-indigo-400',
    bgGradient: 'from-indigo-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-indigo-950/20',
    textAccent: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    iconBg: 'bg-indigo-500/20',
    iconBorder: 'border-indigo-500/30',
    iconText: 'text-indigo-400',
  },
  slate: {
    color: 'slate',
    ringSelected: 'ring-2 ring-slate-300',
    shadowSelected: 'shadow-[0_0_35px_rgba(148,163,184,0.6)]',
    borderNormal: 'border-slate-500/50',
    borderHover: 'hover:border-slate-300',
    bgGradient: 'from-slate-900/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-slate-900/30',
    textAccent: 'text-slate-300',
    badgeBg: 'bg-slate-500/10',
    badgeBorder: 'border-slate-500/30',
    badgeText: 'text-slate-300',
    iconBg: 'bg-slate-500/20',
    iconBorder: 'border-slate-500/30',
    iconText: 'text-slate-300',
  },
  orange: {
    color: 'orange',
    ringSelected: 'ring-2 ring-orange-400',
    shadowSelected: 'shadow-[0_0_35px_rgba(249,115,22,0.6)]',
    borderNormal: 'border-orange-500/50',
    borderHover: 'hover:border-orange-400',
    bgGradient: 'from-orange-950/40 via-slate-900/90 to-slate-950/90',
    bgSubtle: 'bg-orange-950/20',
    textAccent: 'text-orange-400',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-300',
    iconBg: 'bg-orange-500/20',
    iconBorder: 'border-orange-500/30',
    iconText: 'text-orange-400',
  },
};

export function getNodeColorTheme(color?: NodeColor): NodeColorTheme {
  if (!color || !NODE_COLOR_THEMES[color]) {
    return NODE_COLOR_THEMES.blue;
  }
  return NODE_COLOR_THEMES[color];
}
