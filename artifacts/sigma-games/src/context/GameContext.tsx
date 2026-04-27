import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi, profileApi, progressApi, getToken, setToken, removeToken, UserProfile } from '../api/client';
import { ACHIEVEMENTS_DATA } from '../data/achievements';

export interface GameState {
  coins: number;
  xp: number;
  level: number;
  streak: number;
  lastLogin: string;
  gamesPlayedToday: number;
  totalGamesPlayed: number;
  sportsGamesPlayed: number;
  actionGamesPlayed: number;
  puzzleGamesPlayed: number;
  clickerGamesPlayed: number;
  ioGamesPlayed: number;
  classicsGamesPlayed: number;
  papasGamesPlayed: number;
  racingGamesPlayed: number;
  sandboxGamesPlayed: number;
  asmrGamesPlayed: number;
  weeklyGamesPlayed: number;
  lastWeekReset: string;
  dailyActionGamesPlayed: number;
  dailyPuzzleGamesPlayed: number;
  dailySportsGamesPlayed: number;
  dailyClickerGamesPlayed: number;
  dailyIoGamesPlayed: number;
  dailyPapasGamesPlayed: number;
  inventory: string[];
  skins: Record<string, string[]>;
  activeSkins: Record<string, string>;
  claimedQuests: string[];
  claimedWeeklyQuests: string[];
  unlockedAchievements: string[];
  claimedAchievements: string[];
  username: string;
  profilePic: string;
  profileBanner: string;
  isAdmin: boolean;
  isOwner: boolean;
  lastDailyReward: string;
  claimedLevelRewards: number[];
  prestige: number;
  nameColor: string;
  activeBorder: string;
  displayedBadges: string[];
  displayedItems: string[];
  pendingStreakLoss: { oldStreak: number; cost: number } | null;
  showStreakIncrease: boolean;
  authMode: 'none' | 'guest' | 'logged_in';
  currentGame: string | null;
  sigmaLifetimeSigmas: number;
  sigmaRebirths: number;
  sigmaRawClicks: number;
}

interface GameContextType {
  state: GameState;
  currentUser: UserProfile | null;
  buyItem: (id: string, cost: number, isConsumable?: boolean) => boolean;
  openMysteryBox: () => string | null;
  equipSkin: (game: string, skin: string) => void;
  setActiveBorder: (border: string) => void;
  toggleDisplayedBadge: (badgeId: string) => void;
  toggleDisplayedItem: (itemId: string) => void;
  playGame: (category: string) => void;
  claimQuest: (id: string, reward: number, isWeekly?: boolean) => void;
  claimAchievement: (id: string, reward: number) => void;
  checkAchievements: () => void;
  getMultiplier: () => number;
  updateProfile: (username: string, profilePic: string, profileBanner: string, nameColor: string) => void;
  claimDailyReward: () => boolean;
  enterSecretCode: (code: string) => boolean;
  claimLevelReward: (level: number, reward: number, borderReward?: string) => boolean;
  doPrestige: () => boolean;
  resolveStreakLoss: (restore: boolean) => void;
  clearStreakIncrease: () => void;
  setAuthMode: (mode: 'none' | 'guest' | 'logged_in') => void;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  adminAddCoins: (amount: number) => void;
  adminSetLevel: (level: number) => void;
  adminUnlockAll: () => void;
  setCurrentGame: (game: string | null) => void;
  updateSigmaStats: (lifetimeSigmas: number, rebirths: number, rawClicks: number) => void;
  refreshUser: () => Promise<void>;
  importState: (imported: Partial<GameState>) => void;
}

const defaultState: GameState = {
  coins: 200,
  xp: 0,
  level: 1,
  streak: 1,
  lastLogin: new Date().toDateString(),
  gamesPlayedToday: 0,
  totalGamesPlayed: 0,
  sportsGamesPlayed: 0,
  actionGamesPlayed: 0,
  puzzleGamesPlayed: 0,
  clickerGamesPlayed: 0,
  ioGamesPlayed: 0,
  classicsGamesPlayed: 0,
  papasGamesPlayed: 0,
  racingGamesPlayed: 0,
  sandboxGamesPlayed: 0,
  asmrGamesPlayed: 0,
  weeklyGamesPlayed: 0,
  lastWeekReset: new Date().toDateString(),
  dailyActionGamesPlayed: 0,
  dailyPuzzleGamesPlayed: 0,
  dailySportsGamesPlayed: 0,
  dailyClickerGamesPlayed: 0,
  dailyIoGamesPlayed: 0,
  dailyPapasGamesPlayed: 0,
  inventory: [],
  skins: { snake: ['default'] },
  activeSkins: { snake: 'default' },
  claimedQuests: [],
  claimedWeeklyQuests: [],
  unlockedAchievements: [],
  claimedAchievements: [],
  username: 'Player',
  profilePic: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Player',
  profileBanner: 'bg-gradient-to-r from-blue-500 to-purple-600',
  isAdmin: false,
  isOwner: false,
  lastDailyReward: '',
  claimedLevelRewards: [],
  prestige: 0,
  nameColor: '#ffffff',
  sigmaLifetimeSigmas: 0,
  sigmaRebirths: 0,
  sigmaRawClicks: 0,
  activeBorder: 'default',
  displayedBadges: [],
  displayedItems: [],
  pendingStreakLoss: null,
  showStreakIncrease: false,
  authMode: 'none',
  currentGame: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

function applyDailyLoginLogic(merged: GameState, _isLoggedIn = false): GameState {
  if (merged.streak < 1) merged.streak = 1;
  const today = new Date().toDateString();
  if (merged.lastLogin !== today) {
    const last = merged.lastLogin ? new Date(merged.lastLogin) : new Date();
    const now = new Date(today);
    const utcLast = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((utcNow - utcLast) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      merged.streak += 1;
      merged.showStreakIncrease = true;
    } else if (diffDays > 1) {
      if (merged.inventory && merged.inventory.includes('streak-freeze')) {
        const freezeIndex = merged.inventory.indexOf('streak-freeze');
        merged.inventory.splice(freezeIndex, 1);
      } else {
        if (merged.streak > 1) {
          const cost = Math.max(5000, merged.streak * 500);
          merged.pendingStreakLoss = { oldStreak: merged.streak, cost };
        }
        merged.streak = 1;
      }
    }
    merged.lastLogin = today;
    merged.gamesPlayedToday = 0;
    merged.claimedQuests = [];
    merged.dailyActionGamesPlayed = 0;
    merged.dailyPuzzleGamesPlayed = 0;
    merged.dailySportsGamesPlayed = 0;
    merged.dailyClickerGamesPlayed = 0;
    merged.dailyIoGamesPlayed = 0;
    merged.dailyPapasGamesPlayed = 0;
  }
  const lastWeek = new Date(merged.lastWeekReset);
  const nowForWeek = new Date(today);
  const diffTimeWeekly = Math.abs(nowForWeek.getTime() - lastWeek.getTime());
  const diffDaysWeekly = Math.ceil(diffTimeWeekly / (1000 * 60 * 60 * 24));
  if (diffDaysWeekly >= 7) {
    merged.weeklyGamesPlayed = 0;
    merged.claimedWeeklyQuests = [];
    merged.lastWeekReset = today;
  }
  return merged;
}

function fillDefaults(merged: GameState): GameState {
  merged.claimedWeeklyQuests = merged.claimedWeeklyQuests || [];
  merged.claimedAchievements = merged.claimedAchievements || [];
  merged.puzzleGamesPlayed = merged.puzzleGamesPlayed || 0;
  merged.clickerGamesPlayed = merged.clickerGamesPlayed || 0;
  merged.ioGamesPlayed = merged.ioGamesPlayed || 0;
  merged.classicsGamesPlayed = merged.classicsGamesPlayed || 0;
  merged.papasGamesPlayed = merged.papasGamesPlayed || 0;
  merged.racingGamesPlayed = merged.racingGamesPlayed || 0;
  merged.sandboxGamesPlayed = merged.sandboxGamesPlayed || 0;
  merged.asmrGamesPlayed = merged.asmrGamesPlayed || 0;
  merged.weeklyGamesPlayed = merged.weeklyGamesPlayed || 0;
  merged.xp = merged.xp || 0;
  merged.level = merged.level || 1;
  merged.skins = merged.skins || { snake: ['default'] };
  merged.activeSkins = merged.activeSkins || { snake: 'default' };
  merged.username = merged.username || 'Player';
  merged.profilePic = merged.profilePic || `https://api.dicebear.com/9.x/avataaars/svg?seed=${merged.username || 'Player'}`;
  merged.profileBanner = merged.profileBanner || 'bg-gradient-to-r from-blue-500 to-purple-600';
  merged.isAdmin = false;
  merged.isOwner = false;
  merged.lastDailyReward = merged.lastDailyReward || '';
  merged.claimedLevelRewards = merged.claimedLevelRewards || [];
  merged.prestige = merged.prestige || 0;
  merged.nameColor = merged.nameColor || '#ffffff';
  merged.activeBorder = merged.activeBorder || 'default';
  merged.displayedBadges = merged.displayedBadges || [];
  merged.displayedItems = merged.displayedItems || [];
  merged.currentGame = merged.currentGame || null;
  merged.dailyActionGamesPlayed = merged.dailyActionGamesPlayed || 0;
  merged.dailyPuzzleGamesPlayed = merged.dailyPuzzleGamesPlayed || 0;
  merged.dailySportsGamesPlayed = merged.dailySportsGamesPlayed || 0;
  merged.dailyClickerGamesPlayed = merged.dailyClickerGamesPlayed || 0;
  merged.dailyIoGamesPlayed = merged.dailyIoGamesPlayed || 0;
  merged.dailyPapasGamesPlayed = merged.dailyPapasGamesPlayed || 0;
  return merged;
}

function stateFromUser(user: UserProfile, existing: GameState): GameState {
  const filled = fillDefaults(applyDailyLoginLogic({
    ...existing,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    username: user.username,
    profilePic: user.profile_pic_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`,
    profileBanner: user.profile_banner || 'bg-gradient-to-r from-blue-500 to-purple-600',
    nameColor: user.name_color || '#ffffff',
    isAdmin: user.is_admin,
    isOwner: user.is_owner,
    authMode: 'logged_in',
    inventory: Array.isArray(user.inventory) ? user.inventory : existing.inventory,
    activeBorder: user.active_border || existing.activeBorder || 'default',
  }, true));
  filled.isAdmin = user.is_admin;
  filled.isOwner = user.is_owner;
  return filled;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('portalGameState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = fillDefaults(applyDailyLoginLogic({ ...defaultState, ...parsed }));
        return merged;
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverLoadedRef = useRef(false);

  useEffect(() => {
    const { isAdmin: _a, isOwner: _o, ...stateToSave } = state;
    localStorage.setItem('portalGameState', JSON.stringify(stateToSave));
    if (state.authMode === 'logged_in' && currentUser && serverLoadedRef.current) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      const snapshotUserId = currentUser.id;
      const snapshotToken = getToken();
      syncTimerRef.current = setTimeout(() => {
        if (getToken() !== snapshotToken || !currentUser || currentUser.id !== snapshotUserId) return;
        profileApi.syncGameState({
          coins: state.coins,
          xp: state.xp,
          level: state.level,
          inventory: state.inventory,
          activeBorder: state.activeBorder,
          displayedBadges: state.displayedBadges,
          displayedItems: state.displayedItems,
        }).catch(() => {});
        progressApi.save('__portal_state', stateToSave).catch(() => {});
        if (state.authMode !== 'logged_in') {
          progressApi.save('__guest_state', stateToSave).catch(() => {});
        }
      }, 3000);
    } else {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [state, currentUser]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi.me().then(async ({ user }) => {
        setCurrentUser(user);
        try {
          const saved = await progressApi.get('__portal_state');
          if (saved.progress) {
            const serverState = saved.progress as unknown as GameState;
            const merged = fillDefaults(applyDailyLoginLogic({ ...defaultState, ...serverState }, true));
            merged.isAdmin = user.is_admin;
            merged.isOwner = user.is_owner;
            merged.coins = user.coins;
            merged.xp = user.xp;
            merged.level = user.level;
            merged.streak = user.streak;
            merged.username = user.username;
            merged.profilePic = user.profile_pic_url || merged.profilePic;
            merged.profileBanner = user.profile_banner || merged.profileBanner;
            merged.nameColor = user.name_color || merged.nameColor;
            merged.inventory = Array.isArray(user.inventory) ? user.inventory : merged.inventory;
            merged.activeBorder = user.active_border || merged.activeBorder;
            merged.authMode = 'logged_in';
            serverLoadedRef.current = true;
            setState(merged);
          } else {
            serverLoadedRef.current = true;
            setState(prev => stateFromUser(user, prev));
          }
        } catch {
          serverLoadedRef.current = true;
          setState(prev => stateFromUser(user, prev));
        }
      }).catch(() => {
        removeToken();
        setCurrentUser(null);
        setState(prev => ({ ...prev, authMode: 'none', isAdmin: false, isOwner: false, currentGame: null }));
      });
    }

    const handleExpired = () => {
      setCurrentUser(null);
      setState(prev => ({ ...prev, authMode: 'none', isAdmin: false, isOwner: false, currentGame: null }));
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  useEffect(() => {
    if (state.authMode !== 'logged_in' || !currentUser) return;
    profileApi.heartbeat(state.currentGame).catch(() => {});
    const interval = setInterval(() => {
      profileApi.heartbeat(state.currentGame).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [state.authMode, state.currentGame, currentUser]);

  const login = async (emailOrUsername: string, password: string) => {
    if (currentUser) {
      try { await authApi.logout(); } catch {}
      removeToken();
    }
    const { token, user } = await authApi.login(emailOrUsername, password);
    setToken(token);
    setCurrentUser(user);
    try {
      const saved = await progressApi.get('__portal_state');
      if (saved.progress) {
        const serverState = saved.progress as unknown as GameState;
        const merged = fillDefaults(applyDailyLoginLogic({ ...defaultState, ...serverState }, true));
        merged.isAdmin = user.is_admin;
        merged.isOwner = user.is_owner;
        merged.coins = user.coins;
        merged.xp = user.xp;
        merged.level = user.level;
        merged.streak = user.streak;
        merged.username = user.username;
        merged.profilePic = user.profile_pic_url || merged.profilePic;
        merged.profileBanner = user.profile_banner || merged.profileBanner;
        merged.nameColor = user.name_color || merged.nameColor;
        merged.inventory = Array.isArray(user.inventory) ? user.inventory : merged.inventory;
        merged.activeBorder = user.active_border || merged.activeBorder;
        merged.authMode = 'logged_in';
        serverLoadedRef.current = true;
        setState(merged);
      } else {
        serverLoadedRef.current = true;
        setState(prev => stateFromUser(user, prev));
      }
    } catch {
      serverLoadedRef.current = true;
      setState(prev => stateFromUser(user, prev));
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const { token, user } = await authApi.register(username, email, password);
    setToken(token);
    setCurrentUser(user);
    serverLoadedRef.current = true;
    setState(prev => stateFromUser(user, prev));
  };

  const logout = async () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (state.authMode === 'logged_in') {
      const { isAdmin: _a, isOwner: _o, ...stateToSave } = state;
      try {
        await profileApi.syncGameState({
          coins: state.coins, xp: state.xp, level: state.level, streak: state.streak,
          inventory: state.inventory, activeBorder: state.activeBorder,
          displayedBadges: state.displayedBadges, displayedItems: state.displayedItems,
        });
        await progressApi.save('__portal_state', stateToSave);
        if (state.authMode !== 'logged_in') {
          await progressApi.save('__guest_state', stateToSave);
        }
      } catch {}
    }
    try { await authApi.logout(); } catch {}
    removeToken();
    setCurrentUser(null);
    serverLoadedRef.current = false;
    setState(prev => ({ ...prev, authMode: 'none', currentGame: null }));
  };

  const getMultiplier = () => Math.min(2.5, 1 + (state.streak - 1) * 0.1);

  const resolveStreakLoss = (restore: boolean) => {
    setState(prev => {
      if (!prev.pendingStreakLoss) return prev;
      if (restore) {
        if (prev.coins >= prev.pendingStreakLoss.cost) {
          return { ...prev, coins: prev.coins - prev.pendingStreakLoss.cost, streak: prev.pendingStreakLoss.oldStreak, pendingStreakLoss: null };
        }
        return prev;
      }
      return { ...prev, pendingStreakLoss: null };
    });
  };

  const clearStreakIncrease = () => setState(prev => ({ ...prev, showStreakIncrease: false }));

  const addXp = (amount: number, currentState: GameState) => {
    let newXp = currentState.xp + amount;
    let newLevel = currentState.level;
    let xpNeeded = newLevel * 1000;
    while (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel++;
      xpNeeded = newLevel * 1000;
    }
    return { xp: newXp, level: newLevel };
  };

  const checkAchievements = () => {
    setState(s => {
      const newState = { ...s };
      let changed = false;
      const unlock = (id: string) => {
        if (!newState.unlockedAchievements.includes(id)) {
          newState.unlockedAchievements = [...newState.unlockedAchievements, id];
          changed = true;
        }
      };
      if (newState.totalGamesPlayed >= 1) unlock('first-blood');
      if (newState.totalGamesPlayed >= 10) unlock('gamer');
      if (newState.totalGamesPlayed >= 50) unlock('addicted');
      if (newState.totalGamesPlayed >= 100) unlock('master');
      if (newState.totalGamesPlayed >= 500) unlock('grandmaster');
      if (newState.streak >= 3) unlock('dedicated');
      if (newState.streak >= 7) unlock('weekly-warrior');
      if (newState.streak >= 14) unlock('fortnight-fanatic');
      if (newState.streak >= 30) unlock('monthly-legend');
      if (newState.streak >= 90) unlock('quarterly-king');
      if (newState.sportsGamesPlayed >= 5) unlock('sports-fan');
      if (newState.sportsGamesPlayed >= 15) unlock('sports-pro');
      if (newState.actionGamesPlayed >= 5) unlock('action-novice');
      if (newState.actionGamesPlayed >= 25) unlock('action-expert');
      if (newState.puzzleGamesPlayed >= 5) unlock('puzzle-novice');
      if (newState.puzzleGamesPlayed >= 25) unlock('puzzle-expert');
      if (newState.clickerGamesPlayed >= 3) unlock('clicker-novice');
      if (newState.clickerGamesPlayed >= 10) unlock('clicker-addict');
      if (newState.ioGamesPlayed >= 5) unlock('io-novice');
      if (newState.ioGamesPlayed >= 20) unlock('io-pro');
      if (newState.papasGamesPlayed >= 2) unlock('chefs-apprentice');
      if (newState.papasGamesPlayed >= 6) unlock('head-chef');
      if (newState.classicsGamesPlayed >= 3) unlock('classics-fan');
      if (newState.sandboxGamesPlayed >= 1) unlock('sandbox-explorer');
      if (newState.asmrGamesPlayed >= 2) unlock('asmr-addict');
      if (newState.coins >= 1000) unlock('wealthy');
      if (newState.coins >= 5000) unlock('rich');
      if (newState.coins >= 10000) unlock('millionaire');
      if (newState.inventory.length >= 3) unlock('collector');
      if (newState.inventory.length >= 10) unlock('hoarder');
      if ((newState.sigmaLifetimeSigmas || 0) >= 1000) unlock('sigma-beginner');
      if ((newState.sigmaLifetimeSigmas || 0) >= 100000) unlock('sigma-grinder');
      if ((newState.sigmaLifetimeSigmas || 0) >= 10000000) unlock('sigma-lord');
      if ((newState.sigmaLifetimeSigmas || 0) >= 1000000000) unlock('sigma-god');
      if ((newState.sigmaRebirths || 0) >= 1) unlock('sigma-rebirth');
      if ((newState.sigmaRebirths || 0) >= 3) unlock('sigma-rebirths-3');
      if ((newState.sigmaRawClicks || 0) >= 1000) unlock('sigma-clicks-1k');
      if ((newState.sigmaRawClicks || 0) >= 10000) unlock('sigma-clicks-10k');
      return changed ? newState : s;
    });
  };

  useEffect(() => { checkAchievements(); }, [
    state.totalGamesPlayed, state.streak, state.coins, state.inventory.length,
    state.sportsGamesPlayed, state.actionGamesPlayed, state.puzzleGamesPlayed,
    state.clickerGamesPlayed, state.ioGamesPlayed, state.classicsGamesPlayed,
    state.papasGamesPlayed, state.sandboxGamesPlayed, state.asmrGamesPlayed,
    state.sigmaLifetimeSigmas, state.sigmaRebirths, state.sigmaRawClicks,
  ]);

  const buyItem = (id: string, cost: number, isConsumable = false) => {
    let success = false;
    setState(s => {
      if (s.coins >= cost && (isConsumable || !s.inventory.includes(id))) {
        success = true;
        return { ...s, coins: s.coins - cost, inventory: [...s.inventory, id] };
      }
      return s;
    });
    return success;
  };

  const openMysteryBox = () => {
    const cost = 500;
    const availableSkins = ['neon', 'gold', 'glitch', 'ghost', 'rainbow', 'zebra', 'robo', 'dragon'].filter(
      skin => !state.skins.snake?.includes(skin)
    );
    if (state.coins < cost || availableSkins.length === 0) return null;
    const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
    setState(s => ({ ...s, coins: s.coins - cost, skins: { ...s.skins, snake: [...(s.skins.snake || ['default']), randomSkin] } }));
    return randomSkin;
  };

  const equipSkin = (game: string, skin: string) => setState(s => ({ ...s, activeSkins: { ...s.activeSkins, [game]: skin } }));
  const setActiveBorder = (border: string) => setState(s => ({ ...s, activeBorder: border }));
  const toggleDisplayedBadge = (badgeId: string) => setState(s => {
    const current = s.displayedBadges || [];
    return { ...s, displayedBadges: current.includes(badgeId) ? current.filter(b => b !== badgeId) : [...current, badgeId] };
  });
  const toggleDisplayedItem = (itemId: string) => setState(s => {
    const current = s.displayedItems || [];
    return { ...s, displayedItems: current.includes(itemId) ? current.filter(i => i !== itemId) : [...current, itemId] };
  });

  const playGame = (category: string, gameId?: string) => {
    const isPapas = gameId?.startsWith('papas-') ?? false;
    setState(s => {
      const mult = Math.min(2.5, 1 + (s.streak - 1) * 0.1);
      const xpGained = Math.floor(100 * mult);
      const coinsGained = Math.floor(10 * mult);
      const { xp, level } = addXp(xpGained, s);
      return {
        ...s,
        coins: s.coins + coinsGained,
        xp,
        level,
        gamesPlayedToday: s.gamesPlayedToday + 1,
        totalGamesPlayed: s.totalGamesPlayed + 1,
        weeklyGamesPlayed: (s.weeklyGamesPlayed || 0) + 1,
        sportsGamesPlayed: category === 'Sports' ? s.sportsGamesPlayed + 1 : s.sportsGamesPlayed,
        actionGamesPlayed: category === 'Action' ? (s.actionGamesPlayed || 0) + 1 : (s.actionGamesPlayed || 0),
        puzzleGamesPlayed: category === 'Puzzle' ? (s.puzzleGamesPlayed || 0) + 1 : (s.puzzleGamesPlayed || 0),
        clickerGamesPlayed: category === 'Clicker' ? (s.clickerGamesPlayed || 0) + 1 : (s.clickerGamesPlayed || 0),
        ioGamesPlayed: category === 'IO Games' ? (s.ioGamesPlayed || 0) + 1 : (s.ioGamesPlayed || 0),
        classicsGamesPlayed: category === 'Classics' ? (s.classicsGamesPlayed || 0) + 1 : (s.classicsGamesPlayed || 0),
        papasGamesPlayed: isPapas ? (s.papasGamesPlayed || 0) + 1 : (s.papasGamesPlayed || 0),
        racingGamesPlayed: category === 'Racing' ? (s.racingGamesPlayed || 0) + 1 : (s.racingGamesPlayed || 0),
        sandboxGamesPlayed: category === 'Sandbox' ? (s.sandboxGamesPlayed || 0) + 1 : (s.sandboxGamesPlayed || 0),
        asmrGamesPlayed: category === 'ASMR' ? (s.asmrGamesPlayed || 0) + 1 : (s.asmrGamesPlayed || 0),
        dailyActionGamesPlayed: category === 'Action' ? (s.dailyActionGamesPlayed || 0) + 1 : (s.dailyActionGamesPlayed || 0),
        dailyPuzzleGamesPlayed: category === 'Puzzle' ? (s.dailyPuzzleGamesPlayed || 0) + 1 : (s.dailyPuzzleGamesPlayed || 0),
        dailySportsGamesPlayed: category === 'Sports' ? (s.dailySportsGamesPlayed || 0) + 1 : (s.dailySportsGamesPlayed || 0),
        dailyClickerGamesPlayed: category === 'Clicker' ? (s.dailyClickerGamesPlayed || 0) + 1 : (s.dailyClickerGamesPlayed || 0),
        dailyIoGamesPlayed: category === 'IO Games' ? (s.dailyIoGamesPlayed || 0) + 1 : (s.dailyIoGamesPlayed || 0),
        dailyPapasGamesPlayed: isPapas ? (s.dailyPapasGamesPlayed || 0) + 1 : (s.dailyPapasGamesPlayed || 0),
      };
    });
  };

  const claimQuest = (id: string, reward: number, isWeekly = false) => {
    setState(s => {
      const targetArray = isWeekly ? s.claimedWeeklyQuests : s.claimedQuests;
      if (!targetArray.includes(id)) {
        const { xp, level } = addXp(reward * 2, s);
        return {
          ...s,
          coins: s.coins + reward,
          xp,
          level,
          ...(isWeekly
            ? { claimedWeeklyQuests: [...s.claimedWeeklyQuests, id] }
            : { claimedQuests: [...s.claimedQuests, id] }),
        };
      }
      return s;
    });
  };

  const claimAchievement = (id: string, reward: number) => {
    setState(s => {
      if (s.unlockedAchievements.includes(id) && !s.claimedAchievements.includes(id)) {
        const { xp, level } = addXp(reward * 5, s);
        const ach = ACHIEVEMENTS_DATA.find(a => a.id === id);
        const badge = (ach as any)?.badge as string | undefined;
        const newInventory = badge && !s.inventory.includes(badge)
          ? [...s.inventory, badge]
          : s.inventory;
        return { ...s, coins: s.coins + reward, xp, level, claimedAchievements: [...s.claimedAchievements, id], inventory: newInventory };
      }
      return s;
    });
  };

  const updateProfile = (username: string, profilePic: string, profileBanner: string, nameColor: string) => {
    setState(s => ({ ...s, username, profilePic, profileBanner, nameColor }));
    if (state.authMode === 'logged_in') {
      profileApi.update({ username, nameColor, profileBanner }).catch(() => {});
    }
  };

  const claimDailyReward = () => {
    const today = new Date().toDateString();
    let success = false;
    setState(s => {
      if (s.lastDailyReward !== today) {
        success = true;
        const streak = Math.max(1, s.streak);
        const rewardAmount = 100 * Math.min(2.5, 1 + (streak - 1) * 0.1);
        return { ...s, coins: s.coins + Math.floor(rewardAmount), lastDailyReward: today, streak };
      }
      return s;
    });
    return success;
  };

  const enterSecretCode = (code: string) => {
    if (!currentUser) return false;
    let success = false;
    profileApi.claimCode(code).then((res: any) => {
      if (res && res.reward) {
        setState(s => {
          let newState = { ...s };
          if (res.reward.coins) newState.coins += res.reward.coins;
          if (res.reward.xp) {
            const result = addXp(res.reward.xp, newState);
            newState.xp = result.xp;
            newState.level = result.level;
          }
          if (res.reward.item && !newState.inventory.includes(res.reward.item)) {
            newState.inventory = [...newState.inventory, res.reward.item];
          }
          if (res.reward.isAdmin) newState.isAdmin = true;
          if (res.reward.isOwner) { newState.isOwner = true; newState.isAdmin = true; }
          return newState;
        });
        success = true;
      }
    }).catch(() => {});
    return success;
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      if (res.user) {
        setState(s => ({
          ...s,
          coins: res.user.coins ?? s.coins,
          xp: res.user.xp ?? s.xp,
          level: res.user.level ?? s.level,
          isAdmin: res.user.is_admin ?? false,
          isOwner: res.user.is_owner ?? false,
          inventory: Array.isArray(res.user.inventory) ? res.user.inventory : s.inventory,
        }));
      }
    } catch {}
  };

  const claimLevelReward = (level: number, reward: number, borderReward?: string) => {
    let success = false;
    setState(s => {
      if (s.level >= level && !s.claimedLevelRewards.includes(level)) {
        success = true;
        const newInventory = borderReward && !s.inventory.includes(borderReward)
          ? [...s.inventory, borderReward]
          : s.inventory;
        return { ...s, coins: s.coins + reward, claimedLevelRewards: [...s.claimedLevelRewards, level], inventory: newInventory };
      }
      return s;
    });
    return success;
  };

  const doPrestige = () => {
    let success = false;
    setState(s => {
      if (s.level >= 100) {
        success = true;
        return { ...s, prestige: s.prestige + 1, level: 1, xp: 0, claimedLevelRewards: [] };
      }
      return s;
    });
    return success;
  };

  const setAuthMode = (mode: 'none' | 'guest' | 'logged_in') => setState(s => ({ ...s, authMode: mode }));

  const adminAddCoins = (amount: number) => {
    setState(s => ({ ...s, coins: s.coins + amount }));
  };

  const adminSetLevel = (level: number) => {
    setState(s => ({ ...s, level: Math.max(1, level), xp: 0 }));
  };

  const adminUnlockAll = () => {
    setState(s => ({
      ...s,
      inventory: [...new Set([...s.inventory, 'diamond-crown', 'golden-crown', 'vip-badge', 'neon-theme', 'emerald-theme', 'ruby-theme', 'glitch-fx'])],
      skins: { snake: ['default', 'neon', 'gold', 'glitch', 'ghost', 'rainbow', 'zebra', 'robo', 'dragon'] },
    }));
  };

  const setCurrentGame = (game: string | null) => {
    setState(s => ({ ...s, currentGame: game }));
  };

  const updateSigmaStats = (lifetimeSigmas: number, rebirths: number, rawClicks: number) => {
    setState(s => ({
      ...s,
      sigmaLifetimeSigmas: lifetimeSigmas,
      sigmaRebirths: rebirths,
      sigmaRawClicks: rawClicks,
    }));
  };

  const importState = (imported: Partial<GameState>) => {
    const isLoggedIn = !!currentUser;
    const merged = fillDefaults(applyDailyLoginLogic({ ...defaultState, ...imported }, isLoggedIn));
    if (currentUser) {
      merged.isAdmin = currentUser.is_admin;
      merged.isOwner = currentUser.is_owner;
      merged.authMode = 'logged_in';
      merged.username = currentUser.username;
      merged.profilePic = currentUser.profile_pic_url || merged.profilePic;
    }
    setState(merged);
    const { isAdmin: _a, isOwner: _o, ...stateToSave } = merged;
    localStorage.setItem('portalGameState', JSON.stringify(stateToSave));
    if (currentUser) {
      Promise.all([
        profileApi.syncGameState({
          coins: merged.coins,
          xp: merged.xp,
          level: merged.level,
          inventory: merged.inventory,
          activeBorder: merged.activeBorder,
          displayedBadges: merged.displayedBadges,
          displayedItems: merged.displayedItems,
        }),
        progressApi.save('__portal_state', stateToSave),
        currentUser ? Promise.resolve() : progressApi.save('__guest_state', stateToSave),
      ]).catch(() => {
        console.warn('Failed to sync imported save to server. Changes saved locally.');
      });
    }
  };

  const exportState = () => {
    const { isAdmin: _a, isOwner: _o, ...stateToSave } = state;
    const payload = {
      ...stateToSave,
      savedAt: new Date().toISOString(),
      saveType: currentUser ? 'logged_in' : 'guest',
      userId: currentUser?.id || null,
      username: currentUser?.username || state.username || null,
    };
    return payload;
  };

  return (
    <GameContext.Provider value={{
      state, currentUser,
      buyItem, openMysteryBox, equipSkin, setActiveBorder, toggleDisplayedBadge, toggleDisplayedItem, playGame, claimQuest, claimAchievement,
      checkAchievements, getMultiplier, updateProfile, claimDailyReward, enterSecretCode,
      claimLevelReward, doPrestige, resolveStreakLoss, clearStreakIncrease, setAuthMode,
      login, register, logout,
      adminAddCoins, adminSetLevel, adminUnlockAll,
      setCurrentGame, updateSigmaStats, refreshUser, importState, exportState,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within GameProvider');
  return context;
};
