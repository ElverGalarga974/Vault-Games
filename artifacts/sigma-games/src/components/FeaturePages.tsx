import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { progressApi, profileApi } from '../api/client';
import { SC_ALL_COSMETICS, RARITY_COLORS } from '../games/NeonClicker';
import { Store, Target, Trophy, CheckCircle2, Lock, Flame, Sparkles, Crown, Coins, Star, Zap, Shield, Medal, Gem, Puzzle, CalendarDays, PackageOpen, Palette, Edit2, Gift, Key, Download, Upload, Settings, Globe, LogOut, Hexagon, Award, Users } from 'lucide-react';

import { ACHIEVEMENTS_DATA } from '../data/achievements';
export { ACHIEVEMENTS_DATA };
import {
  SIGMA_BADGE_INFO,
  STORE_ITEMS,
  LEVEL_REWARDS,
  BANNER_PRESETS,
  DISPLAYABLE_ITEMS,
  PROFILE_BORDERS,
} from '../data/featureData';
export {
  SIGMA_BADGE_INFO,
  STORE_ITEMS,
  LEVEL_REWARDS,
  BANNER_PRESETS,
  DISPLAYABLE_ITEMS,
  PROFILE_BORDERS,
};

export function StorePage() {
  const { state, buyItem, openMysteryBox, setActiveBorder } = useGameContext();
  const { t } = useLanguage();
  const [mysteryResult, setMysteryResult] = useState<string | null>(null);

  const BORDER_ITEM_IDS = ['border-flame', 'border-frost', 'border-toxic', 'border-galaxy', 'border-rainbow', 'border-legendary'];

  const handleOpenBox = () => {
    const result = openMysteryBox();
    if (result) {
      setMysteryResult(result);
      setTimeout(() => setMysteryResult(null), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-fuchsia-500/20 rounded-2xl border border-fuchsia-500/30">
          <Store className="w-8 h-8 text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('store.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('store.desc')}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <PackageOpen className="w-6 h-6 text-fuchsia-400" />
          {t('store.mystery')}
        </h2>
        <div className="bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/20 blur-3xl rounded-full" />
          
          <div className="w-32 h-32 shrink-0 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(217,70,239,0.3)] border border-white/20 relative z-10">
            <PackageOpen className="w-16 h-16 text-white" />
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-3xl font-bold text-white mb-2">{t('store.snake')}</h3>
            <p className="text-fuchsia-200/70 text-lg mb-6 max-w-md">
              {t('store.snake.desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleOpenBox}
                disabled={state.coins < 500}
                className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  state.coins >= 500 
                    ? 'bg-white text-black hover:scale-105 shadow-xl shadow-white/10' 
                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Coins className="w-5 h-5" />
                {t('store.open').replace('{cost}', '500')}
              </button>
              
              <AnimatePresence>
                {mysteryResult && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg font-bold flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('store.unlocked').replace('{item}', mysteryResult.toUpperCase())}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Star className="w-6 h-6 text-yellow-400" />
        {t('store.cosmetics')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const purchaseCount = (item as any).maxPurchases ? state.inventory.filter((x: string) => x === item.id).length : 0;
          const isOwned = !item.isConsumable
            ? state.inventory.includes(item.id)
            : (item as any).maxPurchases !== undefined && purchaseCount >= (item as any).maxPurchases;
          const isBorder = BORDER_ITEM_IDS.includes(item.id);
          const isEquipped = isBorder && state.activeBorder === item.id;
          const canAfford = state.coins >= item.cost;

          return (
            <motion.div 
              key={item.id}
              whileHover={{ y: -5 }}
              className={`relative overflow-hidden rounded-3xl bg-[#1a1a1a] border ${isEquipped ? 'border-white/40' : item.border} p-6 flex flex-col`}
            >
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl ${item.bg} opacity-50`} />
              {isEquipped && <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">{t('store.active')}</div>}
              
              <div className="relative z-10 flex-1">
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t(`store.item.${item.id}.name`)}</h3>
                <p className="text-gray-400 leading-relaxed">{t(`store.item.${item.id}.desc`)}</p>
              </div>

              <div className="relative z-10 mt-8">
                {isOwned && isBorder ? (
                  <button
                    onClick={() => setActiveBorder(isEquipped ? 'default' : item.id)}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      isEquipped
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/5'
                        : 'bg-white text-black hover:scale-[1.02] shadow-xl shadow-white/10'
                    }`}
                  >
                    {isEquipped ? <><CheckCircle2 className="w-5 h-5" /> {t('store.unequip')}</> : <>{t('store.equip')}</>}
                  </button>
                ) : isOwned ? (
                  <button disabled className="w-full py-4 rounded-xl font-bold bg-white/5 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2 border border-white/5">
                    <CheckCircle2 className="w-5 h-5" />
                    {(item as any).maxPurchases ? `Max (${purchaseCount}/${(item as any).maxPurchases})` : t('store.owned')}
                  </button>
                ) : (
                  <button
                    onClick={() => buyItem(item.id, item.cost, item.isConsumable)}
                    disabled={!canAfford}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      canAfford 
                        ? `bg-white text-black hover:scale-[1.02] shadow-xl shadow-white/10` 
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <Coins className="w-5 h-5" />
                    {(item as any).maxPurchases && purchaseCount > 0
                      ? `${item.cost} coins (${purchaseCount}/${(item as any).maxPurchases})`
                      : `${item.cost} ${t('header.coins')}`}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function QuestsPage() {
  const { state, claimQuest } = useGameContext();
  const { t } = useLanguage();

  const allDailyQuests = [
    { id: 'daily-play-3', title: 'Warmup', description: 'Play 3 games today', target: 3, progress: state.gamesPlayedToday, reward: 50 },
    { id: 'daily-play-10', title: 'Marathon', description: 'Play 10 games today', target: 10, progress: state.gamesPlayedToday, reward: 200 },
    { id: 'daily-action-2', title: 'Action Hero', description: 'Play 2 Action games today', target: 2, progress: state.dailyActionGamesPlayed, reward: 100 },
    { id: 'daily-puzzle-2', title: 'Puzzle Master', description: 'Play 2 Puzzle games today', target: 2, progress: state.dailyPuzzleGamesPlayed, reward: 100 },
    { id: 'daily-sports-2', title: 'Athlete', description: 'Play 2 Sports games today', target: 2, progress: state.dailySportsGamesPlayed, reward: 100 },
    { id: 'daily-clicker-1', title: 'Click Frenzy', description: 'Play 1 Clicker game today', target: 1, progress: state.dailyClickerGamesPlayed, reward: 75 },
    { id: 'daily-io-2', title: 'Online Warrior', description: 'Play 2 IO Games today', target: 2, progress: state.dailyIoGamesPlayed, reward: 100 },
    { id: 'daily-papas-1', title: "Papa's Helper", description: "Play a Papa's game today", target: 1, progress: state.dailyPapasGamesPlayed, reward: 75 },
  ];

  const allWeeklyQuests = [
    { id: 'weekly-play-25', title: 'Weekend Warrior', description: 'Play 25 games this week', target: 25, progress: state.weeklyGamesPlayed, reward: 1000 },
    { id: 'weekly-streak-5', title: 'Consistent Gamer', description: 'Reach a 5-day streak', target: 5, progress: state.streak, reward: 500 },
    { id: 'weekly-action-10', title: 'Action Fanatic', description: 'Play 10 Action games this week', target: 10, progress: state.actionGamesPlayed, reward: 800 },
    { id: 'weekly-puzzle-10', title: 'Big Brain', description: 'Play 10 Puzzle games this week', target: 10, progress: state.puzzleGamesPlayed, reward: 800 },
    { id: 'weekly-sports-7', title: 'League MVP', description: 'Play 7 Sports games this week', target: 7, progress: state.sportsGamesPlayed, reward: 500 },
    { id: 'weekly-clicker-5', title: 'Clicker Legend', description: 'Play 5 Clicker games this week', target: 5, progress: state.clickerGamesPlayed, reward: 350 },
    { id: 'weekly-io-8', title: 'IO Dominator', description: 'Play 8 IO Games this week', target: 8, progress: state.ioGamesPlayed, reward: 600 },
    { id: 'weekly-papas-3', title: "Papa's Regular", description: "Play 3 Papa's games this week", target: 3, progress: state.papasGamesPlayed, reward: 350 },
  ];

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const weekOfYear = Math.floor(dayOfYear / 7);

  const pickRotating = <T,>(arr: T[], seed: number, count: number): T[] => {
    const indices: number[] = [];
    let s = seed;
    while (indices.length < count && indices.length < arr.length) {
      s = (s * 31 + 7) % 1000003;
      const idx = s % arr.length;
      if (!indices.includes(idx)) indices.push(idx);
    }
    return indices.map(i => arr[i]);
  };

  const dailyQuests = pickRotating(allDailyQuests, dayOfYear, 3);
  const weeklyQuests = pickRotating(allWeeklyQuests, weekOfYear, 3);

  const renderQuest = (quest: any, isWeekly = false) => {
    const isCompleted = quest.progress >= quest.target;
    const isClaimed = isWeekly 
      ? state.claimedWeeklyQuests.includes(quest.id) 
      : state.claimedQuests.includes(quest.id);
    const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);

    return (
      <motion.div 
        key={quest.id}
        whileHover={{ scale: 1.01 }}
        className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{t(`quest.${quest.id}.title`)}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border ${
              isWeekly ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }`}>
              <Coins className="w-4 h-4" /> {quest.reward}
            </span>
          </div>
          <p className="text-gray-400 mb-4">{t(`quest.${quest.id}.desc`)}</p>
          
          <div className="w-full bg-black/50 rounded-full h-3 border border-white/5 overflow-hidden">
            <div 
              className={`${isWeekly ? 'bg-blue-500' : 'bg-emerald-500'} h-full rounded-full transition-all duration-1000 ease-out relative`}
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
            </div>
          </div>
          <div className="text-right mt-2 text-sm font-medium text-gray-500">
            {Math.min(quest.progress, quest.target)} / {quest.target}
          </div>
        </div>

        <div className="w-full sm:w-auto">
          {isClaimed ? (
            <button disabled className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold bg-white/5 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2 border border-white/5">
              <CheckCircle2 className="w-5 h-5" /> {t('quests.claimed')}
            </button>
          ) : (
            <button
              onClick={() => claimQuest(quest.id, quest.reward, isWeekly)}
              disabled={!isCompleted}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                isCompleted 
                  ? (isWeekly ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20')
                  : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isCompleted ? t('quests.claim') : t('quests.progress')}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
          <Target className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('quests.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('quests.desc')}</p>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" /> {t('quests.daily')}
          </h2>
          <div className="space-y-4">
            {dailyQuests.map(q => renderQuest(q, false))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-400" /> {t('quests.weekly')}
          </h2>
          <div className="space-y-4">
            {weeklyQuests.map(q => renderQuest(q, true))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AchievementsPage() {
  const { state, claimAchievement } = useGameContext();
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
          <Trophy className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('achievements.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('achievements.desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACHIEVEMENTS_DATA.map((ach) => {
          const isUnlocked = state.unlockedAchievements.includes(ach.id);
          const isClaimed = state.claimedAchievements?.includes(ach.id);
          const Icon = ach.icon;

          return (
            <motion.div 
              key={ach.id}
              whileHover={{ scale: 1.02 }}
              className={`relative overflow-hidden rounded-2xl p-6 flex items-center gap-6 border transition-all duration-300 ${
                isClaimed
                  ? 'bg-[#1a1a1a] border-white/5 opacity-70'
                  : isUnlocked 
                    ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' 
                    : 'bg-[#1a1a1a] border-white/5'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                isUnlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-600'
              }`}>
                {isUnlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`text-xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                    {t(`ach.${ach.id}.title`)}
                  </h3>
                  {isClaimed ? (
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-400 text-xs font-bold border border-white/10">
                      {t('achievements.claimed')}
                    </span>
                  ) : isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                      {t('achievements.unlocked')}
                    </span>
                  ) : null}
                </div>
                <p className="text-gray-500">{t(`ach.${ach.id}.desc`)}</p>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <div className={`flex items-center gap-1.5 font-bold ${isUnlocked && !isClaimed ? 'text-yellow-400' : 'text-gray-600'}`}>
                  <Coins className="w-5 h-5" />
                  {ach.reward}
                </div>
                {'badge' in ach && ach.badge && (
                  <div className="flex items-center gap-1">
                    <img src="/sigma-badge.png" alt="Badge" className="w-4 h-4 rounded-sm" />
                    <span className={`text-[10px] font-bold ${isUnlocked ? (SIGMA_BADGE_INFO[ach.badge]?.color || 'text-cyan-400') : 'text-gray-600'}`}>
                      +Badge
                    </span>
                  </div>
                )}
                {isClaimed ? (
                  <button disabled className="px-4 py-1.5 rounded-lg font-bold bg-white/5 text-gray-500 cursor-not-allowed flex items-center gap-1.5 border border-white/5 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> {t('quests.claimed')}
                  </button>
                ) : isUnlocked ? (
                  <button
                    onClick={() => claimAchievement(ach.id, ach.reward)}
                    className="px-4 py-1.5 rounded-lg font-bold bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 transition-all text-sm"
                  >
                    {t('achievements.claim')}
                  </button>
                ) : (
                  <button disabled className="px-4 py-1.5 rounded-lg font-bold bg-white/5 text-gray-600 cursor-not-allowed border border-white/5 text-sm">
                    {t('achievements.locked')}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function InventoryPage() {
  const { state, equipSkin, setActiveBorder } = useGameContext();
  const { t } = useLanguage();
  const [scProgress, setScProgress] = useState<any>(null);
  const [scLoading, setScLoading] = useState(true);
  const [invTab, setInvTab] = useState<'store' | 'sigma'>('store');

  const ownedItems = STORE_ITEMS.filter(item => state.inventory.includes(item.id));
  const ownedSkins = state.skins?.snake || ['default'];

  useEffect(() => {
    if (state.authMode === 'logged_in') {
      progressApi.get('sigma-clicker')
        .then(data => setScProgress(data.progress))
        .catch(() => {
          try {
            const local = localStorage.getItem('sigmaClicker_v2');
            if (local) setScProgress(JSON.parse(local));
          } catch {}
        })
        .finally(() => setScLoading(false));
    } else {
      try {
        const local = localStorage.getItem('sigmaClicker_v2');
        if (local) setScProgress(JSON.parse(local));
      } catch {}
      setScLoading(false);
    }
  }, [state.authMode]);

  const scUnlocked = new Set<string>(scProgress?.unlockedCosmetics || []);
  const scEquippedTitle = scProgress?.equippedTitle || null;
  const scEquippedBorder = scProgress?.equippedBorder || null;
  const scEquippedBadges: string[] = scProgress?.equippedBadges || [];

  const hasStoreItems = ownedItems.length > 0 || ownedSkins.length > 1;
  const hasSCItems = scUnlocked.size > 0;
  const hasAnything = hasStoreItems || hasSCItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30">
          <Star className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('inventory.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('inventory.desc')}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setInvTab('store')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${invTab === 'store' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
        >{t('inventory.tab.store')}</button>
        <button onClick={() => setInvTab('sigma')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${invTab === 'sigma' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
        >{t('inventory.tab.sigma')}</button>
      </div>

      {invTab === 'store' && (
        <>
          {!hasStoreItems ? (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">🎒</div>
              <h3 className="text-xl font-bold text-white mb-2">{t('inventory.empty')}</h3>
              <p className="text-gray-400">{t('inventory.empty.desc')}</p>
            </div>
          ) : (
            <>
              {ownedItems.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    {t('inventory.items')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownedItems.map(item => {
                      const Icon = item.icon;
                      const isBorder = ['border-flame', 'border-frost', 'border-toxic', 'border-galaxy', 'border-rainbow', 'border-legendary'].includes(item.id);
                      const isEquipped = isBorder && state.activeBorder === item.id;
                      return (
                        <div key={item.id} className={`relative rounded-2xl bg-[#1a1a1a] border ${isEquipped ? 'border-white/30' : item.border} p-5 flex items-start gap-4`}>
                          {isEquipped && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold text-white uppercase">{t('store.active')}</div>}
                          <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold truncate">{t(`store.item.${item.id}.name`)}</h3>
                            <p className="text-gray-500 text-xs mt-0.5">{t(`store.item.${item.id}.desc`)}</p>
                            {isBorder && (
                              <button
                                onClick={() => setActiveBorder(isEquipped ? 'default' : item.id)}
                                className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${isEquipped ? 'bg-white/10 text-white' : 'bg-white text-black hover:scale-105'}`}
                              >
                                {isEquipped ? t('store.unequip') : t('store.equip')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {ownedSkins.length > 1 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-fuchsia-400" />
                    {t('inventory.skins')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ownedSkins.map(skin => {
                      const isActive = state.activeSkins?.snake === skin;
                      return (
                        <button key={skin} onClick={() => equipSkin('snake', skin)}
                          className={`rounded-xl p-4 text-center border transition-all ${isActive ? 'bg-fuchsia-500/15 border-fuchsia-400/50' : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'}`}
                        >
                          <div className="text-2xl mb-2">{skin === 'default' ? '🐍' : skin === 'neon' ? '💜' : skin === 'gold' ? '👑' : skin === 'glitch' ? '⚡' : skin === 'ghost' ? '👻' : skin === 'rainbow' ? '🌈' : skin === 'zebra' ? '🦓' : skin === 'robo' ? '🤖' : '🐉'}</div>
                          <p className="text-xs font-bold text-white capitalize">{skin}</p>
                          {isActive && <p className="text-[10px] text-fuchsia-400 mt-1">{t('store.active')}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {invTab === 'store' && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Profile Badges
          </h2>
          <p className="text-gray-500 text-sm mb-4">Earn badges by completing achievements. Earned badges can be displayed on your profile.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACHIEVEMENTS_DATA.filter(a => a.badge).map(ach => {
              const badgeInfo = SIGMA_BADGE_INFO[ach.badge!];
              const isEarned = state.unlockedAchievements.includes(ach.id);
              const isDisplayed = isEarned && (state.displayedBadges || []).includes(ach.badge!);
              return (
                <div key={ach.id}
                  className={`relative rounded-2xl p-4 border transition-all ${
                    !isEarned ? 'bg-white/[0.02] border-white/5 opacity-40 grayscale'
                    : isDisplayed ? 'bg-amber-500/10 border-amber-400/40'
                    : 'bg-[#1a1a1a] border-white/10'
                  }`}
                >
                  {isDisplayed && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase">Displayed</div>}
                  {!isEarned && <div className="absolute top-2 right-2 text-gray-600">🔒</div>}
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{ach.icon ? '🏅' : '📛'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm ${isEarned && badgeInfo ? badgeInfo.color : 'text-white'}`}>{badgeInfo?.name || ach.title}</h3>
                      <p className="text-gray-400 text-xs mt-1">{ach.description}</p>
                      {!isEarned && (
                        <p className="text-gray-500 text-[10px] mt-1 italic">Complete "{ach.title}" to unlock</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invTab === 'sigma' && (
        <>
          {scLoading ? (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-gray-400 animate-pulse">Loading Sigma Clicker data...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🗿</span>
                  <h3 className="text-white font-bold">Sigma Clicker Cosmetics</h3>
                </div>
                <p className="text-gray-400 text-sm">{scUnlocked.size}/{SC_ALL_COSMETICS.length} {t('inventory.sc.unlocked')}</p>
                {!hasSCItems && <p className="text-gray-500 text-xs mt-1">Play Sigma Clicker to unlock cosmetics!</p>}
              </div>

              {(['badge', 'title', 'border'] as const).map(category => {
                const categoryItems = SC_ALL_COSMETICS.filter(c => c.category === category);
                const catLabel = category === 'badge' ? t('inventory.sc.badges') : category === 'title' ? t('inventory.sc.titles') : t('inventory.sc.borders');
                const catIcon = category === 'badge' ? '📛' : category === 'title' ? '📜' : '🖼️';
                return (
                  <div key={category} className="mb-8">
                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span>{catIcon}</span> {catLabel}
                      <span className="text-xs text-gray-500 font-normal">({categoryItems.filter(c => scUnlocked.has(c.id)).length}/{categoryItems.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryItems.map(item => {
                        const isUnlocked = scUnlocked.has(item.id);
                        const isEquipped = category === 'title' ? scEquippedTitle === item.id
                          : category === 'border' ? scEquippedBorder === item.id
                          : scEquippedBadges.includes(item.id);
                        return (
                          <div key={item.id}
                            className={`relative rounded-2xl p-4 border transition-all ${
                              !isUnlocked ? 'bg-white/[0.02] border-white/5 opacity-40 grayscale'
                              : isEquipped ? 'bg-amber-500/10 border-amber-400/40'
                              : 'bg-[#1a1a1a] border-white/10'
                            }`}
                          >
                            {isEquipped && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase">{t('store.active')}</div>}
                            {!isUnlocked && <div className="absolute top-2 right-2 text-gray-600">🔒</div>}
                            <div className="flex items-start gap-3">
                              {typeof item.icon === 'string' && item.icon.startsWith('/')
                                ? <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
                                : <span className="text-2xl">{item.icon}</span>
                              }
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm">{item.name}</h3>
                                <p className="text-[11px] font-bold mt-0.5" style={{ color: RARITY_COLORS[item.rarity] }}>
                                  {item.rarity.toUpperCase()}
                                </p>
                                {item.description && (
                                  <p className="text-gray-400 text-xs mt-1">{item.description}</p>
                                )}
                                {!isUnlocked && (
                                  <p className="text-gray-500 text-[10px] mt-1 italic">{item.howToUnlock}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [privacySettings, setPrivacySettings] = useState({ hideInventory: false, hideStats: false, hideActivity: false });
  const [privacyLoaded, setPrivacyLoaded] = useState(false);

  useEffect(() => {
    profileApi.getPrivacy().then(data => {
      setPrivacySettings({
        hideInventory: data.privacy_hide_inventory || false,
        hideStats: data.privacy_hide_stats || false,
        hideActivity: data.privacy_hide_activity || false,
      });
      setPrivacyLoaded(true);
    }).catch(() => setPrivacyLoaded(true));
  }, []);

  const togglePrivacy = async (key: 'hideInventory' | 'hideStats' | 'hideActivity') => {
    const newVal = !privacySettings[key];
    setPrivacySettings(prev => ({ ...prev, [key]: newVal }));
    try {
      await profileApi.updatePrivacy({ [key]: newVal });
    } catch {
      setPrivacySettings(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-20"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gray-500/20 rounded-2xl border border-gray-500/30">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('nav.settings')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" />
          {t('settings.language')}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              language === 'en' 
                ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              language === 'en' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              EN
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">{t('lang.english')}</div>
              <div className="text-sm opacity-70">English</div>
            </div>
          </button>

          <button
            onClick={() => setLanguage('es-mx')}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              language === 'es-mx' 
                ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              language === 'es-mx' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              MX
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">{t('lang.spanish')}</div>
              <div className="text-sm opacity-70">Español (México)</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-400" />
          {t('settings.privacy')}
        </h2>
        <p className="text-gray-500 text-sm mb-6">{t('settings.privacy.subtitle')}</p>
        
        {privacyLoaded ? (
          <div className="space-y-4">
            {[
              { key: 'hideInventory' as const, labelKey: 'settings.privacy.hide-inventory', descKey: 'settings.privacy.hide-inventory.desc' },
              { key: 'hideStats' as const, labelKey: 'settings.privacy.hide-stats', descKey: 'settings.privacy.hide-stats.desc' },
              { key: 'hideActivity' as const, labelKey: 'settings.privacy.hide-activity', descKey: 'settings.privacy.hide-activity.desc' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => togglePrivacy(item.key)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  privacySettings[item.key]
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="text-left">
                  <div className="text-white font-semibold">{t(item.labelKey)}</div>
                  <div className="text-gray-500 text-sm">{t(item.descKey)}</div>
                </div>
                <div className={`w-12 h-7 rounded-full relative transition-colors ${
                  privacySettings[item.key] ? 'bg-violet-500' : 'bg-white/20'
                }`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    privacySettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-4">{t('settings.privacy.loading')}</div>
        )}
      </div>
    </motion.div>
  );
}

export function ProfilePage({ onOpenAdminPanel }: { onOpenAdminPanel?: () => void }) {
  const { state, equipSkin, getMultiplier, updateProfile, claimDailyReward, enterSecretCode, setAuthMode, logout, setActiveBorder, toggleDisplayedBadge, toggleDisplayedItem, refreshUser, importState } = useGameContext();
  const { t } = useLanguage();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(state.username);
  const [editPic, setEditPic] = useState(state.profilePic);
  const [editBanner, setEditBanner] = useState(state.profileBanner);
  const [editNameColor, setEditNameColor] = useState(state.nameColor || '#ffffff');
  const [secretCode, setSecretCode] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    if (state.authMode === 'logged_in') {
      import('../api/client').then(({ socialApi }) => {
        socialApi.getFriends().then(({ friendships }: any) => {
          setFriendCount(friendships.filter((f: any) => f.status === 'accepted').length);
        }).catch(() => {});
      });
    }
  }, [state.authMode]);

  const handleSaveProfile = () => {
    updateProfile(editUsername, editPic, editBanner, editNameColor);
    setIsEditingProfile(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (state.authMode === 'logged_in') {
      try {
        const { profileApi } = await import('../api/client');
        const { profilePicUrl } = await profileApi.uploadPicture(file);
        setEditPic(profilePicUrl);
        updateProfile(editUsername, profilePicUrl, editBanner, editNameColor);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setEditPic(reader.result as string);
        reader.readAsDataURL(file);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setEditPic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClaimDaily = () => {
    const success = claimDailyReward();
    if (success) {
      alert('Daily reward claimed!');
    } else {
      alert('You already claimed your daily reward today.');
    }
  };

  const handleSecretCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim() || redeemLoading) return;
    setRedeemLoading(true);
    setRedeemStatus(null);
    try {
      if (state.authMode === 'logged_in') {
        const { profileApi } = await import('../api/client');
        const result = await profileApi.claimCode(secretCode.trim());
        let msg = 'Code redeemed!';
        const parts: string[] = [];
        if ((result as any).reward?.coins) parts.push(`+${(result as any).reward.coins} coins`);
        if ((result as any).reward?.xp) parts.push(`+${(result as any).reward.xp} XP`);
        if ((result as any).reward?.item) parts.push(`Item: ${(result as any).reward.item}`);
        if ((result as any).reward?.isOwner) parts.push('Role: Owner');
        else if ((result as any).reward?.isAdmin) parts.push('Role: Admin');
        if (parts.length) msg = `Code redeemed! ${parts.join(', ')}`;
        setRedeemStatus({ type: 'success', msg });
        setShowSecretInput(false);
        setSecretCode('');
        await refreshUser();
      } else {
        const success = enterSecretCode(secretCode.trim());
        if (success) {
          setRedeemStatus({ type: 'success', msg: 'Code accepted!' });
          setShowSecretInput(false);
        } else {
          setRedeemStatus({ type: 'error', msg: 'Invalid code or already claimed.' });
        }
        setSecretCode('');
      }
    } catch (err: any) {
      setRedeemStatus({ type: 'error', msg: err.message || 'Invalid or expired code.' });
      setSecretCode('');
    } finally {
      setRedeemLoading(false);
      setTimeout(() => setRedeemStatus(null), 5000);
    }
  };

  const earnedBadges = ACHIEVEMENTS_DATA.filter(ach => state.unlockedAchievements.includes(ach.id));
  const xpNeeded = state.level * 1000;
  const xpProgress = (state.xp / xpNeeded) * 100;
  const multiplier = getMultiplier();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-20"
    >
      <div 
        className={`relative w-full h-48 sm:h-64 rounded-t-3xl mb-16 overflow-visible ${!(isEditingProfile ? editBanner : state.profileBanner).startsWith('#') ? (isEditingProfile ? editBanner : state.profileBanner) : ''}`}
        style={(isEditingProfile ? editBanner : state.profileBanner).startsWith('#') ? { backgroundColor: (isEditingProfile ? editBanner : state.profileBanner) } : {}}
      >
        {isEditingProfile && (
          <div className="absolute top-2 right-2 left-2 sm:left-auto sm:right-4 sm:top-4 bg-black/70 p-3 rounded-xl backdrop-blur-md border border-white/10 max-w-sm">
            <label className="text-xs text-white/70 block mb-2 font-semibold">Choose Banner</label>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {BANNER_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setEditBanner(preset.id)}
                  title={preset.name}
                  className={`h-6 rounded-md border-2 transition-all ${
                    editBanner === preset.id ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white/40'
                  }`}
                  style={{ background: `linear-gradient(to right, ${preset.colors[0]}, ${preset.colors[1]})` }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="color"
                value={editBanner.startsWith('#') ? editBanner : '#3b82f6'}
                onChange={(e) => setEditBanner(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-white/20 p-0.5 bg-black/50 shrink-0"
                title="Custom color"
              />
              <span className="text-[10px] text-gray-400">Custom color</span>
            </div>
          </div>
        )}
        
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <img 
              src={isEditingProfile ? editPic : state.profilePic} 
              alt="Profile" 
              className={`w-32 h-32 rounded-2xl border-4 bg-[#1a1a1a] object-cover shadow-2xl ${PROFILE_BORDERS[state.activeBorder]?.style || 'border-[#0a0a0a]'} ${PROFILE_BORDERS[state.activeBorder]?.shadow || ''}`}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(state.username)}`; }}
            />
            {isEditingProfile && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <input 
                  type="text" 
                  value={editPic}
                  onChange={(e) => setEditPic(e.target.value)}
                  className="bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/20 w-28 text-center"
                  placeholder="Image URL"
                />
                <label className="text-xs text-blue-400 cursor-pointer hover:underline">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            )}
          </div>
          
          <div className="mb-2">
            {isEditingProfile ? (
              <div className="flex flex-col gap-2 mb-2">
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-black/50 text-3xl font-bold text-white px-3 py-1 rounded border border-white/20 w-48"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Name Color:</label>
                  <input 
                    type="color" 
                    value={editNameColor}
                    onChange={(e) => setEditNameColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-white/20 p-0.5 bg-black/50"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {state.prestige > 0 && (
                  <span className="text-sm font-bold text-fuchsia-400 mb-1">{t('profile.prestige')} {state.prestige}</span>
                )}
                <h1 
                  className="text-4xl font-bold tracking-tight flex items-center gap-3" 
                  style={{ 
                    color: state.nameColor || '#ffffff',
                    textShadow: `0 0 10px ${state.nameColor || '#ffffff'}80`
                  }}
                >
                  {state.username}
                  {state.isOwner && <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" title={t('profile.owner')} />}
                  {state.isAdmin && !state.isOwner && <Shield className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" title={t('profile.admin')} />}
                </h1>
                {(() => {
                  const activeItems = DISPLAYABLE_ITEMS.filter(item =>
                    state.inventory.includes(item.id) && (state.displayedItems || []).includes(item.id)
                  );
                  return activeItems.length > 0 ? (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {activeItems.map(item => {
                        const Icon = item.icon;
                        return (
                          <span key={item.id} className={`flex items-center gap-1 px-2 py-1 rounded-full ${item.bg} border border-white/10 text-[11px] font-bold ${item.color}`}>
                            <Icon className="w-3.5 h-3.5" /> {item.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const shownBadges = earnedBadges.filter(b => (state.displayedBadges || []).includes(b.id));
                  return shownBadges.length > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {shownBadges.map(badge => {
                        const Icon = badge.icon;
                        return (
                          <span key={badge.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-400" title={badge.title}>
                            <Icon className="w-3 h-3" /> {badge.title}
                          </span>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-bold text-white border border-white/10">
                {t('profile.lvl')} {state.level}
              </span>
              <span className="text-gray-400 text-sm">
                {state.xp} / {xpNeeded} {t('profile.xp')}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-12 right-8 flex gap-3">
          {isEditingProfile ? (
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-yellow-400 font-medium bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                This is a preview, remember to save
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditUsername(state.username);
                    setEditPic(state.profilePic);
                    setEditBanner(state.profileBanner);
                    setEditNameColor(state.nameColor || '#ffffff');
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition-colors border border-red-500/30"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {t('profile.save')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => logout()}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20 flex items-center gap-2"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Log Out</span>
              </button>
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/10"
                title={t('profile.edit')}
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden mb-12">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
          style={{ width: `${xpProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Flame className="w-8 h-8 text-orange-400 mb-2" />
          <p className="text-gray-400 text-sm font-medium">{t('profile.streak')}</p>
          <p className="text-3xl font-bold text-white">{state.streak} {t('profile.days')}</p>
          <div className="mt-2 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">
            {multiplier.toFixed(1)}x {t('profile.multiplier')}
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Coins className="w-8 h-8 text-yellow-400 mb-2" />
          <p className="text-gray-400 text-sm font-medium">{t('profile.coins')}</p>
          <p className="text-3xl font-bold text-white">{state.coins}</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Target className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-gray-400 text-sm font-medium">{t('profile.played')}</p>
          <p className="text-3xl font-bold text-white">{state.totalGamesPlayed}</p>
        </div>

        {state.authMode === 'logged_in' && (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Users className="w-8 h-8 text-violet-400 mb-2" />
            <p className="text-gray-400 text-sm font-medium">Friends</p>
            <p className="text-3xl font-bold text-white">{friendCount}</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden">
          <Gift className="w-8 h-8 text-purple-400" />
          <p className="text-purple-200 text-sm font-medium">{t('profile.daily')}</p>
          <button 
            onClick={handleClaimDaily}
            disabled={state.lastDailyReward === new Date().toDateString()}
            className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
              state.lastDailyReward === new Date().toDateString()
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-400 shadow-lg shadow-purple-500/20'
            }`}
          >
            {state.lastDailyReward === new Date().toDateString() ? t('profile.claimed') : t('profile.claim')}
          </button>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Palette className="w-6 h-6 text-fuchsia-400" />
          {t('profile.skins')}
        </h2>
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{t('profile.snake')}</h3>
              <p className="text-gray-400 text-sm">{t('profile.snake.desc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.skins.snake?.map(skin => (
                <button
                  key={skin}
                  onClick={() => equipSkin('snake', skin)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                    state.activeSkins.snake === skin
                      ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {skin}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Hexagon className="w-6 h-6 text-purple-400" />
          Profile Borders
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Object.entries(PROFILE_BORDERS).map(([id, border]) => {
            const owned = id === 'default' || state.inventory.includes(id);
            const isActive = state.activeBorder === id;
            return (
              <motion.button
                key={id}
                whileHover={{ scale: owned ? 1.05 : 1 }}
                whileTap={{ scale: owned ? 0.95 : 1 }}
                onClick={() => owned && setActiveBorder(id)}
                className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : owned
                      ? 'bg-[#1a1a1a] border-white/10 hover:border-white/20 cursor-pointer'
                      : 'bg-[#111] border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div
                  className={`w-16 h-16 rounded-xl border-[3px] ${border.style} ${border.shadow} bg-[#222] flex items-center justify-center`}
                >
                  <Hexagon className="w-8 h-8" style={{ color: border.color }} />
                </div>
                <span className={`text-sm font-semibold ${owned ? 'text-white' : 'text-gray-600'}`}>
                  {border.name}
                </span>
                {!owned && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          {t('profile.badges')}
        </h2>
        <p className="text-gray-500 text-sm mb-4">Toggle badges on/off to control which ones appear on your profile.</p>
        
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {earnedBadges.map((badge) => {
              const Icon = badge.icon;
              const isDisplayed = (state.displayedBadges || []).includes(badge.id);
              return (
                <motion.button
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleDisplayedBadge(badge.id)}
                  className={`relative rounded-2xl p-4 flex flex-col items-center text-center gap-3 border transition-all ${
                    isDisplayed
                      ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                      : 'bg-[#1a1a1a] border-white/5 opacity-60'
                  }`}
                >
                  {isDisplayed && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] ${
                    isDisplayed
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-gray-500'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{badge.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${isDisplayed ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {isDisplayed ? 'Shown' : 'Hidden'}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t('profile.badges.none')}</h3>
            <p className="text-gray-400">{t('profile.badges.none.desc')}</p>
          </div>
        )}
      </div>

      {DISPLAYABLE_ITEMS.filter(item => state.inventory.includes(item.id)).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            Cosmetic Items
          </h2>
          <p className="text-gray-500 text-sm mb-4">Choose which owned items to display on your profile.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {DISPLAYABLE_ITEMS.filter(item => state.inventory.includes(item.id)).map(item => {
              const Icon = item.icon;
              const isDisplayed = (state.displayedItems || []).includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleDisplayedItem(item.id)}
                  className={`relative rounded-2xl p-4 flex flex-col items-center text-center gap-3 border transition-all ${
                    isDisplayed
                      ? `${item.bg} border-white/20`
                      : 'bg-[#1a1a1a] border-white/5 opacity-60'
                  }`}
                >
                  {isDisplayed && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className={`w-4 h-4 ${item.color}`} />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-white font-bold text-sm">{item.name}</h3>
                  <span className={`text-[10px] font-bold uppercase ${isDisplayed ? item.color : 'text-gray-600'}`}>
                    {isDisplayed ? 'Shown' : 'Hidden'}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {state.isOwner && (
        <div className="mb-12">
          <button
            onClick={onOpenAdminPanel}
            className="w-full flex items-center gap-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-2xl p-5 transition-all group"
          >
            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 group-hover:bg-red-500/30 transition-colors">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-red-400 font-bold text-lg">Open Admin Panel</p>
              <p className="text-red-400/60 text-sm">Owner · Manage users, messages, bans, and more</p>
            </div>
            <div className="ml-auto text-red-500/40 group-hover:text-red-400 transition-colors">→</div>
          </button>
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center">
        <button 
          onClick={() => { setShowSecretInput(!showSecretInput); setRedeemStatus(null); }}
          className="text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-2 text-sm"
        >
          <Key className="w-4 h-4" />
          {t('profile.redeem')}
        </button>

        <AnimatePresence>
          {redeemStatus && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${redeemStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
            >
              {redeemStatus.msg}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showSecretInput && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSecretCode}
              className="mt-4 flex gap-2 overflow-hidden"
            >
              <input 
                type="text" 
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="Enter code..."
                disabled={redeemLoading}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={redeemLoading}
                className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                {redeemLoading ? '...' : 'Redeem'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
        <h3 className="text-gray-400 text-sm mb-4">{t('profile.data')}</h3>
        <div className="flex gap-4">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vault_save_${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 500);
            }}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('profile.export')}
          </button>
          <label className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10 flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {t('profile.import')}
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const json = JSON.parse(ev.target?.result as string);
                    if (json.coins === undefined || json.level === undefined || json.totalGamesPlayed === undefined) {
                      alert('Invalid save file: missing required game data.');
                      return;
                    }
                    importState(json);
                    alert('Save imported successfully!');
                  } catch (err) {
                    alert('Failed to import save. Make sure you selected a valid Vault save file.');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-4 max-w-md text-center">
          {t('profile.export.desc')}
        </p>
      </div>
    </motion.div>
  );
}

export function RoadmapPage() {
  const { state, claimLevelReward, doPrestige } = useGameContext();
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
          <Target className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('roadmap.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('roadmap.desc')}</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 mb-12 relative overflow-hidden">
        {state.prestige > 0 && (
          <div className="absolute top-0 right-0 bg-fuchsia-500/20 text-fuchsia-400 px-4 py-2 rounded-bl-2xl font-bold border-b border-l border-fuchsia-500/30">
            {t('profile.prestige')} {state.prestige}
          </div>
        )}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('roadmap.current')}: {state.level}</h2>
            <p className="text-gray-400">{t('profile.xp')}: {state.xp} / {state.level * 1000}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">{t('roadmap.next')}</p>
            <p className="text-xl font-bold text-blue-400">{state.level + 1}</p>
          </div>
        </div>
        <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-6">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(state.xp / (state.level * 1000)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        {state.level >= 100 && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> {t('roadmap.prestige.avail')}
              </h3>
              <p className="text-sm text-gray-400">{t('roadmap.prestige.desc')}</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm(t('roadmap.prestige.confirm'))) {
                  doPrestige();
                }
              }}
              className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-fuchsia-500/20 whitespace-nowrap"
            >
              {t('roadmap.prestige.now')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-transparent">
        {LEVEL_REWARDS.filter(m => {
          const tierMin = state.prestige * 100;
          const tierMax = (state.prestige + 1) * 100;
          return m.level > tierMin && m.level <= tierMax;
        }).map((milestone, index) => {
          const isUnlocked = state.level >= milestone.level;
          const isClaimed = state.claimedLevelRewards.includes(milestone.level);
          const Icon = milestone.icon;

          return (
            <div key={milestone.level} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-[#111] bg-[#1a1a1a] shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 shrink-0 md:mx-auto group-hover:scale-110 transition-transform">
                <Icon className={`w-6 h-6 ${isUnlocked ? 'text-blue-400' : 'text-gray-600'}`} />
              </div>

              <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-xl relative">
                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1a] border-white/5 transform rotate-45 
                  ${index % 2 === 0 ? 'md:-right-2 md:border-t md:border-r border-l border-b -left-2' : 'md:-left-2 md:border-b md:border-l border-l border-b -left-2'}`} 
                />
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {t('roadmap.level')} {milestone.level}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded-lg">
                      <Coins className="w-4 h-4" />
                      {milestone.reward.toLocaleString()}
                    </div>
                    {(milestone as any).borderReward && (
                      <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: PROFILE_BORDERS[(milestone as any).borderReward]?.color || '#fff', backgroundColor: `${PROFILE_BORDERS[(milestone as any).borderReward]?.color || '#fff'}20` }}>
                        <Hexagon className="w-3 h-3" />
                        {PROFILE_BORDERS[(milestone as any).borderReward]?.name} Border
                      </div>
                    )}
                  </div>
                </div>
                
                <p className={`text-sm mb-4 ${isUnlocked ? 'text-blue-300' : 'text-gray-600'}`}>
                  {t(`level.${milestone.level}.title`)}
                </p>

                <button
                  onClick={() => claimLevelReward(milestone.level, milestone.reward, (milestone as any).borderReward)}
                  disabled={!isUnlocked || isClaimed}
                  className={`w-full py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isClaimed 
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : isUnlocked
                        ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isClaimed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t('roadmap.claimed')}
                    </>
                  ) : isUnlocked ? (
                    t('roadmap.claim')
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t('roadmap.locked')}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function DailyRewardsPage() {
  const { state, claimDailyReward, getMultiplier } = useGameContext();
  const { t } = useLanguage();
  const multiplier = getMultiplier();
  const today = new Date().toDateString();
  const canClaim = state.lastDailyReward !== today;

  const timelineDays = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = state.streak + (canClaim ? i : i + 1);
    const dayMultiplier = Math.min(2.5, 1 + (dayNumber - 1) * 0.1);
    const reward = Math.floor(100 * dayMultiplier);
    return { day: dayNumber, reward, multiplier: dayMultiplier };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
          <Flame className="w-8 h-8 text-orange-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('daily.title')}</h1>
          <p className="text-gray-400 mt-1 text-lg">{t('daily.desc')}</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 mb-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{t('daily.streak')}: {state.streak} {t('profile.days')}</h2>
        <p className="text-orange-400 font-bold mb-6">{t('daily.multiplier')}: {multiplier.toFixed(1)}x</p>
        
        <button
          onClick={() => {
            if (claimDailyReward()) {
              alert(t('daily.claimed.msg'));
            }
          }}
          disabled={!canClaim}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
            canClaim 
              ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20' 
              : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {canClaim ? `${t('daily.claim')} (${Math.floor(100 * multiplier)} ${t('header.coins')})` : t('daily.tomorrow')}
        </button>
      </div>

      <h3 className="text-2xl font-bold text-white mb-6">{t('daily.upcoming')}</h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-yellow-500 before:to-transparent">
        {timelineDays.map((dayData, index) => {
          const isToday = index === 0 && canClaim;
          
          return (
            <div key={dayData.day} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 border-[#111] ${isToday ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : 'bg-[#1a1a1a] shadow-[0_0_15px_rgba(0,0,0,0.5)]'} z-10 shrink-0 md:mx-auto group-hover:scale-110 transition-transform`}>
                <Flame className={`w-6 h-6 ${isToday ? 'text-white' : 'text-orange-400'}`} />
              </div>

              <div className={`w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] bg-[#1a1a1a] border ${isToday ? 'border-orange-500/50' : 'border-white/5'} rounded-2xl p-6 shadow-xl relative`}>
                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1a1a1a] transform rotate-45 
                  ${index % 2 === 0 ? 'md:-right-2 md:border-t md:border-r border-l border-b -left-2' : 'md:-left-2 md:border-b md:border-l border-l border-b -left-2'}
                  ${isToday ? 'border-orange-500/50' : 'border-white/5'}`} 
                />
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>
                    {t('daily.day')} {dayData.day}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded-lg">
                    <Coins className="w-4 h-4" />
                    {dayData.reward.toLocaleString()}
                  </div>
                </div>
                
                <p className="text-sm text-gray-400">
                  {t('profile.multiplier')}: <span className="text-orange-400 font-bold">{dayData.multiplier.toFixed(1)}x</span>
                </p>
                {isToday && (
                  <p className="text-xs text-emerald-400 font-bold mt-2">{t('daily.available')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
