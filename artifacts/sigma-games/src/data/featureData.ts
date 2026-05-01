import { Star, Medal, Shield, Crown, Gem, Zap, Sparkles, Flame, Target, Hexagon, Palette, RefreshCw } from 'lucide-react';

export const SIGMA_BADGE_INFO: Record<string, { name: string; color: string }> = {
  'badge-sigma-beginner': { name: 'Sigma Beginner', color: 'text-cyan-400' },
  'badge-sigma-grinder': { name: 'Sigma Grinder', color: 'text-orange-400' },
  'badge-sigma-lord': { name: 'Sigma Lord', color: 'text-yellow-400' },
  'badge-sigma-god': { name: 'Sigma God', color: 'text-purple-400' },
  'badge-ego-death': { name: 'Ego Death', color: 'text-red-400' },
  'badge-triple-ego': { name: 'Triple Ego Death', color: 'text-pink-400' },
  'badge-clicker-warrior': { name: 'Clicker Warrior', color: 'text-emerald-400' },
  'badge-clicker-legend': { name: 'Clicker Legend', color: 'text-amber-400' },
  'badge-sigma-creator': { name: 'Sigma Creator', color: 'text-yellow-300' },
};

export const STORE_ITEMS = [
  { id: 'streak-freeze', name: 'Streak Freeze', description: 'Miss a day? Your streak will be saved automatically.', cost: 1000, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', isConsumable: true },
  { id: 'neon-theme', name: 'Neon Glow Theme', description: 'Unlock a premium fuchsia neon glow for all game cards.', cost: 3000, icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30', isConsumable: false },
  { id: 'emerald-theme', name: 'Emerald Theme', description: 'Unlock a lush green theme for your profile.', cost: 3000, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', isConsumable: false },
  { id: 'ruby-theme', name: 'Ruby Theme', description: 'Unlock a deep red theme for your profile.', cost: 3000, icon: Sparkles, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', isConsumable: false },
  { id: 'golden-crown', name: 'Golden Crown', description: 'Show off your wealth with a golden crown next to your streak.', cost: 5000, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', isConsumable: false },
  { id: 'diamond-crown', name: 'Diamond Crown', description: 'The ultimate flex. A diamond crown for the elite.', cost: 20000, icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', isConsumable: false },
  { id: 'vip-badge', name: 'VIP Badge', description: 'Exclusive VIP status icon on your profile.', cost: 35000, icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', isConsumable: false },
  { id: 'glitch-fx', name: 'Glitch FX', description: 'Add a cyberpunk glitch effect to your avatar.', cost: 10000, icon: Zap, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', isConsumable: false },
  { id: 'border-flame', name: 'Flame Border', description: 'A fiery orange border that blazes around your avatar.', cost: 4000, icon: Hexagon, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', isConsumable: false },
  { id: 'border-frost', name: 'Frost Border', description: 'An icy crystalline border for a cool look.', cost: 4000, icon: Hexagon, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30', isConsumable: false },
  { id: 'border-toxic', name: 'Toxic Border', description: 'A radioactive green glow around your avatar.', cost: 6000, icon: Hexagon, color: 'text-lime-400', bg: 'bg-lime-500/20', border: 'border-lime-500/30', isConsumable: false },
  { id: 'border-galaxy', name: 'Galaxy Border', description: 'A cosmic purple swirl for your profile picture.', cost: 10000, icon: Hexagon, color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', isConsumable: false },
  { id: 'border-rainbow', name: 'Rainbow Border', description: 'A vibrant rainbow gradient border. Stand out!', cost: 15000, icon: Hexagon, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30', isConsumable: false },
  { id: 'border-legendary', name: 'Legendary Border', description: 'The ultimate animated gold legendary frame.', cost: 30000, icon: Hexagon, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', isConsumable: false },
  { id: 'sigma-2x-boost', name: 'Sigma 2x Click Boost', description: 'Permanently double your click power in Sigma Clicker.', cost: 8000, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', isConsumable: false },
  { id: 'sigma-auto-clicker', name: 'Sigma Auto-Click Token', description: 'Permanently grants +10 automatic clicks per second in Sigma Clicker.', cost: 12000, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', isConsumable: false },
  { id: 'sigma-heat-shield', name: 'Sigma Heat Shield', description: 'Permanently makes overheat cooldown 2% faster in Sigma Clicker. Stacks up to 50×.', cost: 5000, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', isConsumable: true, maxPurchases: 50 },
  { id: 'sigma-golden-orb', name: 'Golden Orb Skin', description: 'Your Sigma Clicker orb gets a golden glow effect.', cost: 18000, icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', isConsumable: false },
  { id: 'sigma-neon-orb', name: 'Neon Orb Skin', description: 'A cyberpunk neon pink orb skin for Sigma Clicker.', cost: 18000, icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30', isConsumable: false },
  { id: 'sigma-island-theme', name: 'Sigma Island Theme', description: 'Unlock a custom island theme for your Sigma Clicker beach.', cost: 25000, icon: Palette, color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', isConsumable: false },
  { id: 'sigma-auto-rebirth', name: 'Auto-Rebirth Module', description: 'Automatically rebirths when you hit the threshold in Sigma Clicker. No more manual prestige!', cost: 20000, icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', isConsumable: false },
];

export const LEVEL_REWARDS = [
  { level: 5, reward: 500, title: 'Novice Explorer', icon: Star, borderReward: 'border-bronze' },
  { level: 10, reward: 1500, title: 'Apprentice Gamer', icon: Medal },
  { level: 25, reward: 5000, title: 'Seasoned Veteran', icon: Shield, borderReward: 'border-silver' },
  { level: 50, reward: 15000, title: 'Arcade Master', icon: Crown, borderReward: 'border-gold-rank' },
  { level: 75, reward: 30000, title: 'Grand Champion', icon: Gem, borderReward: 'border-platinum' },
  { level: 100, reward: 100000, title: 'Legendary Status', icon: Zap },
  { level: 200, reward: 250000, title: 'Mythic Entity', icon: Sparkles },
  { level: 300, reward: 500000, title: 'Divine Being', icon: Flame },
  { level: 400, reward: 1000000, title: 'Cosmic Overlord', icon: Crown },
  { level: 500, reward: 2500000, title: 'Universal Creator', icon: Target },
];

export const BANNER_PRESETS = [
  { id: 'bg-gradient-to-r from-blue-500 to-purple-600', name: 'Ocean Night', colors: ['#3b82f6', '#9333ea'] },
  { id: 'bg-gradient-to-r from-rose-500 to-orange-400', name: 'Sunset', colors: ['#f43f5e', '#fb923c'] },
  { id: 'bg-gradient-to-r from-emerald-500 to-cyan-400', name: 'Forest', colors: ['#10b981', '#22d3ee'] },
  { id: 'bg-gradient-to-r from-violet-600 to-fuchsia-500', name: 'Neon', colors: ['#7c3aed', '#d946ef'] },
  { id: 'bg-gradient-to-r from-amber-500 to-red-500', name: 'Fire', colors: ['#f59e0b', '#ef4444'] },
  { id: 'bg-gradient-to-r from-gray-900 to-gray-700', name: 'Midnight', colors: ['#111827', '#374151'] },
  { id: 'bg-gradient-to-r from-pink-500 to-violet-500', name: 'Cotton Candy', colors: ['#ec4899', '#8b5cf6'] },
  { id: 'bg-gradient-to-r from-cyan-400 to-blue-600', name: 'Arctic', colors: ['#22d3ee', '#2563eb'] },
  { id: 'bg-gradient-to-r from-lime-400 to-emerald-600', name: 'Matrix', colors: ['#a3e635', '#059669'] },
  { id: 'bg-gradient-to-r from-yellow-400 to-amber-600', name: 'Gold Rush', colors: ['#facc15', '#d97706'] },
  { id: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800', name: 'Galaxy', colors: ['#312e81', '#831843'] },
  { id: 'bg-gradient-to-r from-red-600 to-red-900', name: 'Blood Moon', colors: ['#dc2626', '#7f1d1d'] },
];

export const DISPLAYABLE_ITEMS = [
  { id: 'golden-crown', name: 'Golden Crown', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'diamond-crown', name: 'Diamond Crown', icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'vip-badge', name: 'VIP Badge', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'glitch-fx', name: 'Glitch FX', icon: Zap, color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'neon-theme', name: 'Neon Glow Theme', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
  { id: 'emerald-theme', name: 'Emerald Theme', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'ruby-theme', name: 'Ruby Theme', icon: Sparkles, color: 'text-red-400', bg: 'bg-red-500/20' },
];

export const PROFILE_BORDERS: Record<string, { name: string; style: string; shadow: string; color: string }> = {
  'default': { name: 'Default', style: 'border-[#0a0a0a]', shadow: '', color: '#666' },
  'border-bronze': { name: 'Bronze', style: 'border-amber-700', shadow: 'shadow-[0_0_15px_rgba(180,83,9,0.5)]', color: '#b45309' },
  'border-silver': { name: 'Silver', style: 'border-gray-300', shadow: 'shadow-[0_0_15px_rgba(209,213,219,0.5)]', color: '#d1d5db' },
  'border-gold-rank': { name: 'Gold Rank', style: 'border-yellow-400', shadow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]', color: '#facc15' },
  'border-platinum': { name: 'Platinum', style: 'border-cyan-300', shadow: 'shadow-[0_0_20px_rgba(103,232,249,0.6)]', color: '#67e8f9' },
  'border-flame': { name: 'Flame', style: 'border-orange-500', shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]', color: '#f97316' },
  'border-frost': { name: 'Frost', style: 'border-sky-400', shadow: 'shadow-[0_0_20px_rgba(56,189,248,0.7)]', color: '#38bdf8' },
  'border-toxic': { name: 'Toxic', style: 'border-lime-400', shadow: 'shadow-[0_0_20px_rgba(163,230,53,0.7)]', color: '#a3e635' },
  'border-galaxy': { name: 'Galaxy', style: 'border-violet-500', shadow: 'shadow-[0_0_25px_rgba(139,92,246,0.7)]', color: '#8b5cf6' },
  'border-rainbow': { name: 'Rainbow', style: 'border-pink-500', shadow: 'shadow-[0_0_25px_rgba(236,72,153,0.7)]', color: '#ec4899' },
  'border-legendary': { name: 'Legendary', style: 'border-amber-400', shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.8)]', color: '#fbbf24' },
};
