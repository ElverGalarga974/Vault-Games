import React from 'react';
import { Play, Gamepad2, Swords, Box, MousePointerClick, Puzzle, Trophy, Globe, Library } from 'lucide-react';
import { Game } from '../data/games';
import { motion } from 'motion/react';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

interface GameCardProps {
  key?: string | number;
  game: Game;
  onClick: (game: Game) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  'Action': Swords,
  'Sandbox': Box,
  'Clicker': MousePointerClick,
  'Puzzle': Puzzle,
  'Sports': Trophy,
  'IO Games': Globe,
  'Classics': Library,
};

const categoryColors: Record<string, string> = {
  'Action': 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30',
  'Sandbox': 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  'Clicker': 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
  'Puzzle': 'from-purple-500/20 to-fuchsia-500/20 text-purple-400 border-purple-500/30',
  'Sports': 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
  'IO Games': 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
  'Classics': 'from-slate-500/20 to-gray-500/20 text-slate-400 border-slate-500/30',
};

export function GameCard({ game, onClick }: GameCardProps) {
  const { state } = useGameContext();
  const { t } = useLanguage();
  const hasNeon = state.inventory.includes('neon-theme');
  const hasEmerald = state.inventory.includes('emerald-theme');
  const hasRuby = state.inventory.includes('ruby-theme');
  const Icon = categoryIcons[game.category] || Gamepad2;
  const colorClass = categoryColors[game.category] || 'from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/30';

  const themeClasses = hasNeon
    ? { border: 'border-fuchsia-500/30', shadow: 'hover:shadow-[0_10px_40px_rgba(236,72,153,0.5)]', play: 'bg-fuchsia-600/90 shadow-[0_0_30px_rgba(236,72,153,0.8)]', tag: 'text-fuchsia-300 border-fuchsia-500/30' }
    : hasEmerald
    ? { border: 'border-emerald-500/30', shadow: 'hover:shadow-[0_10px_40px_rgba(52,211,153,0.4)]', play: 'bg-emerald-600/90 shadow-[0_0_30px_rgba(52,211,153,0.8)]', tag: 'text-emerald-300 border-emerald-500/30' }
    : hasRuby
    ? { border: 'border-red-500/30', shadow: 'hover:shadow-[0_10px_40px_rgba(239,68,68,0.4)]', play: 'bg-red-600/90 shadow-[0_0_30px_rgba(239,68,68,0.8)]', tag: 'text-red-300 border-red-500/30' }
    : { border: 'border-white/5', shadow: 'hover:shadow-[0_10px_30px_rgba(139,92,246,0.3)]', play: 'bg-white/10 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-white/20', tag: colorClass.split(' ').slice(2).join(' ') };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(game)}
      className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 bg-[#1a1a1a] border aspect-square sm:aspect-[4/3] flex flex-col justify-center items-center p-3 sm:p-6 ${themeClasses.border} ${themeClasses.shadow}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#1a1a1a]/80 to-[#1a1a1a] z-0" />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-2 sm:gap-4">
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl transform group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 sm:w-10 sm:h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div>
          <h3 className="text-sm sm:text-xl font-bold text-white tracking-tight drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all leading-tight">
            {game.title}
          </h3>
          <span className={`inline-block mt-1 sm:mt-2 text-[9px] sm:text-xs font-bold uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-md border bg-black/40 ${themeClasses.tag}`}>
            {t(`cat.${game.category.toLowerCase().replace(' ', '')}`)}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
        <div className={`p-3 sm:p-5 rounded-full backdrop-blur-md transform scale-75 group-hover:scale-100 transition-all duration-300 ${themeClasses.play}`}>
          <Play className="w-5 h-5 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" />
        </div>
      </div>
    </motion.div>
  );
}
