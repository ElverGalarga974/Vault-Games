import { Search, Flame, Menu, Coins, Store, Target, Trophy, User, Map, ChevronUp, ChevronDown, Crown } from 'lucide-react';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuClick: () => void;
  onOpenStore: () => void;
  onOpenQuests: () => void;
  onOpenAchievements: () => void;
  onOpenProfile: () => void;
  onOpenRoadmap: () => void;
  onOpenDailyRewards: () => void;
  onOpenAuthModal: () => void;
}

export function Header({ searchQuery, onSearchChange, onMenuClick, onOpenStore, onOpenQuests, onOpenAchievements, onOpenProfile, onOpenRoadmap, onOpenDailyRewards, onOpenAuthModal }: HeaderProps) {
  const { state, getMultiplier } = useGameContext();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  const multiplier = getMultiplier();

  return (
    <header className="sticky top-0 z-40 flex flex-col">
      <motion.div 
        initial={false}
        animate={{ height: isVisible ? 'auto' : 0, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden bg-[#111]/80 backdrop-blur-md border-b border-white/5"
      >
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-white/10 rounded-xl leading-5 bg-[#1a1a1a] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all duration-200"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-3 bg-[#1a1a1a] px-3 sm:px-4 py-2 rounded-xl border border-white/5 shadow-inner">
              <button onClick={onOpenRoadmap} className="flex items-center gap-1.5 text-blue-400 font-bold text-sm hover:text-blue-300 transition-colors" title={`${t('header.roadmap')} (Click to open Roadmap)`}>
                <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">{t('header.lvl')}</span>
                {state.level}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={onOpenStore} className="flex items-center gap-1.5 text-yellow-400 font-bold text-sm hover:text-yellow-300 transition-colors" title={`${t('header.coins')} (Click to open Store)`}>
                <Coins className="w-4 h-4" />
                {state.coins}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={onOpenDailyRewards} className="flex items-center gap-1.5 text-orange-400 font-bold text-sm hover:text-orange-300 transition-colors" title={`${t('header.streak')} (${multiplier.toFixed(1)}x ${t('header.multiplier')}) - ${t('header.rewards')}`}>
                <Flame className={`w-4 h-4 ${state.streak > 0 ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-gray-600'}`} />
                {state.streak}
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1 rounded ml-1">{multiplier.toFixed(1)}x</span>
              </button>
              {state.isOwner && (
                <>
                  <div className="w-px h-4 bg-white/20" />
                  <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" title="Owner">
                    <Crown className="w-3 h-3" />
                  </span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <button onClick={onOpenRoadmap} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors" title={t('header.roadmap')}>
                <Map className="w-5 h-5" />
              </button>
              <button onClick={onOpenQuests} className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-full transition-colors" title={t('header.quests')}>
                <Target className="w-5 h-5" />
              </button>
              <button onClick={onOpenAchievements} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-full transition-colors" title={t('header.achievements')}>
                <Trophy className="w-5 h-5" />
              </button>
              <button onClick={onOpenStore} className="p-2 text-gray-400 hover:text-violet-400 hover:bg-violet-400/10 rounded-full transition-colors" title={t('header.store')}>
                <Store className="w-5 h-5" />
              </button>
              {state.authMode !== 'none' && (
                <button onClick={onOpenProfile} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors" title={t('header.profile')}>
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
            {state.authMode !== 'logged_in' && (
              <button 
                onClick={onOpenAuthModal} 
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-lg shadow-purple-600/20"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </motion.div>
      
      <div className="relative h-0 w-full flex justify-center">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="absolute top-0 bg-[#111]/90 backdrop-blur-md border border-t-0 border-white/10 px-6 py-1 rounded-b-xl text-gray-400 hover:text-white transition-colors flex items-center justify-center shadow-lg z-50"
          title={isVisible ? "Hide Header" : "Show Header"}
        >
          {isVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
