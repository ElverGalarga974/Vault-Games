import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Crown, Search, Ban, VolumeX, Volume2, Coins, Star, Trash2, RefreshCw, ChevronDown, Users, MessageCircle, Zap, AlertTriangle, Hexagon, PackageOpen, Plus, Key, Activity, Eye } from 'lucide-react';
import { adminApi, UserProfile, RedeemCode } from '../api/client';
import { useGameContext } from '../context/GameContext';
import { STORE_ITEMS } from '../data/featureData';

interface AdminPanelProps {
  onClose: () => void;
}

type AdminTab = 'users' | 'chat' | 'codes' | 'badges' | 'dms' | 'traffic' | 'stats' | 'sql' | 'tools';

const ALL_BADGES = [
  { id: 'badge-rec-room', name: 'Rec Room Veteran', desc: 'Default badge (all players)', color: 'text-cyan-400', icon: '🎮' },
  { id: 'badge-first-blood', name: 'First Blood', desc: 'Click the Sigma orb once', color: 'text-red-400', icon: '🩸' },
  { id: 'badge-click-1k', name: '1K Clicks', desc: '1,000 manual clicks', color: 'text-green-400', icon: '👆' },
  { id: 'badge-click-10k', name: '10K Clicks', desc: '10,000 manual clicks', color: 'text-emerald-400', icon: '🖱️' },
  { id: 'badge-click-100k', name: '100K Clicks', desc: '100,000 manual clicks', color: 'text-teal-400', icon: '⚡' },
  { id: 'badge-orb-hunter', name: 'Orb Hunter', desc: 'Collect 100 Alpha Energy Orbs', color: 'text-yellow-400', icon: '🔮' },
  { id: 'badge-rebirth-1', name: 'Ego Death', desc: 'Complete 1 Rebirth', color: 'text-purple-400', icon: '💀' },
  { id: 'badge-rebirth-5', name: 'Serial Rebirther', desc: '5 Rebirths', color: 'text-pink-400', icon: '🔄' },
  { id: 'badge-rebirth-10', name: 'Rebirth Master', desc: '10 Rebirths', color: 'text-orange-400', icon: '👑' },
  { id: 'badge-sigma-1m', name: 'Millionaire', desc: '1M lifetime Sigmas', color: 'text-amber-400', icon: '💰' },
  { id: 'badge-sigma-1b', name: 'Billionaire', desc: '1B lifetime Sigmas', color: 'text-blue-400', icon: '💎' },
  { id: 'badge-brain-fog', name: 'Fog Survivor', desc: 'Beat Brain Fog 10 times', color: 'text-gray-300', icon: '🌫️' },
  { id: 'badge-puzzler', name: 'Puzzler', desc: 'Solve 25 puzzles', color: 'text-indigo-400', icon: '🧩' },
  { id: 'badge-all-puzzles', name: 'Brain Unlocked', desc: 'Unlock all 3 puzzle multipliers', color: 'text-violet-400', icon: '🧠' },
  { id: 'badge-prestige-shop', name: 'Prestige Spender', desc: 'Buy any Prestige Upgrade', color: 'text-fuchsia-400', icon: '🛒' },
  { id: 'badge-sigma-creator', name: 'Sigma Creator', desc: 'Granted by creators only', color: 'text-yellow-300', icon: '/sigma-creator-badge.png' },
];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <p className="text-white font-medium">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold transition-colors">Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}

type SCEditTab = 'stats' | 'click' | 'idle' | 'prestige' | 'synergy' | 'cosmetics';

const SC_CLICK_IDS = ['mewing','jawline','bonesmash','looksmax','mogging','sigma-aura','reality-warp','universe-mog','jawline-gum','guasha','mewing2','hunter-eyes','bonesmash2','skincare','mogging-aura','golden-ratio','ego-expansion'];
const SC_IDLE_IDS = ['gym','creatine','tren','sleep','gigachad','sigma-factory','enlightenment','transcendence','protein','raw-egg','gym2','alarm','icebath','tren2','gigachad2','cryochamber','podcast'];
const SC_PRESTIGE_IDS = ['critChance','comboExtend','orbFrequency','costReduction','auraBoost','orbBonus'];
const SC_SYNERGY_IDS = ['mew-jaw','gym-sleep','click-idle','idle-click','global-mult'];
const SC_COSMETIC_IDS = [
  'title-sigma-perfectionist','title-the-ascended','title-ego-death-survivor','title-prestige-i','title-prestige-ii','title-prestige-iii','title-prestige-max','title-reality-bender','title-carpal-tunnel','title-the-unbroken','title-time-lord','title-focus-master','title-puzzle-prodigy','title-tren-titan','title-looksmax-legend',
  'border-wood','border-iron','border-bronze','border-silver','border-gold','border-neon-beach','border-glitch','border-void','border-diamond',
  'badge-rec-room','badge-first-blood','badge-orb-hunter','badge-click-1k','badge-click-10k','badge-click-100k','badge-rebirth-1','badge-rebirth-5','badge-rebirth-10','badge-rebirth-20','badge-sigma-1m','badge-sigma-1b','badge-brain-fog','badge-puzzler','badge-all-puzzles','badge-prestige-shop','badge-sigma-creator',
];

function SigmaProgressEditor({ userId, username }: { userId: number; username: string }) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [scTab, setScTab] = useState<SCEditTab>('stats');

  const [sigmas, setSigmas] = useState('');
  const [lifetimeSigmas, setLifetimeSigmas] = useState('');
  const [rebirths, setRebirths] = useState('');
  const [totalClicks, setTotalClicks] = useState('');
  const [rawClicks, setRawClicks] = useState('');
  const [orbsCollected, setOrbsCollected] = useState('');
  const [focusGameWins, setFocusGameWins] = useState('');
  const [totalPuzzlesSolved, setTotalPuzzlesSolved] = useState('');
  const [globalMultLevel, setGlobalMultLevel] = useState('');

  const [editClick, setEditClick] = useState<Record<string, string>>({});
  const [editIdle, setEditIdle] = useState<Record<string, string>>({});
  const [editPrestige, setEditPrestige] = useState<Record<string, string>>({});
  const [editSynergy, setEditSynergy] = useState<Record<string, string>>({});

  const populateFromProgress = (p: any) => {
    setSigmas(String(p.sigmas || 0));
    setLifetimeSigmas(String(p.lifetimeSigmas || 0));
    setRebirths(String(p.rebirths || 0));
    setTotalClicks(String(p.totalClicks || 0));
    setRawClicks(String(p.rawClicks || 0));
    setOrbsCollected(String(p.orbsCollected || 0));
    setFocusGameWins(String(p.focusGameWins || 0));
    setTotalPuzzlesSolved(String(p.totalPuzzlesSolved || 0));
    setGlobalMultLevel(String(p.globalMultLevel || 0));
    const ec: Record<string, string> = {};
    SC_CLICK_IDS.forEach(id => { ec[id] = String(p.ownedClick?.[id] || 0); });
    setEditClick(ec);
    const ei: Record<string, string> = {};
    SC_IDLE_IDS.forEach(id => { ei[id] = String(p.ownedIdle?.[id] || 0); });
    setEditIdle(ei);
    const ep: Record<string, string> = {};
    SC_PRESTIGE_IDS.forEach(id => { ep[id] = String(p.prestigeUpgrades?.[id] || 0); });
    setEditPrestige(ep);
    const es: Record<string, string> = {};
    SC_SYNERGY_IDS.forEach(id => { es[id] = String(p.synergyLevels?.[id] || 0); });
    setEditSynergy(es);
  };

  const loadProgress = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await adminApi.getGameProgress(userId, 'sigma-clicker');
      if (data.progress) {
        setProgress(data.progress);
        populateFromProgress(data.progress);
      } else {
        setProgress(null);
        setMsg('No Sigma Clicker progress found for this user.');
      }
      setLoaded(true);
    } catch {
      setMsg('Failed to load progress.');
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const saveStats = async () => {
    setSaving(true);
    setMsg('');
    try {
      const updates: Record<string, any> = {};
      const check = (key: string, val: string, orig: any) => {
        const n = parseInt(val) || 0;
        if (n !== (orig || 0)) updates[key] = n;
      };
      check('sigmas', sigmas, progress?.sigmas);
      check('lifetimeSigmas', lifetimeSigmas, progress?.lifetimeSigmas);
      check('rebirths', rebirths, progress?.rebirths);
      check('totalClicks', totalClicks, progress?.totalClicks);
      check('rawClicks', rawClicks, progress?.rawClicks);
      check('orbsCollected', orbsCollected, progress?.orbsCollected);
      check('focusGameWins', focusGameWins, progress?.focusGameWins);
      check('totalPuzzlesSolved', totalPuzzlesSolved, progress?.totalPuzzlesSolved);
      check('globalMultLevel', globalMultLevel, progress?.globalMultLevel);
      if (Object.keys(updates).length === 0) { setMsg('No changes to save.'); setSaving(false); return; }
      const res = await adminApi.updateGameProgress(userId, 'sigma-clicker', updates);
      setProgress(res.progress);
      setMsg('Stats updated!');
    } catch {
      setMsg('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const saveUpgrades = async (type: 'click' | 'idle' | 'prestige' | 'synergy') => {
    setSaving(true);
    setMsg('');
    try {
      const updates: Record<string, any> = {};
      if (type === 'click') {
        const ownedClick: Record<string, number> = { ...(progress?.ownedClick || {}) };
        SC_CLICK_IDS.forEach(id => { ownedClick[id] = parseInt(editClick[id]) || 0; });
        updates.ownedClick = ownedClick;
      } else if (type === 'idle') {
        const ownedIdle: Record<string, number> = { ...(progress?.ownedIdle || {}) };
        SC_IDLE_IDS.forEach(id => { ownedIdle[id] = parseInt(editIdle[id]) || 0; });
        updates.ownedIdle = ownedIdle;
      } else if (type === 'prestige') {
        const prestigeUpgrades: Record<string, number> = { ...(progress?.prestigeUpgrades || {}) };
        SC_PRESTIGE_IDS.forEach(id => { prestigeUpgrades[id] = parseInt(editPrestige[id]) || 0; });
        updates.prestigeUpgrades = prestigeUpgrades;
      } else if (type === 'synergy') {
        const synergyLevels: Record<string, number> = { ...(progress?.synergyLevels || {}) };
        SC_SYNERGY_IDS.forEach(id => { synergyLevels[id] = parseInt(editSynergy[id]) || 0; });
        updates.synergyLevels = synergyLevels;
      }
      const res = await adminApi.updateGameProgress(userId, 'sigma-clicker', updates);
      setProgress(res.progress);
      populateFromProgress(res.progress);
      setMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} upgrades saved!`);
    } catch {
      setMsg('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCosmetic = async (cosmeticId: string) => {
    setSaving(true);
    setMsg('');
    try {
      const current: string[] = progress?.unlockedCosmetics || [];
      const has = current.includes(cosmeticId);
      const updated = has ? current.filter((c: string) => c !== cosmeticId) : [...current, cosmeticId];
      const updates: Record<string, any> = { unlockedCosmetics: updated };
      if (has && progress?.equippedTitle === cosmeticId) updates.equippedTitle = null;
      if (has && progress?.equippedBorder === cosmeticId) updates.equippedBorder = null;
      if (has && (progress?.equippedBadges || []).includes(cosmeticId)) {
        updates.equippedBadges = (progress.equippedBadges || []).filter((b: string) => b !== cosmeticId);
      }
      const res = await adminApi.updateGameProgress(userId, 'sigma-clicker', updates);
      setProgress(res.progress);
      setMsg(has ? `Revoked ${cosmeticId}` : `Granted ${cosmeticId}!`);
    } catch {
      setMsg('Failed.');
    } finally {
      setSaving(false);
    }
  };

  const setEquipped = async (field: 'equippedTitle' | 'equippedBorder', value: string | null) => {
    setSaving(true);
    try {
      const res = await adminApi.updateGameProgress(userId, 'sigma-clicker', { [field]: value });
      setProgress(res.progress);
      setMsg(`${field === 'equippedTitle' ? 'Title' : 'Border'} ${value ? 'set' : 'cleared'}!`);
    } catch { setMsg('Failed.'); }
    finally { setSaving(false); }
  };

  const grantAll = async (type: 'click' | 'idle' | 'prestige' | 'synergy' | 'cosmetics') => {
    setSaving(true);
    setMsg('');
    try {
      const updates: Record<string, any> = {};
      if (type === 'click') {
        const ownedClick: Record<string, number> = {};
        SC_CLICK_IDS.forEach(id => { ownedClick[id] = 500; });
        updates.ownedClick = ownedClick;
      } else if (type === 'idle') {
        const ownedIdle: Record<string, number> = {};
        SC_IDLE_IDS.forEach(id => { ownedIdle[id] = 500; });
        updates.ownedIdle = ownedIdle;
      } else if (type === 'prestige') {
        const prestigeUpgrades: Record<string, number> = {};
        SC_PRESTIGE_IDS.forEach(id => { prestigeUpgrades[id] = 15; });
        updates.prestigeUpgrades = prestigeUpgrades;
      } else if (type === 'synergy') {
        const synergyLevels: Record<string, number> = {};
        SC_SYNERGY_IDS.forEach(id => { synergyLevels[id] = 20; });
        updates.synergyLevels = synergyLevels;
      } else if (type === 'cosmetics') {
        updates.unlockedCosmetics = [...SC_COSMETIC_IDS];
      }
      const res = await adminApi.updateGameProgress(userId, 'sigma-clicker', updates);
      setProgress(res.progress);
      populateFromProgress(res.progress);
      setMsg(`All ${type} maxed!`);
    } catch { setMsg('Failed.'); }
    finally { setSaving(false); }
  };

  const resetProgress = async () => {
    if (!confirm(`Reset ALL Sigma Clicker progress for ${username}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await adminApi.updateGameProgress(userId, 'sigma-clicker', {
        sigmas: 0, lifetimeSigmas: 0, rebirths: 0, totalClicks: 0,
        sigmasSinceRebirth: 0, rawClicks: 0, orbsCollected: 0,
        focusGameWins: 0, totalPuzzlesSolved: 0, globalMultLevel: 0,
        ownedClick: {}, ownedIdle: {},
        prestigeUpgrades: {},
        synergyLevels: {},
        unlockedCosmetics: [],
        equippedTitle: null, equippedBorder: null, equippedBadges: [],
      });
      const blank = { sigmas: 0, lifetimeSigmas: 0, rebirths: 0, totalClicks: 0, rawClicks: 0, orbsCollected: 0, focusGameWins: 0, totalPuzzlesSolved: 0, globalMultLevel: 0, ownedClick: {}, ownedIdle: {}, prestigeUpgrades: {}, synergyLevels: {}, unlockedCosmetics: [], equippedTitle: null, equippedBorder: null, equippedBadges: [] };
      setProgress(blank);
      populateFromProgress(blank);
      setMsg('Progress reset!');
    } catch {
      setMsg('Failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <button onClick={loadProgress} disabled={loading}
        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50">
        {loading ? 'Loading...' : '🎮 View Sigma Progress'}
      </button>
    );
  }

  if (!progress) {
    return (
      <div className="mt-3 pt-3 border-t border-cyan-500/10">
        <p className="text-gray-500 text-xs mb-2">{msg || 'No Sigma Clicker data.'}</p>
        <div className="flex gap-2">
          <button onClick={loadProgress} disabled={loading}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium transition-colors disabled:opacity-50">
            ↻ Retry
          </button>
          <button onClick={async () => {
            setSaving(true);
            try {
              await adminApi.updateGameProgress(userId, 'sigma-clicker', { sigmas: 0, lifetimeSigmas: 0, rebirths: 0, totalClicks: 0 });
              setMsg('Progress initialized!');
              await loadProgress();
            } catch { setMsg('Failed to initialize.'); }
            finally { setSaving(false); }
          }} disabled={saving}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50">
            Initialize Progress
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-2 py-1 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500/50";
  const labelCls = "text-[10px] text-gray-500 block mb-0.5";
  const tabBtnCls = (active: boolean) => `px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${active ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`;
  const unlocked = progress.unlockedCosmetics || [];

  return (
    <div className="mt-3 pt-3 border-t border-cyan-500/10">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1">🎮 Sigma Clicker Progress</h4>
        <div className="flex items-center gap-1">
          <button onClick={loadProgress} disabled={loading} className="px-2 py-1 text-gray-500 hover:text-white text-[10px] transition-colors disabled:opacity-50">↻</button>
          <button onClick={resetProgress} disabled={saving} className="px-2 py-1 text-red-400/60 hover:text-red-400 text-[10px] transition-colors disabled:opacity-50">Reset All</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {(['stats','click','idle','prestige','synergy','cosmetics'] as SCEditTab[]).map(t => (
          <button key={t} onClick={() => setScTab(t)} className={tabBtnCls(scTab === t)}>
            {t === 'stats' ? '📊 Stats' : t === 'click' ? '⚡ Click' : t === 'idle' ? '⚙️ Idle' : t === 'prestige' ? '🏆 Prestige' : t === 'synergy' ? '🔗 Synergy' : '🎨 Cosmetics'}
          </button>
        ))}
      </div>

      {scTab === 'stats' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>Sigmas</label><input type="number" value={sigmas} onChange={e => setSigmas(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Lifetime Sigmas</label><input type="number" value={lifetimeSigmas} onChange={e => setLifetimeSigmas(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Rebirths</label><input type="number" value={rebirths} onChange={e => setRebirths(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Total Clicks</label><input type="number" value={totalClicks} onChange={e => setTotalClicks(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Raw Clicks</label><input type="number" value={rawClicks} onChange={e => setRawClicks(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Orbs Collected</label><input type="number" value={orbsCollected} onChange={e => setOrbsCollected(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Focus Wins</label><input type="number" value={focusGameWins} onChange={e => setFocusGameWins(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Puzzles Solved</label><input type="number" value={totalPuzzlesSolved} onChange={e => setTotalPuzzlesSolved(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Global Mult Lv</label><input type="number" value={globalMultLevel} onChange={e => setGlobalMultLevel(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={saveStats} disabled={saving} className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Stats'}
            </button>
          </div>
        </>
      )}

      {scTab === 'click' && (
        <>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500">Set level for each click upgrade</p>
            <button onClick={() => grantAll('click')} disabled={saving} className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-50">Max All (500)</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {SC_CLICK_IDS.map(id => (
              <div key={id} className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-400 w-28 truncate" title={id}>{id}</label>
                <input type="number" min="0" value={editClick[id] || '0'} onChange={e => setEditClick(prev => ({ ...prev, [id]: e.target.value }))} className="w-16 px-1.5 py-0.5 bg-[#111] border border-white/10 rounded text-white text-[10px] focus:outline-none focus:border-violet-500/50" />
              </div>
            ))}
          </div>
          <button onClick={() => saveUpgrades('click')} disabled={saving} className="mt-2 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Click Upgrades'}
          </button>
        </>
      )}

      {scTab === 'idle' && (
        <>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500">Set level for each idle upgrade</p>
            <button onClick={() => grantAll('idle')} disabled={saving} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">Max All (500)</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {SC_IDLE_IDS.map(id => (
              <div key={id} className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-400 w-28 truncate" title={id}>{id}</label>
                <input type="number" min="0" value={editIdle[id] || '0'} onChange={e => setEditIdle(prev => ({ ...prev, [id]: e.target.value }))} className="w-16 px-1.5 py-0.5 bg-[#111] border border-white/10 rounded text-white text-[10px] focus:outline-none focus:border-emerald-500/50" />
              </div>
            ))}
          </div>
          <button onClick={() => saveUpgrades('idle')} disabled={saving} className="mt-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Idle Upgrades'}
          </button>
        </>
      )}

      {scTab === 'prestige' && (
        <>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500">Set level for each prestige upgrade</p>
            <button onClick={() => grantAll('prestige')} disabled={saving} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50">Max All</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SC_PRESTIGE_IDS.map(id => (
              <div key={id} className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-400 w-28 truncate" title={id}>{id}</label>
                <input type="number" min="0" value={editPrestige[id] || '0'} onChange={e => setEditPrestige(prev => ({ ...prev, [id]: e.target.value }))} className="w-16 px-1.5 py-0.5 bg-[#111] border border-white/10 rounded text-white text-[10px] focus:outline-none focus:border-amber-500/50" />
              </div>
            ))}
          </div>
          <button onClick={() => saveUpgrades('prestige')} disabled={saving} className="mt-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Prestige Upgrades'}
          </button>
        </>
      )}

      {scTab === 'synergy' && (
        <>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500">Set level for each synergy upgrade</p>
            <button onClick={() => grantAll('synergy')} disabled={saving} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50">Max All</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SC_SYNERGY_IDS.map(id => (
              <div key={id} className="flex items-center gap-1.5">
                <label className="text-[10px] text-gray-400 w-28 truncate" title={id}>{id}</label>
                <input type="number" min="0" value={editSynergy[id] || '0'} onChange={e => setEditSynergy(prev => ({ ...prev, [id]: e.target.value }))} className="w-16 px-1.5 py-0.5 bg-[#111] border border-white/10 rounded text-white text-[10px] focus:outline-none focus:border-blue-500/50" />
              </div>
            ))}
          </div>
          <button onClick={() => saveUpgrades('synergy')} disabled={saving} className="mt-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Synergy Levels'}
          </button>
        </>
      )}

      {scTab === 'cosmetics' && (
        <>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500">Toggle cosmetics (titles, borders, badges)</p>
            <button onClick={() => grantAll('cosmetics')} disabled={saving} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 transition-colors disabled:opacity-50">Unlock All</button>
          </div>

          {progress.equippedTitle && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-500">Equipped Title:</span>
              <span className="text-[10px] text-yellow-300 font-bold">{progress.equippedTitle}</span>
              <button onClick={() => setEquipped('equippedTitle', null)} className="text-[10px] text-red-400/60 hover:text-red-400">(clear)</button>
            </div>
          )}
          {progress.equippedBorder && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-500">Equipped Border:</span>
              <span className="text-[10px] text-purple-300 font-bold">{progress.equippedBorder}</span>
              <button onClick={() => setEquipped('equippedBorder', null)} className="text-[10px] text-red-400/60 hover:text-red-400">(clear)</button>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div>
              <p className="text-[10px] text-yellow-400 font-bold mb-1">Titles</p>
              <div className="flex flex-wrap gap-1">
                {SC_COSMETIC_IDS.filter(id => id.startsWith('title-')).map(id => {
                  const has = unlocked.includes(id);
                  return (
                    <button key={id} onClick={() => toggleCosmetic(id)} disabled={saving}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${has ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-red-500/20 hover:text-red-300' : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-yellow-500/20 hover:text-yellow-300'}`}>
                      {has ? '✓ ' : '+ '}{id.replace('title-', '')}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-bold mb-1">Borders</p>
              <div className="flex flex-wrap gap-1">
                {SC_COSMETIC_IDS.filter(id => id.startsWith('border-')).map(id => {
                  const has = unlocked.includes(id);
                  return (
                    <button key={id} onClick={() => toggleCosmetic(id)} disabled={saving}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${has ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-red-500/20 hover:text-red-300' : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-purple-500/20 hover:text-purple-300'}`}>
                      {has ? '✓ ' : '+ '}{id.replace('border-', '')}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-cyan-400 font-bold mb-1">SC Badges</p>
              <div className="flex flex-wrap gap-1">
                {SC_COSMETIC_IDS.filter(id => id.startsWith('badge-')).map(id => {
                  const has = unlocked.includes(id);
                  return (
                    <button key={id} onClick={() => toggleCosmetic(id)} disabled={saving}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${has ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-red-500/20 hover:text-red-300' : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:bg-cyan-500/20 hover:text-cyan-300'}`}>
                      {has ? '✓ ' : '+ '}{id.replace('badge-', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 border-t border-white/5">
              <p className="text-[10px] text-gray-500 mb-1">Quick equip title:</p>
              <div className="flex flex-wrap gap-1">
                {SC_COSMETIC_IDS.filter(id => id.startsWith('title-') && unlocked.includes(id)).map(id => (
                  <button key={id} onClick={() => setEquipped('equippedTitle', id)} disabled={saving}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${progress.equippedTitle === id ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/40' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-yellow-500/20 hover:text-yellow-300'}`}>
                    {id.replace('title-', '')}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mb-1 mt-1">Quick equip border:</p>
              <div className="flex flex-wrap gap-1">
                {SC_COSMETIC_IDS.filter(id => id.startsWith('border-') && unlocked.includes(id)).map(id => (
                  <button key={id} onClick={() => setEquipped('equippedBorder', id)} disabled={saving}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${progress.equippedBorder === id ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-purple-500/20 hover:text-purple-300'}`}>
                    {id.replace('border-', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {msg && <p className={`text-xs mt-1 ${msg.includes('!') ? 'text-emerald-400' : 'text-yellow-400'}`}>{msg}</p>}
    </div>
  );
}

function TrafficMonitor() {
  const [traffic, setTraffic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTraffic = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTraffic();
      setTraffic(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTraffic();
    const iv = setInterval(loadTraffic, 15000);
    return () => clearInterval(iv);
  }, [loadTraffic]);

  if (loading && !traffic) return <p className="text-gray-500 text-sm text-center py-8">Loading traffic data...</p>;
  if (!traffic) return <p className="text-gray-500 text-sm text-center py-8">Failed to load traffic data.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-green-400" /> Live Traffic Monitor</h3>
        <button onClick={loadTraffic} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Online Now', value: traffic.onlineCount, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Active Today', value: traffic.todayActive, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Active This Week', value: traffic.weekActive, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Total Users', value: traffic.totalUsers, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-400">{traffic.newToday}</p>
          <p className="text-[10px] text-gray-400">New Users Today</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-cyan-400">{traffic.newWeek}</p>
          <p className="text-[10px] text-gray-400">New Users This Week</p>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-xl border border-white/10 p-3">
        <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online Users ({traffic.onlineCount})
        </h4>
        {traffic.onlineUsers.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-2">No users online right now</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {traffic.onlineUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {u.profile_pic_url ? (
                    <img src={u.profile_pic_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium" style={{ color: u.name_color || '#fff' }}>{u.username}</span>
                  <span className="text-[10px] text-gray-500">Lv{u.level}</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(u.last_seen).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[9px] text-gray-600 text-center">Auto-refreshes every 15 seconds · Only you can see this</p>
    </div>
  );
}

function OwnerDMBrowser() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<{ user1: number; user2: number; user1Name: string; user2Name: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.getAllConversations()
      .then(data => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const viewConversation = async (c: any) => {
    setSelectedConvo({ user1: c.user1_id, user2: c.user2_id, user1Name: c.user1_name, user2Name: c.user2_name });
    try {
      const data = await adminApi.getConversation(c.user1_id, c.user2_id);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  if (selectedConvo) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedConvo(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          ← Back to all conversations
        </button>
        <h3 className="text-lg font-bold text-white">
          {selectedConvo.user1Name} ↔ {selectedConvo.user2Name}
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {messages.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No messages</p>}
          {messages.map((msg: any) => (
            <div key={msg.id} className="bg-black/30 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: msg.sender_color || '#fff' }}>
                  {msg.sender_username}
                </span>
                <span className="text-[10px] text-gray-600">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-300 break-words">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-red-400" />
        All Private Conversations
      </h3>
      <p className="text-gray-500 text-xs">Owner-only: view all DM conversations on the platform.</p>
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-4 animate-pulse">Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No conversations found</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c: any, i: number) => (
            <button
              key={i}
              onClick={() => viewConversation(c)}
              className="w-full flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-3 hover:bg-white/5 transition-colors text-left"
            >
              <div>
                <span className="text-sm text-white font-semibold">{c.user1_name}</span>
                <span className="text-gray-500 text-sm mx-2">↔</span>
                <span className="text-sm text-white font-semibold">{c.user2_name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">{c.message_count} msgs</span>
                <p className="text-[10px] text-gray-600">{new Date(c.last_message_at).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ServerStatsPanel({ showSuccess, showError }: { showSuccess: (m: string) => void; showError: (m: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const data = await adminApi.getServerStats();
      setStats(data);
    } catch (e: any) { showError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading stats...</div>;
  if (!stats) return <div className="text-center text-red-400 py-8">Failed to load stats</div>;

  const StatCard = ({ label, value, color = 'text-white', sub }: { label: string; value: string | number; color?: string; sub?: string }) => (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </div>
  );

  const uptimeStr = stats.server.uptime > 86400
    ? `${Math.floor(stats.server.uptime / 86400)}d ${Math.floor((stats.server.uptime % 86400) / 3600)}h`
    : stats.server.uptime > 3600
    ? `${Math.floor(stats.server.uptime / 3600)}h ${Math.floor((stats.server.uptime % 3600) / 60)}m`
    : `${Math.floor(stats.server.uptime / 60)}m ${stats.server.uptime % 60}s`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /> Server Stats</h3>
        <button onClick={load} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 text-xs transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">💰 Economy</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Coins" value={stats.economy.totalCoins} color="text-yellow-400" />
          <StatCard label="Total XP" value={stats.economy.totalXP} color="text-green-400" />
          <StatCard label="Avg Level" value={stats.economy.avgLevel} color="text-blue-400" />
          <StatCard label="Max Level" value={stats.economy.maxLevel} color="text-purple-400" />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">📊 Platform</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Global Messages" value={stats.counts.globalMessages} color="text-cyan-400" />
          <StatCard label="Direct Messages" value={stats.counts.directMessages} color="text-pink-400" />
          <StatCard label="Game Progress Entries" value={stats.counts.gameProgressEntries} />
          <StatCard label="Active Sessions" value={stats.counts.activeSessions} color="text-amber-400" />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">👮 Moderation</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Staff" value={stats.counts.staffCount} color="text-blue-300" />
          <StatCard label="Banned" value={stats.counts.bannedUsers} color="text-red-400" />
          <StatCard label="Muted" value={stats.counts.mutedUsers} color="text-orange-400" />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">🖥️ Server</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Uptime" value={uptimeStr} color="text-green-400" />
          <StatCard label="Memory (RSS)" value={`${stats.server.memoryMB} MB`} color="text-blue-400" sub={`Heap: ${stats.server.heapUsedMB}/${stats.server.heapTotalMB} MB`} />
          <StatCard label="Node.js" value={stats.server.nodeVersion} />
          <StatCard label="DB Size" value={stats.database.size} color="text-purple-400" />
        </div>
      </div>

      {stats.database.tables.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">🗄️ Table Sizes</p>
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/10">
                <th className="text-left text-gray-500 px-4 py-2">Table</th>
                <th className="text-right text-gray-500 px-4 py-2">Rows</th>
              </tr></thead>
              <tbody>
                {stats.database.tables.map((t: any) => (
                  <tr key={t.table_name} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2 text-gray-300 font-mono">{t.table_name}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{Number(t.row_count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SQLConsole({ showSuccess, showError }: { showSuccess: (m: string) => void; showError: (m: string) => void }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await adminApi.runSQL(query.trim());
      setResult(data);
      setHistory(h => [query.trim(), ...h.filter(q => q !== query.trim())].slice(0, 20));
      if (data.command !== 'SELECT') showSuccess(`${data.command}: ${data.rowCount} row(s) affected in ${data.duration}ms`);
    } catch (e: any) {
      setResult({ error: e.message });
      showError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> SQL Console</h3>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
          placeholder="Enter SQL query... (Ctrl+Enter to run)"
          className="w-full h-32 bg-transparent text-green-300 font-mono text-sm resize-none focus:outline-none placeholder-gray-600"
          spellCheck={false}
        />
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
          <div className="flex gap-2">
            {history.length > 0 && (
              <select
                onChange={e => { if (e.target.value) setQuery(e.target.value); }}
                className="bg-[#111] text-gray-400 text-xs border border-white/10 rounded-lg px-2 py-1 focus:outline-none max-w-[200px]"
                defaultValue=""
              >
                <option value="" disabled>History ({history.length})</option>
                {history.map((h, i) => <option key={i} value={h}>{h.slice(0, 60)}{h.length > 60 ? '...' : ''}</option>)}
              </select>
            )}
          </div>
          <button
            onClick={run}
            disabled={loading || !query.trim()}
            className="px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
          >
            {loading ? 'Running...' : '▶ Execute'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['SELECT * FROM users LIMIT 10', 'SELECT COUNT(*) FROM users', 'SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC', "SELECT * FROM game_progress WHERE game_id = 'sigma-clicker' ORDER BY updated_at DESC LIMIT 10"].map((q, i) => (
          <button key={i} onClick={() => setQuery(q)} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-500 text-[10px] font-mono transition-colors">
            {q.slice(0, 40)}...
          </button>
        ))}
      </div>

      {result && !result.error && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center">
            <span className="text-[10px] text-gray-500">{result.command} · {result.rowCount} row(s) · {result.duration}ms{result.truncated ? ' · TRUNCATED' : ''}</span>
          </div>
          {result.rows.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10 sticky top-0 bg-[#0a0a0a]">
                  {Object.keys(result.rows[0]).map(k => (
                    <th key={k} className="text-left text-gray-500 px-3 py-2 font-mono whitespace-nowrap">{k}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {result.rows.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="px-3 py-1.5 text-gray-300 font-mono whitespace-nowrap max-w-[300px] truncate">
                          {v === null ? <span className="text-gray-600 italic">NULL</span> : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-3 text-gray-500 text-xs">No rows returned</p>
          )}
        </div>
      )}
      {result?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-xs font-mono">{result.error}</div>
      )}
    </div>
  );
}

function PowerTools({ showSuccess, showError }: { showSuccess: (m: string) => void; showError: (m: string) => void }) {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);
  const [massAction, setMassAction] = useState('ban');
  const [massIds, setMassIds] = useState('');
  const [massValue, setMassValue] = useState('');
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

  useEffect(() => {
    adminApi.getMaintenance().then(d => { setMaintenance(d.maintenance); setMaintenanceLoaded(true); }).catch(() => setMaintenanceLoaded(true));
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await adminApi.broadcast(broadcastMsg.trim());
      showSuccess('System announcement sent');
      setBroadcastMsg('');
    } catch (e: any) { showError(e.message); }
  };

  const toggleMaintenance = async () => {
    try {
      const data = await adminApi.setMaintenance(!maintenance);
      setMaintenance(data.maintenance);
      showSuccess(data.maintenance ? 'Maintenance mode ENABLED — API will return 503' : 'Maintenance mode DISABLED');
    } catch (e: any) { showError(e.message); }
  };

  const handleMassAction = async () => {
    const ids = massIds.split(/[,\s]+/).map(Number).filter(n => n > 0);
    if (ids.length === 0) return showError('Enter valid user IDs');
    try {
      const val = massValue ? (isNaN(Number(massValue)) ? massValue : Number(massValue)) : undefined;
      const data = await adminApi.massAction(massAction, ids, val);
      showSuccess(`${massAction}: ${data.affected} user(s) affected`);
      setMassIds('');
      setMassValue('');
    } catch (e: any) { showError(e.message); }
  };

  const handleClearChat = async () => {
    try {
      const data = await adminApi.clearAllChat();
      showSuccess(`Cleared ${data.deleted} messages from global chat`);
    } catch (e: any) { showError(e.message); }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Power Tools</h3>

      <div className="bg-[#111] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">📢 System Broadcast</p>
        <p className="text-[10px] text-gray-600">Send an announcement to global chat as SYSTEM</p>
        <div className="flex gap-2">
          <input
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
            placeholder="Type system announcement..."
            className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
          />
          <button
            onClick={handleBroadcast}
            disabled={!broadcastMsg.trim()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors disabled:opacity-40"
          >
            📣 Broadcast
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-amber-500/20 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">🚧 Maintenance Mode</p>
        <p className="text-[10px] text-gray-600">When enabled, all API endpoints (except auth & admin) return 503</p>
        <div className="flex items-center gap-4">
          <div className={`text-sm font-bold ${maintenance ? 'text-red-400' : 'text-green-400'}`}>
            {maintenanceLoaded ? (maintenance ? '🔴 ENABLED' : '🟢 DISABLED') : 'Loading...'}
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={!maintenanceLoaded}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              maintenance
                ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-300'
                : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300'
            }`}
          >
            {maintenance ? '✅ Disable Maintenance' : '🚧 Enable Maintenance'}
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">⚡ Mass Actions</p>
        <p className="text-[10px] text-gray-600">Apply bulk actions to multiple users at once (max 100)</p>
        <div className="flex gap-2 flex-wrap">
          <select
            value={massAction}
            onChange={e => setMassAction(e.target.value)}
            className="bg-[#0a0a0a] text-white text-sm border border-white/10 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ban">Ban</option>
            <option value="unban">Unban</option>
            <option value="mute">Mute</option>
            <option value="unmute">Unmute</option>
            <option value="addCoins">Add Coins</option>
            <option value="addXP">Add XP</option>
            <option value="setLevel">Set Level</option>
            <option value="wipeProgress">Wipe Game Progress</option>
          </select>
          <input
            value={massIds}
            onChange={e => setMassIds(e.target.value)}
            placeholder="User IDs (comma separated)"
            className="flex-1 min-w-[180px] px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
          {['addCoins', 'addXP', 'setLevel'].includes(massAction) && (
            <input
              value={massValue}
              onChange={e => setMassValue(e.target.value)}
              placeholder="Value"
              type="number"
              className="w-24 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          )}
          <button
            onClick={handleMassAction}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-colors"
          >
            ⚡ Execute
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-red-500/20 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">💣 Danger Zone</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setConfirm({
              message: 'Delete ALL global chat messages? This cannot be undone.',
              action: async () => { await handleClearChat(); setConfirm(null); }
            })}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors"
          >
            🗑️ Nuke Global Chat
          </button>
        </div>
      </div>

      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.action} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const { state } = useGameContext();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [coinInput, setCoinInput] = useState<Record<number, string>>({});
  const [levelInput, setLevelInput] = useState<Record<number, string>>({});
  const [xpInput, setXpInput] = useState<Record<number, string>>({});
  const [inventoryInput, setInventoryInput] = useState<Record<number, string>>({});
  const [streakInput, setStreakInput] = useState<Record<number, string>>({});
  const [nameColorInput, setNameColorInput] = useState<Record<number, string>>({});
  const [fieldNameInput, setFieldNameInput] = useState<Record<number, string>>({});
  const [fieldValueInput, setFieldValueInput] = useState<Record<number, string>>({});
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [newCode, setNewCode] = useState({ code: '', description: '', coins: '', xp: '', item: '', maxUses: '1' });
  const [badgeSearch, setBadgeSearch] = useState('');
  const [badgeUsers, setBadgeUsers] = useState<UserProfile[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [badgeHolders, setBadgeHolders] = useState<UserProfile[]>([]);
  const [badgeGranting, setBadgeGranting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };
  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const loadUsers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(q || undefined);
      setUsers(data.users);
    } catch (e: any) {
      showError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getGlobalMessages();
      setMessages(data.messages);
    } catch (e: any) {
      showError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCodes();
      setCodes(data.codes);
    } catch (e: any) {
      showError(e.message || 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.code.trim()) return;
    try {
      await adminApi.createCode({
        code: newCode.code.trim(),
        description: newCode.description,
        coins: Number(newCode.coins) || 0,
        xp: Number(newCode.xp) || 0,
        item: newCode.item.trim() || undefined,
        maxUses: Number(newCode.maxUses) || 1,
      });
      showSuccess(`Code "${newCode.code.toUpperCase()}" created!`);
      setNewCode({ code: '', description: '', coins: '', xp: '', item: '', maxUses: '1' });
      loadCodes();
    } catch (e: any) {
      showError(e.message || 'Failed to create code');
    }
  };

  const handleDeleteCode = (id: number, code: string) =>
    doAction(`Delete code "${code}"? This cannot be undone.`, async () => {
      await adminApi.deleteCode(id);
      loadCodes();
    });

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'chat') loadMessages();
    else if (tab === 'codes') loadCodes();
  }, [tab]);

  const doAction = (message: string, action: () => Promise<unknown>) => {
    setConfirm({
      message,
      action: async () => {
        setConfirm(null);
        try {
          await action();
          showSuccess('Done!');
          if (tab === 'users') loadUsers(search || undefined);
          else loadMessages();
        } catch (e: any) {
          showError(e.message || 'Action failed');
        }
      }
    });
  };

  const handleBan = (user: UserProfile) =>
    doAction(`Ban ${user.username}? They will be kicked immediately.`, () => adminApi.banUser(user.id));
  const handleUnban = (user: UserProfile) =>
    doAction(`Unban ${user.username}?`, () => adminApi.unbanUser(user.id));
  const handleMute = (user: UserProfile) =>
    doAction(`Mute ${user.username}? They won't be able to chat.`, () => adminApi.muteUser(user.id));
  const handleUnmute = (user: UserProfile) =>
    doAction(`Unmute ${user.username}?`, () => adminApi.unmuteUser(user.id));
  const handleDeleteMsg = (id: number, username: string) =>
    doAction(`Delete message from ${username}?`, () => adminApi.deleteGlobalMessage(id));

  const handleAddCoins = async (user: UserProfile) => {
    const val = Number(coinInput[user.id]);
    if (!val || isNaN(val)) return;
    try {
      await adminApi.addCoins(user.id, val);
      showSuccess(`Added ${val} coins to ${user.username}`);
      setCoinInput(c => ({ ...c, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleSetLevel = async (user: UserProfile) => {
    const val = Number(levelInput[user.id]);
    if (!val || isNaN(val) || val < 1) return;
    try {
      await adminApi.setLevel(user.id, val);
      showSuccess(`Set ${user.username} to level ${val}`);
      setLevelInput(l => ({ ...l, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleAddXp = async (user: UserProfile) => {
    const val = Number(xpInput[user.id]);
    if (!val || isNaN(val)) return;
    try {
      await adminApi.addXp(user.id, val);
      showSuccess(`Added ${val} XP to ${user.username}`);
      setXpInput(x => ({ ...x, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleAddInventory = async (user: UserProfile) => {
    const item = inventoryInput[user.id]?.trim();
    if (!item) return;
    try {
      await adminApi.addInventoryItem(user.id, item);
      showSuccess(`Added "${item}" to ${user.username}'s inventory`);
      setInventoryInput(i => ({ ...i, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleRemoveInventory = (user: UserProfile, item: string) =>
    doAction(`Remove "${item}" from ${user.username}'s inventory?`, async () => {
      await adminApi.removeInventoryItem(user.id, item);
      loadUsers(search || undefined);
    });

  const handleSetStreak = async (user: UserProfile) => {
    const val = Number(streakInput[user.id]);
    if (isNaN(val) || val < 0) return;
    try {
      await adminApi.setStreak(user.id, val);
      showSuccess(`Set ${user.username}'s streak to ${val}`);
      setStreakInput(s => ({ ...s, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleSetNameColor = async (user: UserProfile) => {
    const color = nameColorInput[user.id]?.trim();
    if (!color) return;
    try {
      await adminApi.setNameColor(user.id, color);
      showSuccess(`Set ${user.username}'s name color to ${color}`);
      setNameColorInput(c => ({ ...c, [user.id]: '' }));
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const searchBadgeUsers = async (q: string) => {
    if (!q.trim()) { setBadgeUsers([]); return; }
    try {
      const data = await adminApi.getUsers(q);
      setBadgeUsers(data.users);
    } catch (e: any) {
      showError(e.message || 'Search failed');
    }
  };

  const loadBadgeHolders = async (badgeId: string) => {
    try {
      const data = await adminApi.getBadgeHolders(badgeId);
      setBadgeHolders(data.users);
    } catch (e: any) {
      showError(e.message || 'Failed to load badge holders');
    }
  };

  const handleGrantBadge = async (userId: number, username: string, badgeId: string) => {
    setBadgeGranting(true);
    try {
      await adminApi.grantBadge(userId, badgeId);
      showSuccess(`Granted "${badgeId}" to ${username}`);
      if (selectedBadge) loadBadgeHolders(selectedBadge);
      searchBadgeUsers(badgeSearch);
    } catch (e: any) {
      showError(e.message || 'Failed to grant badge');
    } finally {
      setBadgeGranting(false);
    }
  };

  const handleRevokeBadge = async (userId: number, username: string, badgeId: string) => {
    setBadgeGranting(true);
    try {
      await adminApi.revokeBadge(userId, badgeId);
      showSuccess(`Revoked "${badgeId}" from ${username}`);
      if (selectedBadge) loadBadgeHolders(selectedBadge);
      if (badgeSearch) searchBadgeUsers(badgeSearch);
    } catch (e: any) {
      showError(e.message || 'Failed to revoke badge');
    } finally {
      setBadgeGranting(false);
    }
  };

  const handleSetBorder = async (user: UserProfile, border: string) => {
    try {
      await adminApi.setBorder(user.id, border);
      showSuccess(`Set ${user.username}'s border to "${border}"`);
      loadUsers(search || undefined);
    } catch (e: any) {
      showError(e.message || 'Failed');
    }
  };

  const handleSetRole = (user: UserProfile, role: 'admin' | 'owner' | 'none') =>
    doAction(`Set ${user.username}'s role to "${role}"? They will be signed out.`, () => adminApi.setRole(user.id, role));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
      >
        <div className="bg-[#141414] border border-red-500/20 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-900/20 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-red-500/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-red-400/70">{state.isOwner ? 'Owner' : 'Admin'} · Use responsibly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-1 px-6 pt-4 flex-shrink-0 flex-wrap">
            {([
              ['users', <Users key="u" className="w-4 h-4" />, 'Users'],
              ['chat', <MessageCircle key="c" className="w-4 h-4" />, 'Global Chat'],
              ['codes', <Key key="k" className="w-4 h-4" />, 'Redeem Codes'],
              ['badges', <Star key="b" className="w-4 h-4" />, 'Badges'],
              ...(state.isOwner ? [
                ['dms' as const, <Shield key="d" className="w-4 h-4" />, 'All DMs'] as const,
                ['traffic' as const, <Activity key="t" className="w-4 h-4" />, 'Traffic'] as const,
                ['stats' as const, <Eye key="s" className="w-4 h-4" />, 'Server Stats'] as const,
                ['sql' as const, <Zap key="q" className="w-4 h-4" />, 'SQL Console'] as const,
                ['tools' as const, <AlertTriangle key="tl" className="w-4 h-4" />, 'Power Tools'] as const,
              ] : []),
            ] as const).map(([t, icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {(success || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mx-6 mt-3 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 ${success ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
              >
                {success || error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'users' && (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loadUsers(search || undefined)}
                      placeholder="Search by username or email..."
                      className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => loadUsers(search || undefined)}
                    className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Search
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12 text-gray-500">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="flex justify-center py-12 text-gray-500">No users found</div>
                ) : (
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-violet-600/40 flex items-center justify-center text-xs font-bold text-violet-200 flex-shrink-0">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-white truncate" style={{ color: user.name_color || '#fff' }}>
                                {user.username}
                              </span>
                              {user.is_owner && <Badge label="OWNER" color="bg-yellow-500/20 text-yellow-400" />}
                              {user.is_admin && !user.is_owner && <Badge label="ADMIN" color="bg-blue-500/20 text-blue-400" />}
                              {user.is_banned && <Badge label="BANNED" color="bg-red-500/20 text-red-400" />}
                              {user.is_muted && <Badge label="MUTED" color="bg-orange-500/20 text-orange-400" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                            <span className="text-blue-400 font-medium">Lv.{user.level}</span>
                            <span className="text-yellow-400 font-medium">{user.coins?.toLocaleString()} c</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => user.is_muted ? handleUnmute(user) : handleMute(user)}
                              title={user.is_muted ? 'Unmute' : 'Mute'}
                              className={`p-1.5 rounded-lg transition-colors ${user.is_muted ? 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20' : 'text-gray-500 hover:text-orange-400 hover:bg-orange-500/10'}`}
                            >
                              {user.is_muted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => user.is_banned ? handleUnban(user) : handleBan(user)}
                              title={user.is_banned ? 'Unban' : 'Ban'}
                              className={`p-1.5 rounded-lg transition-colors ${user.is_banned ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedUser === user.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 px-4 pb-4 pt-3 overflow-hidden"
                            >
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={coinInput[user.id] || ''}
                                    onChange={e => setCoinInput(c => ({ ...c, [user.id]: e.target.value }))}
                                    placeholder="Amount"
                                    className="w-24 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500/50"
                                  />
                                  <button
                                    onClick={() => handleAddCoins(user)}
                                    className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Coins className="w-3 h-3" /> Add Coins
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={levelInput[user.id] || ''}
                                    onChange={e => setLevelInput(l => ({ ...l, [user.id]: e.target.value }))}
                                    placeholder="Level"
                                    className="w-20 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500/50"
                                  />
                                  <button
                                    onClick={() => handleSetLevel(user)}
                                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Zap className="w-3 h-3" /> Set Level
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={xpInput[user.id] || ''}
                                    onChange={e => setXpInput(x => ({ ...x, [user.id]: e.target.value }))}
                                    placeholder="XP amount"
                                    className="w-24 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-green-500/50"
                                  />
                                  <button
                                    onClick={() => handleAddXp(user)}
                                    className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Star className="w-3 h-3" /> Add XP
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <select
                                    value={inventoryInput[user.id] || ''}
                                    onChange={e => setInventoryInput(i => ({ ...i, [user.id]: e.target.value }))}
                                    className="w-56 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500/50 appearance-none"
                                  >
                                    <option value="" disabled>Select item to grant...</option>
                                    {STORE_ITEMS.map(item => {
                                      const owned = (user as any).inventory?.includes(item.id);
                                      return (
                                        <option key={item.id} value={item.id} disabled={owned}>
                                          {item.id} — {item.name}{owned ? ' ✓' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    onClick={() => handleAddInventory(user)}
                                    disabled={!inventoryInput[user.id]}
                                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                  >
                                    <Plus className="w-3 h-3" /> Grant Item
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={streakInput[user.id] || ''}
                                    onChange={e => setStreakInput(s => ({ ...s, [user.id]: e.target.value }))}
                                    placeholder={`Streak: ${(user as any).streak || 0}`}
                                    className="w-28 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500/50"
                                  />
                                  <button
                                    onClick={() => handleSetStreak(user)}
                                    className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                  >
                                    🔥 Set Streak
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={nameColorInput[user.id] || ''}
                                    onChange={e => setNameColorInput(c => ({ ...c, [user.id]: e.target.value }))}
                                    placeholder={user.name_color || '#ffffff'}
                                    className="w-28 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-pink-500/50"
                                  />
                                  <button
                                    onClick={() => handleSetNameColor(user)}
                                    className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-lg text-pink-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                  >
                                    🎨 Set Color
                                  </button>
                                  {user.name_color && user.name_color !== '#ffffff' && (
                                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: user.name_color }} />
                                  )}
                                </div>

                                {state.isOwner && !user.is_owner && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      onClick={() => handleSetRole(user, user.is_admin ? 'none' : 'admin')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border ${user.is_admin ? 'bg-blue-500/10 hover:bg-red-500/20 border-blue-500/30 text-blue-300 hover:text-red-300 hover:border-red-500/30' : 'bg-white/5 hover:bg-blue-500/20 border-white/10 text-gray-400 hover:text-blue-300 hover:border-blue-500/30'}`}
                                    >
                                      <Shield className="w-3 h-3" />
                                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                    <button
                                      onClick={() => handleSetRole(user, 'owner')}
                                      className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                      <Crown className="w-3 h-3" /> Make Owner
                                    </button>
                                  </div>
                                )}
                                {state.isOwner && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await adminApi.resetRanked(user.id, 'sigma-clicker');
                                          showSuccess(`Ranked reset for ${user.username}`);
                                        } catch (e: any) { showError(e.message); }
                                      }}
                                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                      <RefreshCw className="w-3 h-3" /> Reset Ranked
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const data = await adminApi.forceLogout(user.id);
                                          showSuccess(`Force logged out ${user.username} (${data.sessionsCleared} sessions cleared)`);
                                        } catch (e: any) { showError(e.message); }
                                      }}
                                      className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                      <Ban className="w-3 h-3" /> Force Logout
                                    </button>
                                    {!user.is_owner && (
                                      <button
                                        onClick={() => setConfirm({
                                          message: `Permanently delete user "${user.username}"? This cannot be undone.`,
                                          action: async () => {
                                            try {
                                              await adminApi.deleteUser(user.id);
                                              showSuccess(`Deleted user ${user.username}`);
                                              loadUsers(search);
                                            } catch (e: any) { showError(e.message); }
                                            setConfirm(null);
                                          }
                                        })}
                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete User
                                      </button>
                                    )}
                                  </div>
                                )}
                                {state.isOwner && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                      type="text"
                                      value={fieldNameInput[user.id] || ''}
                                      onChange={e => setFieldNameInput(s => ({ ...s, [user.id]: e.target.value }))}
                                      placeholder="Field name"
                                      className="w-24 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500/50"
                                    />
                                    <input
                                      type="text"
                                      value={fieldValueInput[user.id] || ''}
                                      onChange={e => setFieldValueInput(s => ({ ...s, [user.id]: e.target.value }))}
                                      placeholder="Value"
                                      className="w-28 px-2 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500/50"
                                    />
                                    <button
                                      onClick={async () => {
                                        const field = fieldNameInput[user.id]?.trim();
                                        const raw = fieldValueInput[user.id]?.trim();
                                        if (!field || !raw) return showError('Field name and value required');
                                        let value: any = raw;
                                        if (raw === 'true') value = true;
                                        else if (raw === 'false') value = false;
                                        else if (raw === 'null') value = null;
                                        else if (!isNaN(Number(raw))) value = Number(raw);
                                        try {
                                          await adminApi.setUserField(user.id, field, value);
                                          showSuccess(`Set ${field} = ${raw} for ${user.username}`);
                                          setFieldNameInput(s => ({ ...s, [user.id]: '' }));
                                          setFieldValueInput(s => ({ ...s, [user.id]: '' }));
                                          loadUsers(search);
                                        } catch (e: any) { showError(e.message); }
                                      }}
                                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                      <Key className="w-3 h-3" /> Set Field
                                    </button>
                                  </div>
                                )}
                              </div>

                              {(user as any).inventory && (user as any).inventory.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><PackageOpen className="w-3 h-3" /> Inventory ({(user as any).inventory.length} items)</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(user as any).inventory.map((item: string) => (
                                      <span key={item} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5">
                                        {item}
                                        <button
                                          onClick={() => handleRemoveInventory(user, item)}
                                          className="text-gray-600 hover:text-red-400 transition-colors ml-0.5"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(user as any).active_border && (user as any).active_border !== 'default' && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Hexagon className="w-3 h-3" /> Active border: <span className="text-purple-300">{(user as any).active_border}</span>
                                    <button
                                      onClick={() => handleSetBorder(user, 'default')}
                                      className="text-[10px] text-gray-600 hover:text-red-400 ml-1 transition-colors"
                                    >
                                      (reset)
                                    </button>
                                  </p>
                                </div>
                              )}

                              {state.isOwner && (
                                <SigmaProgressEditor userId={user.id} username={user.username} />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'chat' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-400">Recent global chat messages (newest first)</p>
                  <button
                    onClick={loadMessages}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12 text-gray-500">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center py-12 text-gray-500">No messages yet</div>
                ) : (
                  <div className="space-y-2">
                    {messages.map(msg => (
                      <div key={msg.id} className="flex items-start gap-3 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-violet-600/40 flex items-center justify-center text-xs font-bold text-violet-200 flex-shrink-0 mt-0.5">
                          {(msg.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-white">{msg.username || 'Deleted User'}</span>
                            {msg.is_owner && <Badge label="OWNER" color="bg-yellow-500/20 text-yellow-400" />}
                            {msg.is_admin && !msg.is_owner && <Badge label="ADMIN" color="bg-blue-500/20 text-blue-400" />}
                            <span className="text-xs text-gray-600">{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-300 break-words">{msg.content || msg.message}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMsg(msg.id, msg.username || 'unknown')}
                          title="Delete message"
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'codes' && (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-400" /> Create New Code
                  </h3>
                  <form onSubmit={handleCreateCode} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[11px] text-gray-500 mb-1 block">Code *</label>
                        <input
                          type="text"
                          value={newCode.code}
                          onChange={e => setNewCode(c => ({ ...c, code: e.target.value }))}
                          placeholder="e.g. SUMMER2024"
                          required
                          className="w-full px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 uppercase"
                        />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="text-[11px] text-gray-500 mb-1 block">Description</label>
                        <input
                          type="text"
                          value={newCode.description}
                          onChange={e => setNewCode(c => ({ ...c, description: e.target.value }))}
                          placeholder="e.g. Summer event code"
                          className="w-full px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <div>
                        <label className="text-[11px] text-gray-500 mb-1 block">Coins</label>
                        <input
                          type="number"
                          min="0"
                          value={newCode.coins}
                          onChange={e => setNewCode(c => ({ ...c, coins: e.target.value }))}
                          placeholder="0"
                          className="w-24 px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 mb-1 block">XP</label>
                        <input
                          type="number"
                          min="0"
                          value={newCode.xp}
                          onChange={e => setNewCode(c => ({ ...c, xp: e.target.value }))}
                          placeholder="0"
                          className="w-24 px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[11px] text-gray-500 mb-1 block">Item ID (optional)</label>
                        <input
                          type="text"
                          value={newCode.item}
                          onChange={e => setNewCode(c => ({ ...c, item: e.target.value }))}
                          placeholder="e.g. border-flame"
                          className="w-full px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 mb-1 block">Max Uses</label>
                        <input
                          type="number"
                          min="1"
                          value={newCode.maxUses}
                          onChange={e => setNewCode(c => ({ ...c, maxUses: e.target.value }))}
                          className="w-20 px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-green-300 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Create Code
                    </button>
                  </form>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-red-400" /> Active Codes ({codes.length})
                  </h3>
                  <button onClick={loadCodes} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8 text-gray-500">Loading...</div>
                ) : codes.length === 0 ? (
                  <div className="flex justify-center py-8 text-gray-500">No codes yet. Create one above.</div>
                ) : (
                  <div className="space-y-2">
                    {codes.map(code => (
                      <div key={code.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-green-300 text-sm">{code.code}</span>
                            {code.description && <span className="text-xs text-gray-500">{code.description}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {code.coins > 0 && <span className="text-xs text-yellow-400">+{code.coins.toLocaleString()} coins</span>}
                            {code.xp > 0 && <span className="text-xs text-green-400">+{code.xp.toLocaleString()} XP</span>}
                            {code.item && <span className="text-xs text-purple-400">Item: {code.item}</span>}
                            <span className="text-xs text-gray-600">{code.uses}/{code.max_uses} uses</span>
                            {code.creator_username && <span className="text-xs text-gray-600">by {code.creator_username}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`text-[10px] px-2 py-1 rounded-full ${code.uses >= code.max_uses ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {code.uses >= code.max_uses ? 'Expired' : 'Active'}
                          </div>
                          <button
                            onClick={() => handleDeleteCode(code.id, code.code)}
                            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'badges' && (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-400" /> Grant Badge to Player
                  </h3>
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={badgeSearch}
                          onChange={e => setBadgeSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && searchBadgeUsers(badgeSearch)}
                          placeholder="Search user by name or email..."
                          className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => searchBadgeUsers(badgeSearch)}
                        className="px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-green-300 text-sm font-medium transition-colors"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>

                    {badgeUsers.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {badgeUsers.map(user => (
                          <div key={user.id} className="bg-[#111] border border-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-7 h-7 rounded-full bg-violet-600/40 flex items-center justify-center text-xs font-bold text-violet-200 flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-white" style={{ color: user.name_color || '#fff' }}>{user.username}</span>
                                <p className="text-[10px] text-gray-500">Lv.{user.level} · {(user.inventory || []).filter(i => i.startsWith('badge-')).length} badges</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_BADGES.map(b => {
                                const hasBadge = (user.inventory || []).includes(b.id) || (user.displayed_badges || []).includes(b.id);
                                return (
                                  <button
                                    key={b.id}
                                    onClick={() => hasBadge ? handleRevokeBadge(user.id, user.username, b.id) : handleGrantBadge(user.id, user.username, b.id)}
                                    disabled={badgeGranting}
                                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all ${hasBadge
                                      ? `${b.color} bg-white/10 border border-white/20 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300`
                                      : 'text-gray-500 bg-white/[0.02] border border-white/5 hover:bg-green-500/20 hover:border-green-500/30 hover:text-green-300'
                                    }`}
                                    title={hasBadge ? `Revoke ${b.name}` : `Grant ${b.name}`}
                                  >
                                    {hasBadge ? '✓ ' : '+ '}{b.icon.startsWith('/') ? '' : b.icon + ' '}{b.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {badgeSearch && badgeUsers.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-3">No users found. Try a different search.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" /> All Badges
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_BADGES.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBadge(selectedBadge === b.id ? null : b.id); if (selectedBadge !== b.id) loadBadgeHolders(b.id); }}
                        className={`flex items-center gap-3 bg-[#111] border rounded-xl px-3 py-2.5 text-left transition-colors ${selectedBadge === b.id ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'}`}
                      >
                        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                          {b.icon.startsWith('/') ? <img src={b.icon} alt={b.name} className="w-5 h-5 object-contain" /> : <span className="text-base">{b.icon}</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-bold ${b.color}`}>{b.name}</span>
                          <p className="text-[10px] text-gray-500">{b.desc}</p>
                          <p className="text-[10px] text-gray-600 font-mono">{b.id}</p>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${selectedBadge === b.id ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedBadge && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          Players with "{ALL_BADGES.find(b => b.id === selectedBadge)?.name}"
                        </h4>
                        <button onClick={() => loadBadgeHolders(selectedBadge)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {badgeHolders.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No players have this badge yet</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {badgeHolders.map(u => (
                            <div key={u.id} className="flex items-center gap-3 bg-[#111] border border-white/5 rounded-lg px-3 py-2">
                              <div className="w-6 h-6 rounded-full bg-violet-600/40 flex items-center justify-center text-[10px] font-bold text-violet-200 flex-shrink-0">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-white flex-1" style={{ color: u.name_color || '#fff' }}>{u.username}</span>
                              <span className="text-xs text-gray-500">Lv.{u.level}</span>
                              <button
                                onClick={() => handleRevokeBadge(u.id, u.username, selectedBadge)}
                                disabled={badgeGranting}
                                className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors font-medium"
                              >
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-red-400" /> Admin/Owner Access Codes
                  </h3>
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4">
                    <p className="text-gray-400 text-sm mb-3">To grant admin or owner access, create a redeem code in the Codes tab with these special item IDs:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-[#111] border border-blue-500/20 rounded-lg px-3 py-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-300 font-bold">Admin Access</span>
                        <span className="text-xs text-gray-500">Item ID:</span>
                        <span className="font-mono text-xs text-blue-400">__grant_admin</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#111] border border-yellow-500/20 rounded-lg px-3 py-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-300 font-bold">Owner Access</span>
                        <span className="text-xs text-gray-500">Item ID:</span>
                        <span className="font-mono text-xs text-yellow-400">__grant_owner</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'dms' && state.isOwner && (
              <OwnerDMBrowser />
            )}

            {tab === 'traffic' && state.isOwner && (
              <TrafficMonitor />
            )}

            {tab === 'stats' && state.isOwner && (
              <ServerStatsPanel showSuccess={showSuccess} showError={showError} />
            )}

            {tab === 'sql' && state.isOwner && (
              <SQLConsole showSuccess={showSuccess} showError={showError} />
            )}

            {tab === 'tools' && state.isOwner && (
              <PowerTools showSuccess={showSuccess} showError={showError} />
            )}
          </div>
        </div>
      </motion.div>

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
