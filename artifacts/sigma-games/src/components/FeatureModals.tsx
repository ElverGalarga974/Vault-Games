import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Coins, Trophy, Target, Store as StoreIcon, Check } from 'lucide-react';
import { useGameContext } from '../context/GameContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function BaseModal({ isOpen, onClose, title, icon, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            {icon}
            {title}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function StoreModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, buyItem } = useGameContext();
  
  const items = [
    { id: 'streak-freeze', name: 'Streak Freeze', desc: 'Saves your streak if you miss a day!', cost: 200, consumable: true, icon: <Flame className="w-6 h-6 text-blue-400" /> },
    { id: 'neon-theme', name: 'Neon Glow Theme', desc: 'Adds a premium neon glow to all game cards.', cost: 500, consumable: false, icon: <StoreIcon className="w-6 h-6 text-fuchsia-400" /> },
    { id: 'golden-crown', name: 'Golden Crown', desc: 'A shiny badge next to your streak.', cost: 1000, consumable: false, icon: <Trophy className="w-6 h-6 text-yellow-400" /> },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Store" icon={<StoreIcon className="w-5 h-5 text-violet-400" />}>
      <div className="flex items-center justify-between mb-6 bg-violet-500/10 p-3 rounded-xl border border-violet-500/20">
        <span className="text-gray-300 font-medium">Your Balance</span>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
          <Coins className="w-5 h-5" />
          {state.coins}
        </div>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const ownedCount = item.consumable ? state.inventory.filter(i => i === item.id).length : (state.inventory.includes(item.id) ? 1 : 0);
          const canBuy = state.coins >= item.cost && (item.consumable || ownedCount === 0);
          
          return (
            <div key={item.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">{item.icon}</div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">{item.name} {ownedCount > 0 && <span className="text-xs text-violet-400 ml-1">(Owned: {ownedCount})</span>}</h4>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <button 
                onClick={() => buyItem(item.id, item.cost, item.consumable)}
                disabled={!canBuy}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors ${canBuy ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
              >
                {ownedCount > 0 && !item.consumable ? 'Owned' : <><Coins className="w-4 h-4" /> {item.cost}</>}
              </button>
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}

export function QuestsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, claimQuest } = useGameContext();
  
  const quests = [
    { id: 'play-3', name: 'Play 3 Games', desc: 'Play any 3 games today.', target: 3, progress: state.gamesPlayedToday, reward: 50 },
    { id: 'play-sports', name: 'Sports Fan', desc: 'Play 1 Sports game today.', target: 1, progress: state.sportsGamesPlayed, reward: 30 },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Daily Quests" icon={<Target className="w-5 h-5 text-emerald-400" />}>
      <div className="space-y-3">
        {quests.map(q => {
          const isComplete = q.progress >= q.target;
          const isClaimed = state.claimedQuests.includes(q.id);
          
          return (
            <div key={q.id} className="bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-sm">{q.name}</h4>
                  <p className="text-gray-400 text-xs">{q.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm bg-yellow-400/10 px-2 py-1 rounded-md">
                  <Coins className="w-4 h-4" /> +{q.reward}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-400 w-8 text-right">{Math.min(q.progress, q.target)}/{q.target}</span>
              </div>
              <button 
                onClick={() => claimQuest(q.id, q.reward)}
                disabled={!isComplete || isClaimed}
                className={`w-full mt-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isClaimed ? 'bg-white/5 text-gray-500' : isComplete ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
              >
                {isClaimed ? <><Check className="w-4 h-4" /> Claimed</> : 'Claim Reward'}
              </button>
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}

export function AchievementsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state } = useGameContext();
  
  const achievements = [
    { id: 'first-blood', name: 'First Blood', desc: 'Play your first game.', reward: 100 },
    { id: 'gamer', name: 'Gamer', desc: 'Play 10 games total.', reward: 500 },
    { id: 'dedicated', name: 'Dedicated', desc: 'Reach a 3-day streak.', reward: 300 },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Achievements" icon={<Trophy className="w-5 h-5 text-yellow-400" />}>
      <div className="space-y-3">
        {achievements.map(a => {
          const isUnlocked = state.unlockedAchievements.includes(a.id);
          
          return (
            <div key={a.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${isUnlocked ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-black/40 border-white/5 opacity-60'}`}>
              <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-gray-500'}`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`}>{a.name}</h4>
                <p className="text-gray-500 text-xs mt-0.5">{a.desc}</p>
              </div>
              {isUnlocked && <Check className="w-5 h-5 text-yellow-400" />}
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}
