import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Volume2, VolumeX, Download, Upload } from 'lucide-react';
import { progressApi, socialApi } from '../api/client';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

const GAME_ID = 'sigma-clicker';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicRunning = false;
  muted = false;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.08;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.15;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playClick() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(g).connect(this.sfxGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playBuy() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(g).connect(this.sfxGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  playOrb() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
  }

  playCritical() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [600, 900, 1200, 1600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.15);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + i * 0.04 + 0.15);
    });
  }

  playChestOpen() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [392, 523, 659, 784, 1046].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.25);
    });
  }

  playCombo() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(g).connect(this.sfxGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  playRebirth() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [261, 329, 392, 523, 659, 784, 1046].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  }

  playPuzzleWin() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  }

  playPuzzleFail() {
    if (this.muted) return;
    const ctx = this.getCtx();
    [300, 200].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
      osc.connect(g).connect(this.sfxGain!);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  }

  startMusic() {
    if (this.musicRunning || this.muted) return;
    const ctx = this.getCtx();
    this.musicRunning = true;
    const notes = [261, 293, 329, 349, 392, 349, 329, 293];
    let noteIdx = 0;
    const playNote = () => {
      if (!this.musicRunning || this.muted) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[noteIdx % notes.length] * 0.5;
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(g).connect(this.musicGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      const bass = ctx.createOscillator();
      const bg = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = notes[noteIdx % notes.length] * 0.25;
      bg.gain.setValueAtTime(0.04, ctx.currentTime);
      bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      bass.connect(bg).connect(this.musicGain!);
      bass.start(ctx.currentTime);
      bass.stop(ctx.currentTime + 0.9);
      noteIdx++;
      setTimeout(playNote, 900);
    };
    playNote();
  }

  stopMusic() {
    this.musicRunning = false;
  }

  toggle() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return !this.muted;
  }
}

const soundEngine = new SoundEngine();

const NUM_SUFFIXES: [number, string][] = [
  [1e36, 'Ud'], [1e33, 'Dc'], [1e30, 'No'], [1e27, 'Oc'],
  [1e24, 'Sp'], [1e21, 'Sx'], [1e18, 'Qi'], [1e15, 'Qa'],
  [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'],
];
const formatNum = (n: number): string => {
  for (const [threshold, suffix] of NUM_SUFFIXES) {
    if (n >= threshold) return (n / threshold).toFixed(1) + suffix;
  }
  return Math.floor(n).toLocaleString();
};

interface ClickUpgrade {
  id: string;
  name: string;
  value: number;
  baseCost: number;
  growthFactor: number;
  icon: string;
  desc: string;
  minRebirths?: number;
}

interface IdleUpgrade {
  id: string;
  name: string;
  value: number;
  baseCost: number;
  growthFactor: number;
  icon: string;
  desc: string;
  minRebirths?: number;
}

const MILESTONE_LEVELS = [25, 50, 100, 250, 500];
const getMilestoneMultiplier = (level: number) => {
  let mult = 1;
  for (const m of MILESTONE_LEVELS) {
    if (level >= m) mult *= 2;
  }
  return mult;
};

const CLICK_UPGRADES: ClickUpgrade[] = [
  { id: 'mewing', name: 'Mewing Streak', value: 1, baseCost: 15, growthFactor: 1.18, icon: '🤫', desc: '+1 per click' },
  { id: 'jawline', name: 'Jawline Gum', value: 4, baseCost: 250, growthFactor: 1.18, icon: '💪', desc: '+4 per click' },
  { id: 'bonesmash', name: 'Bone Smashing', value: 12, baseCost: 5000, growthFactor: 1.18, icon: '💀', desc: '+12 per click' },
  { id: 'looksmax', name: 'Looksmaxxing Guide', value: 40, baseCost: 100000, growthFactor: 1.28, icon: '📖', desc: '+40 per click' },
  { id: 'mogging', name: 'Mogging the Room', value: 150, baseCost: 1500000, growthFactor: 1.25, icon: '🗿', desc: '+150 per click' },
  { id: 'sigma-aura', name: 'Sigma Aura Field', value: 600, baseCost: 25000000, growthFactor: 1.25, icon: '✨', desc: '+600 per click' },
  { id: 'reality-warp', name: 'Reality Warp', value: 2500, baseCost: 500000000, growthFactor: 1.35, icon: '🌀', desc: '+2500 per click' },
  { id: 'universe-mog', name: 'Universe Mog', value: 12000, baseCost: 15000000000, growthFactor: 1.35, icon: '🌌', desc: '+12000 per click' },
  { id: 'jawline-gum', name: 'Jawline Gum', value: 35000, baseCost: 5e11, growthFactor: 1.30, icon: '/upgrade-gum.png', desc: 'Razor-sharp jaw. +35K SPC', minRebirths: 3 },
  { id: 'guasha', name: 'Gua Sha Stone', value: 100000, baseCost: 2e12, growthFactor: 1.30, icon: '/upgrade-guasha.png', desc: 'Scraping away the weakness. +100K SPC', minRebirths: 4 },
  { id: 'mewing2', name: 'Mewing Streak II', value: 300000, baseCost: 8e12, growthFactor: 1.32, icon: '/upgrade-mewing.png', desc: 'Tongue on the roof. +300K SPC', minRebirths: 5 },
  { id: 'hunter-eyes', name: 'Hunter Eyes', value: 1000000, baseCost: 5e13, growthFactor: 1.32, icon: '/upgrade-huntereyes.png', desc: 'Positive canthal tilt. +1M SPC', minRebirths: 6 },
  { id: 'bonesmash2', name: 'Bone Smashing Hammer', value: 3500000, baseCost: 3e14, growthFactor: 1.34, icon: '/upgrade-hammer.png', desc: 'Extreme results. +3.5M SPC', minRebirths: 8 },
  { id: 'skincare', name: "Dermatologist's Secret", value: 12000000, baseCost: 2e15, growthFactor: 1.34, icon: '/upgrade-skincare.png', desc: 'Inner Sigma glow. +12M SPC', minRebirths: 10 },
  { id: 'mogging-aura', name: 'Mogging Aura', value: 50000000, baseCost: 1.5e16, growthFactor: 1.36, icon: '/upgrade-mogging.png', desc: "Everyone's aura drops. +50M SPC", minRebirths: 13 },
  { id: 'golden-ratio', name: 'The Golden Ratio', value: 250000000, baseCost: 1e17, growthFactor: 1.36, icon: '/upgrade-goldenratio.png', desc: 'Perfect symmetry. +250M SPC', minRebirths: 16 },
  { id: 'ego-expansion', name: 'Ego Expansion', value: 1000000000, baseCost: 8e17, growthFactor: 1.38, icon: '/upgrade-galaxy.png', desc: 'Main character energy. +1B SPC', minRebirths: 20 },
];

const IDLE_UPGRADES: IdleUpgrade[] = [
  { id: 'gym', name: 'Gym Membership', value: 1, baseCost: 100, growthFactor: 1.18, icon: '🏋️', desc: '+1 per sec' },
  { id: 'creatine', name: 'Creatine Scoop', value: 5, baseCost: 1500, growthFactor: 1.18, icon: '🥤', desc: '+5 per sec' },
  { id: 'tren', name: 'Trenbologna Sandwiches', value: 18, baseCost: 30000, growthFactor: 1.18, icon: '🥪', desc: '+18 per sec' },
  { id: 'sleep', name: 'Sleepmaxxing', value: 65, baseCost: 600000, growthFactor: 1.28, icon: '😴', desc: '+65 per sec' },
  { id: 'gigachad', name: 'Giga-Chad Mentor', value: 250, baseCost: 8000000, growthFactor: 1.25, icon: '👑', desc: '+250 per sec' },
  { id: 'sigma-factory', name: 'Sigma Factory', value: 1000, baseCost: 100000000, growthFactor: 1.25, icon: '🏭', desc: '+1000 per sec' },
  { id: 'enlightenment', name: 'Enlightenment', value: 5000, baseCost: 2000000000, growthFactor: 1.35, icon: '🧘', desc: '+5000 per sec' },
  { id: 'transcendence', name: 'Transcendence', value: 25000, baseCost: 50000000000, growthFactor: 1.35, icon: '🌠', desc: '+25000 per sec' },
  { id: 'protein', name: 'Protein Scoop', value: 75000, baseCost: 8e11, growthFactor: 1.30, icon: '/upgrade-protein.png', desc: 'Dry scooping to the top. +75K CPS', minRebirths: 3 },
  { id: 'raw-egg', name: 'Raw Egg Diet', value: 200000, baseCost: 3e12, growthFactor: 1.30, icon: '/upgrade-raw-egg.png', desc: 'Drinking them like Rocky. +200K CPS', minRebirths: 4 },
  { id: 'gym2', name: 'Planet Fitness Membership', value: 600000, baseCost: 1.2e13, growthFactor: 1.32, icon: '/upgrade-gym-card.png', desc: "Lunk alarm included. +600K CPS", minRebirths: 5 },
  { id: 'alarm', name: '4:00 AM Alarm Clock', value: 2000000, baseCost: 8e13, growthFactor: 1.32, icon: '/upgrade-alarm.png', desc: 'Before the competition sleeps. +2M CPS', minRebirths: 6 },
  { id: 'icebath', name: 'Ice Bath Plunge', value: 7000000, baseCost: 5e14, growthFactor: 1.34, icon: '/upgrade-dumbbells.png', desc: 'Maximizing dopamine. +7M CPS', minRebirths: 8 },
  { id: 'tren2', name: 'Trenbologna Sandwich', value: 25000000, baseCost: 3e15, growthFactor: 1.34, icon: '/upgrade-trenbologna.png', desc: 'Forbidden gym snack. +25M CPS', minRebirths: 10 },
  { id: 'gigachad2', name: 'Giga-Chad Mentor II', value: 100000000, baseCost: 2e16, growthFactor: 1.36, icon: '/upgrade-trophy.png', desc: 'Training under the legend. +100M CPS', minRebirths: 13 },
  { id: 'cryochamber', name: 'Cryotherapy Chamber', value: 500000000, baseCost: 1.5e17, growthFactor: 1.36, icon: '/upgrade-cryochamber.png', desc: 'Liquid nitrogen recovery. +500M CPS', minRebirths: 16 },
  { id: 'podcast', name: 'Podcast Microphone', value: 2000000000, baseCost: 1e18, growthFactor: 1.38, icon: '/upgrade-microphone.png', desc: 'Grindset reaches millions. +2B CPS', minRebirths: 20 },
];

interface PrestigeUpgradeData {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  maxLevel: number;
}

const PRESTIGE_UPGRADES: PrestigeUpgradeData[] = [
  { id: 'critChance', name: 'Sigma Instinct', desc: '+5% critical hit chance per level (crits deal 5x)', icon: '🎯', cost: 1, maxLevel: 10 },
  { id: 'comboExtend', name: 'Combo Momentum', desc: '+0.5s combo window per level & +10% combo bonus', icon: '🔥', cost: 1, maxLevel: 10 },
  { id: 'orbFrequency', name: 'Orb Attractor', desc: 'Alpha Orbs spawn 15% faster & +20% value per level', icon: '🧲', cost: 1, maxLevel: 10 },
  { id: 'costReduction', name: 'Bargain Sigma', desc: '-10% upgrade costs per level (max 50%)', icon: '💸', cost: 2, maxLevel: 5 },
  { id: 'auraBoost', name: 'Legacy Aura', desc: '+1.0 bonus to aura multiplier per level', icon: '💜', cost: 2, maxLevel: 15 },
  { id: 'orbBonus', name: 'Orb Magnet', desc: '+100% Alpha Orb bonus value per level', icon: '⚡', cost: 2, maxLevel: 5 },
];

interface SynergyUpgradeData {
  id: string;
  name: string;
  desc: string;
  icon: string;
  baseCost: number;
  maxLevel: number;
  effect: (level: number) => number;
}

const SYNERGY_UPGRADES: SynergyUpgradeData[] = [
  { id: 'mew-jaw', name: 'Mewing + Jawline Sync', desc: 'Mewing makes Jawline Gum 10% more effective per level', icon: '🔗', baseCost: 50000, maxLevel: 10, effect: (l) => 1 + l * 0.1 },
  { id: 'gym-sleep', name: 'Gym + Sleepmaxxing Sync', desc: 'Gym makes Sleepmaxxing 8% more effective per level', icon: '💤', baseCost: 200000, maxLevel: 10, effect: (l) => 1 + l * 0.08 },
  { id: 'click-idle', name: 'Click-Idle Harmony', desc: 'Click upgrades boost idle income by 5% per level', icon: '⚡', baseCost: 500000, maxLevel: 15, effect: (l) => 1 + l * 0.05 },
  { id: 'idle-click', name: 'Idle-Click Harmony', desc: 'Idle upgrades boost click power by 5% per level', icon: '🔄', baseCost: 500000, maxLevel: 15, effect: (l) => 1 + l * 0.05 },
  { id: 'global-mult', name: 'Global Sigma Amplifier', desc: 'All income sources +8% per level', icon: '🌍', baseCost: 1000000, maxLevel: 20, effect: (l) => 1 + l * 0.08 },
];

const GLOBAL_MULT_COST_BASE = 500000;
const GLOBAL_MULT_MAX = 25;

const getPrestigeThreshold = (rebirths: number): number => {
  if (rebirths <= 0) return 5e7;
  if (rebirths === 1) return 5e8;
  if (rebirths === 2) return 5e9;
  if (rebirths === 3) return 5e10;
  return 5e10 * Math.pow(3, rebirths - 3);
};

const getPrestigeMultiplier = (rebirths: number): number => {
  if (rebirths <= 0) return 1;
  if (rebirths === 1) return 2;
  if (rebirths === 2) return 3.5;
  if (rebirths === 3) return 6;
  return 6 * Math.pow(1.35, rebirths - 3);
};

const getRebirthCostScale = (rebirths: number, minRebirths: number = 0): number => {
  const effective = Math.max(0, rebirths - minRebirths);
  if (effective <= 0) return 1;
  return Math.pow(1.8, effective);
};

const PUZZLE_REWARDS_DATA = [
  { id: 'puzzle_2x', nameKey: 'sc.pr.brain2x.name', mult: 2, descKey: 'sc.pr.brain2x.desc', icon: '🧠' },
  { id: 'puzzle_3x', nameKey: 'sc.pr.sigma3x.name', mult: 3, descKey: 'sc.pr.sigma3x.desc', icon: '👁️' },
  { id: 'puzzle_5x', nameKey: 'sc.pr.ascend5x.name', mult: 5, descKey: 'sc.pr.ascend5x.desc', icon: '🌟' },
];

type Tab = 'upgrades' | 'puzzles' | 'rebirth' | 'credits' | 'stats' | 'leaderboard' | 'inventory' | 'synergy';

type CosmeticCategory = 'title' | 'border' | 'badge';

interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cssClass?: string;
  icon?: string;
  check: (gs: GameState) => boolean;
  howToUnlock: string;
}

const getUnlockedUpgradeIds = (gs: GameState) => ({
  click: CLICK_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => u.id),
  idle: IDLE_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => u.id),
});

export const MASTERY_TITLES: CosmeticItem[] = [
  { id: 'title-sigma-perfectionist', name: 'Sigma Perfectionist', category: 'title', description: 'Bought every available upgrade at least once', rarity: 'legendary', cssClass: 'sc-title-rainbow', icon: '🏆', check: gs => { const ids = getUnlockedUpgradeIds(gs); return ids.click.every(id => (gs.ownedClick[id] || 0) >= 1) && ids.idle.every(id => (gs.ownedIdle[id] || 0) >= 1); }, howToUnlock: 'Buy every available upgrade at least once' },
  { id: 'title-the-ascended', name: 'The Ascended', category: 'title', description: 'All original upgrades at Lv50', rarity: 'legendary', cssClass: 'sc-title-ascended', icon: '🌟', check: gs => CLICK_UPGRADES.filter(u => !u.minRebirths).every(u => (gs.ownedClick[u.id] || 0) >= 50) && IDLE_UPGRADES.filter(u => !u.minRebirths).every(u => (gs.ownedIdle[u.id] || 0) >= 50), howToUnlock: 'Get all original upgrades to Lv50' },
  { id: 'title-ego-death-survivor', name: 'Ego Death Survivor', category: 'title', description: 'Survived your first rebirth', rarity: 'uncommon', cssClass: 'sc-title-glow-purple', icon: '☠️', check: gs => gs.rebirths >= 1, howToUnlock: 'Complete 1 Rebirth' },
  { id: 'title-prestige-i', name: 'Prestige I', category: 'title', description: 'Reached 5 rebirths', rarity: 'rare', cssClass: 'sc-title-glow-blue', icon: '⭐', check: gs => gs.rebirths >= 5, howToUnlock: 'Reach 5 Rebirths' },
  { id: 'title-prestige-ii', name: 'Prestige II', category: 'title', description: 'Reached 10 rebirths', rarity: 'epic', cssClass: 'sc-title-glow-gold', icon: '⭐⭐', check: gs => gs.rebirths >= 10, howToUnlock: 'Reach 10 Rebirths' },
  { id: 'title-prestige-iii', name: 'Prestige III', category: 'title', description: 'Reached 20 rebirths', rarity: 'epic', cssClass: 'sc-title-glow-red', icon: '⭐⭐⭐', check: gs => gs.rebirths >= 20, howToUnlock: 'Reach 20 Rebirths' },
  { id: 'title-prestige-max', name: 'Prestige MAX', category: 'title', description: 'Reached 100 rebirths', rarity: 'legendary', cssClass: 'sc-title-flame', icon: '🔥', check: gs => gs.rebirths >= 100, howToUnlock: 'Reach 100 Rebirths' },
  { id: 'title-reality-bender', name: 'Reality Bender', category: 'title', description: 'Reached 100 Billion lifetime sigmas', rarity: 'legendary', cssClass: 'sc-title-glitch', icon: '🌀', check: gs => gs.lifetimeSigmas >= 1e11, howToUnlock: 'Reach 100B lifetime Sigmas' },
  { id: 'title-carpal-tunnel', name: 'Carpal Tunnel', category: 'title', description: '1,000,000 manual clicks', rarity: 'epic', cssClass: 'sc-title-glow-red', icon: '🖱️', check: gs => gs.rawClicks >= 1000000, howToUnlock: '1,000,000 manual clicks' },
  { id: 'title-the-unbroken', name: 'The Unbroken', category: 'title', description: '5 hours of playtime', rarity: 'rare', cssClass: 'sc-title-glow-green', icon: '⏳', check: gs => gs.lifetimeHoursPlayed >= 5, howToUnlock: '5 hours total playtime' },
  { id: 'title-time-lord', name: 'Time Lord', category: 'title', description: '100 hours of total playtime', rarity: 'legendary', cssClass: 'sc-title-glitch', icon: '🕰️', check: gs => gs.lifetimeHoursPlayed >= 100, howToUnlock: '100 hours total playtime' },
  { id: 'title-focus-master', name: 'Focus Master', category: 'title', description: 'Beat Brain Fog 10 times', rarity: 'epic', cssClass: 'sc-title-glow-cyan', icon: '🧠', check: gs => (gs.focusGameWins || 0) >= 10, howToUnlock: 'Beat Brain Fog 10 times' },
  { id: 'title-puzzle-prodigy', name: 'Puzzle Prodigy', category: 'title', description: 'Solve 100 puzzles', rarity: 'epic', cssClass: 'sc-title-glow-yellow', icon: '🧩', check: gs => (gs.totalPuzzlesSolved || 0) >= 100, howToUnlock: 'Solve 100 Brainmaxxing puzzles' },
  { id: 'title-tren-titan', name: 'Trenbolone Titan', category: 'title', description: 'Buy Trenbologna 250 times', rarity: 'rare', cssClass: 'sc-title-glow-orange', icon: '🥪', check: gs => (gs.ownedIdle['tren'] || 0) >= 250, howToUnlock: 'Buy Trenbologna 250 times' },
  { id: 'title-looksmax-legend', name: 'Looksmaxxing Legend', category: 'title', description: 'Max out Mewing Streak and Jawline Gum (Lv50)', rarity: 'rare', cssClass: 'sc-title-glow-pink', icon: '💅', check: gs => (gs.ownedClick['mewing'] || 0) >= 50 && (gs.ownedClick['jawline'] || 0) >= 50, howToUnlock: 'Get Mewing Streak & Jawline Gum to Lv50' },
];

export const SC_BORDERS: CosmeticItem[] = [
  { id: 'border-wood', name: 'Wood Frame', category: 'border', description: 'A simple wooden frame', rarity: 'common', icon: '🪵', check: gs => gs.lifetimeSigmas >= 10000, howToUnlock: '10,000 lifetime Sigmas' },
  { id: 'border-iron', name: 'Rusted Iron', category: 'border', description: 'A rusted iron frame', rarity: 'common', icon: '⚙️', check: gs => gs.lifetimeSigmas >= 100000, howToUnlock: '100,000 lifetime Sigmas' },
  { id: 'border-bronze', name: 'Polished Bronze', category: 'border', description: 'A polished bronze frame', rarity: 'uncommon', icon: '🥉', check: gs => gs.lifetimeSigmas >= 1000000, howToUnlock: '1,000,000 lifetime Sigmas' },
  { id: 'border-silver', name: 'Silver Shine', category: 'border', description: 'A shining silver frame', rarity: 'rare', icon: '🥈', check: gs => gs.lifetimeSigmas >= 10000000, howToUnlock: '10,000,000 lifetime Sigmas' },
  { id: 'border-gold', name: 'Golden Glow', category: 'border', description: 'A glowing golden frame', rarity: 'epic', icon: '🥇', check: gs => gs.lifetimeSigmas >= 100000000, howToUnlock: '100,000,000 lifetime Sigmas' },
  { id: 'border-neon-beach', name: 'Neon Beach', category: 'border', description: 'Tropical neon vibes', rarity: 'rare', icon: '🏖️', check: gs => gs.lifetimeHoursPlayed >= 2, howToUnlock: 'Play for 2 hours total' },
  { id: 'border-glitch', name: 'Glitch Hacker', category: 'border', description: 'Caught by the system', rarity: 'uncommon', icon: '💀', check: gs => (gs.brainFogTriggers || 0) >= 10, howToUnlock: 'Get caught by Brain Fog 10 times' },
  { id: 'border-void', name: 'Void Matter', category: 'border', description: 'Dark energy from the void', rarity: 'epic', cssClass: 'sc-border-void', icon: '🔮', check: gs => gs.rebirths >= 1, howToUnlock: 'Complete 1 Rebirth' },
  { id: 'border-diamond', name: 'Diamond Crown', category: 'border', description: 'The ultimate border', rarity: 'legendary', icon: '💎', check: gs => gs.lifetimeSigmas >= 1e10, howToUnlock: '10,000,000,000 lifetime Sigmas' },
];

export const SC_BADGES: CosmeticItem[] = [
  { id: 'badge-rec-room', name: 'Rec Room Veteran', category: 'badge', description: 'Default badge for all players', rarity: 'common', icon: '🎮', check: () => true, howToUnlock: 'Default unlock' },
  { id: 'badge-first-blood', name: 'First Blood', category: 'badge', description: 'First click on the Sigma orb', rarity: 'common', icon: '🩸', check: gs => gs.rawClicks >= 1, howToUnlock: 'Click the Sigma orb once' },
  { id: 'badge-orb-hunter', name: 'Orb Hunter', category: 'badge', description: 'Collected 25 Alpha Energy orbs', rarity: 'rare', icon: '⚡', check: gs => (gs.orbsCollected || 0) >= 25, howToUnlock: 'Collect 25 Alpha Energy Orbs' },
  { id: 'badge-click-1k', name: '1K Clicks', category: 'badge', description: '1,000 manual clicks', rarity: 'common', icon: '👆', check: gs => gs.rawClicks >= 1000, howToUnlock: '1,000 manual clicks' },
  { id: 'badge-click-10k', name: '10K Clicks', category: 'badge', description: '10,000 manual clicks', rarity: 'uncommon', icon: '✊', check: gs => gs.rawClicks >= 10000, howToUnlock: '10,000 manual clicks' },
  { id: 'badge-click-100k', name: '100K Clicks', category: 'badge', description: '25,000 manual clicks', rarity: 'rare', icon: '🤜', check: gs => gs.rawClicks >= 25000, howToUnlock: '25,000 manual clicks' },
  { id: 'badge-rebirth-1', name: 'Ego Death', category: 'badge', description: 'First rebirth', rarity: 'uncommon', icon: '💀', check: gs => gs.rebirths >= 1, howToUnlock: 'Complete 1 Rebirth' },
  { id: 'badge-rebirth-5', name: 'Serial Rebirther', category: 'badge', description: '5 rebirths', rarity: 'rare', icon: '🔄', check: gs => gs.rebirths >= 5, howToUnlock: 'Complete 5 Rebirths' },
  { id: 'badge-rebirth-10', name: 'Rebirth Master', category: 'badge', description: '10 rebirths', rarity: 'epic', icon: '♾️', check: gs => gs.rebirths >= 10, howToUnlock: 'Complete 10 Rebirths' },
  { id: 'badge-rebirth-20', name: 'Rebirth Legend', category: 'badge', description: '20 rebirths', rarity: 'legendary', icon: '🌟', check: gs => gs.rebirths >= 20, howToUnlock: 'Complete 20 Rebirths' },
  { id: 'badge-sigma-1m', name: 'Millionaire', category: 'badge', description: '1M lifetime sigmas', rarity: 'uncommon', icon: '💰', check: gs => gs.lifetimeSigmas >= 1000000, howToUnlock: '1,000,000 lifetime Sigmas' },
  { id: 'badge-sigma-1b', name: 'Billionaire', category: 'badge', description: '1B lifetime sigmas', rarity: 'epic', icon: '💎', check: gs => gs.lifetimeSigmas >= 1e9, howToUnlock: '1,000,000,000 lifetime Sigmas' },
  { id: 'badge-brain-fog', name: 'Fog Survivor', category: 'badge', description: 'Beat Brain Fog 10 times', rarity: 'uncommon', icon: '🌫️', check: gs => (gs.focusGameWins || 0) >= 10, howToUnlock: 'Beat Brain Fog 10 times' },
  { id: 'badge-puzzler', name: 'Puzzler', category: 'badge', description: 'Solved 25 puzzles', rarity: 'rare', icon: '🧩', check: gs => (gs.totalPuzzlesSolved || 0) >= 25, howToUnlock: 'Solve 25 puzzles' },
  { id: 'badge-all-puzzles', name: 'Brain Unlocked', category: 'badge', description: 'Solved 10 puzzles', rarity: 'epic', icon: '🧠', check: gs => (gs.totalPuzzlesSolved || 0) >= 10, howToUnlock: 'Solve 10 puzzles' },
  { id: 'badge-prestige-shop', name: 'Prestige Spender', category: 'badge', description: 'Bought your first Prestige upgrade', rarity: 'rare', icon: '🛒', check: gs => Object.values(gs.prestigeUpgrades || {}).some(v => v > 0), howToUnlock: 'Buy any Prestige Upgrade' },
  { id: 'badge-sigma-creator', name: 'Sigma Creator', category: 'badge', description: 'Exclusive badge for Sigma Clicker creators', rarity: 'legendary', icon: '/sigma-creator-badge.png', check: () => false, howToUnlock: 'Granted by creators only' },
];

const ALL_COSMETICS = [...MASTERY_TITLES, ...SC_BORDERS, ...SC_BADGES];

export const SC_ALL_COSMETICS = [...MASTERY_TITLES, ...SC_BORDERS, ...SC_BADGES];

export const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const BORDER_STYLES: Record<string, React.CSSProperties> = {
  'border-wood': { border: '3px solid #8B7355', boxShadow: '0 0 8px #8B735544' },
  'border-iron': { border: '3px solid #71717a', boxShadow: '0 0 8px #71717a44' },
  'border-bronze': { border: '3px solid #cd7f32', boxShadow: '0 0 12px #cd7f3266' },
  'border-silver': { border: '3px solid #c0c0c0', boxShadow: '0 0 16px #c0c0c066' },
  'border-gold': { border: '3px solid #ffd700', boxShadow: '0 0 20px #ffd70066, 0 0 40px #ffd70033' },
  'border-neon-beach': { border: '3px solid #06b6d4', boxShadow: '0 0 16px #06b6d466, 0 0 32px #06b6d433' },
  'border-glitch': { border: '3px solid #ef4444', boxShadow: '0 0 12px #ef444466' },
  'border-void': { border: '3px solid #7c3aed', boxShadow: '0 0 20px #7c3aed88, 0 0 40px #7c3aed44, inset 0 0 10px #7c3aed33' },
  'border-diamond': { border: '3px solid #60a5fa', boxShadow: '0 0 24px #60a5fa88, 0 0 48px #60a5fa44' },
};

interface TriviaQuestion {
  question: string;
  choices: string[];
  answer: number;
  category: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { question: "What year did Minecraft officially release?", choices: ["2009", "2010", "2011", "2012"], answer: 2, category: "Gaming" },
  { question: "What is the powerhouse of the cell?", choices: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], answer: 2, category: "Science" },
  { question: "What is the capital of Japan?", choices: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], answer: 2, category: "General Knowledge" },
  { question: "What does 'GG' stand for in gaming?", choices: ["Get Going", "Good Game", "Great Goal", "Go Grind"], answer: 1, category: "Gaming" },
  { question: "Who painted the Mona Lisa?", choices: ["Michelangelo", "Da Vinci", "Picasso", "Van Gogh"], answer: 1, category: "General Knowledge" },
  { question: "What year was the first iPhone released?", choices: ["2005", "2006", "2007", "2008"], answer: 2, category: "History" },
  { question: "What planet is known as the Red Planet?", choices: ["Venus", "Jupiter", "Mars", "Saturn"], answer: 2, category: "Science" },
  { question: "What does 'NPC' stand for?", choices: ["New Player Character", "Non-Player Character", "No Points Counter", "Net Play Code"], answer: 1, category: "Gaming" },
  { question: "What is the chemical symbol for water?", choices: ["HO", "H2O", "WA", "O2H"], answer: 1, category: "Science" },
  { question: "What meme features a distracted boyfriend?", choices: ["Bad Luck Brian", "Distracted Boyfriend", "Disaster Girl", "Hide the Pain Harold"], answer: 1, category: "Internet Culture" },
  { question: "Who created the World Wide Web?", choices: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Mark Zuckerberg"], answer: 2, category: "History" },
  { question: "What game features a battle royale on an island with a storm?", choices: ["PUBG", "Apex Legends", "Fortnite", "All of these"], answer: 3, category: "Gaming" },
  { question: "What does 'GOAT' stand for in internet slang?", choices: ["Go On And Try", "Greatest Of All Time", "Get Out And Talk", "Good One And True"], answer: 1, category: "Internet Culture" },
  { question: "What is the largest ocean on Earth?", choices: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, category: "General Knowledge" },
  { question: "What does DNA stand for?", choices: ["Deoxyribonucleic Acid", "Digital Network Access", "Dynamic Natural Algorithm", "Double Nucleic Arrangement"], answer: 0, category: "Science" },
  { question: "What year did World War II end?", choices: ["1943", "1944", "1945", "1946"], answer: 2, category: "History" },
  { question: "What is the most-subscribed YouTube channel (non-corporate)?", choices: ["PewDiePie", "MrBeast", "Markiplier", "Dream"], answer: 1, category: "Internet Culture" },
  { question: "In Minecraft, what mob explodes when near a player?", choices: ["Zombie", "Skeleton", "Creeper", "Enderman"], answer: 2, category: "Gaming" },
  { question: "What element does 'O' represent on the periodic table?", choices: ["Osmium", "Oganesson", "Oxygen", "Gold"], answer: 2, category: "Science" },
  { question: "What is the speed of light approximately?", choices: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: 0, category: "Science" },
  { question: "What does 'ratio' mean on social media?", choices: ["Getting more followers", "Getting more replies than likes", "Posting at peak hours", "Going viral"], answer: 1, category: "Internet Culture" },
  { question: "What is the tallest mountain in the world?", choices: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], answer: 2, category: "General Knowledge" },
  { question: "What game has you catching creatures in Poké Balls?", choices: ["Digimon", "Pokémon", "Monster Hunter", "Temtem"], answer: 1, category: "Gaming" },
  { question: "Who was the first person to walk on the Moon?", choices: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], answer: 2, category: "History" },
  { question: "What does 'sus' come from?", choices: ["Suspect", "Suspicious / Among Us", "Super User Status", "Sudden Upset"], answer: 1, category: "Internet Culture" },
];

const WATER_PARK_TIERS_DATA = [
  { threshold: 0, emoji: '🏝️', labelKey: 'sc.wp.barren', structures: [] as string[] },
  { threshold: 5, emoji: '🏊', labelKey: 'sc.wp.kiddie', structures: ['🏊'] },
  { threshold: 15, emoji: '🌊', labelKey: 'sc.wp.lazy', structures: ['🏊', '🌊'] },
  { threshold: 30, emoji: '🏄‍♂️', labelKey: 'sc.wp.wave', structures: ['🏊', '🌊', '🏄‍♂️'] },
  { threshold: 50, emoji: '🎢', labelKey: 'sc.wp.mega', structures: ['🏊', '🌊', '🏄‍♂️', '🎢'] },
  { threshold: 75, emoji: '🏖️', labelKey: 'sc.wp.resort', structures: ['🏊', '🌊', '🏄‍♂️', '🎢', '🏖️'] },
  { threshold: 100, emoji: '🌴', labelKey: 'sc.wp.paradise', structures: ['🏊', '🌊', '🏄‍♂️', '🎢', '🏖️', '🌴', '🎪'] },
];

type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night';

function getTimeOfDay(sigmasSinceRebirth: number, rebirths: number): { phase: TimeOfDay; progress: number } {
  if (rebirths > 0) {
    if (sigmasSinceRebirth < 500) return { phase: 'night', progress: Math.min(1, sigmasSinceRebirth / 500) };
    if (sigmasSinceRebirth < 5000) return { phase: 'morning', progress: Math.min(1, (sigmasSinceRebirth - 500) / 4500) };
    return getTimeFromSigmas(sigmasSinceRebirth);
  }
  return getTimeFromSigmas(sigmasSinceRebirth);
}

function getTimeFromSigmas(sigmas: number): { phase: TimeOfDay; progress: number } {
  if (sigmas < 1000) return { phase: 'morning', progress: Math.min(1, sigmas / 1000) };
  if (sigmas < 50000) return { phase: 'day', progress: Math.min(1, (sigmas - 1000) / 49000) };
  if (sigmas < 500000) return { phase: 'sunset', progress: Math.min(1, (sigmas - 50000) / 450000) };
  return { phase: 'sunset', progress: 1 };
}

function getSkyGradient(phase: TimeOfDay, progress: number): string {
  switch (phase) {
    case 'morning':
      return `linear-gradient(180deg, 
        hsl(${210 - progress * 10}, ${60 + progress * 20}%, ${70 + progress * 10}%) 0%, 
        hsl(${200 - progress * 10}, ${65 + progress * 15}%, ${75 + progress * 10}%) 30%,
        hsl(${190}, ${70}%, ${80}%) 60%,
        hsl(${40 + progress * 10}, ${80}%, ${75 + progress * 5}%) 100%)`;
    case 'day':
      return `linear-gradient(180deg, 
        #0ea5e9 0%, #38bdf8 25%, #67e8f9 50%, #06b6d4 75%, #0891b2 100%)`;
    case 'sunset':
      return `linear-gradient(180deg, 
        hsl(${240 - progress * 30}, ${30 + progress * 30}%, ${40 - progress * 15}%) 0%, 
        hsl(${30 - progress * 20}, ${70 + progress * 20}%, ${45 - progress * 10}%) 35%,
        hsl(${15 - progress * 10}, ${80 + progress * 10}%, ${50 - progress * 15}%) 55%,
        hsl(${350}, ${60 + progress * 20}%, ${35 - progress * 10}%) 80%,
        hsl(${280 + progress * 20}, ${40}%, ${20 - progress * 5}%) 100%)`;
    case 'night':
      const waking = progress;
      return `linear-gradient(180deg, 
        hsl(${230 + waking * 10}, ${20 + waking * 20}%, ${8 + waking * 15}%) 0%, 
        hsl(${240}, ${15 + waking * 20}%, ${10 + waking * 20}%) 40%,
        hsl(${250 - waking * 30}, ${20 + waking * 30}%, ${12 + waking * 25}%) 70%,
        hsl(${260 - waking * 50}, ${25 + waking * 30}%, ${15 + waking * 30}%) 100%)`;
  }
}

function getSunPosition(phase: TimeOfDay, progress: number): { x: number; y: number; size: number; color: string; glow: string; opacity: number } {
  let angle: number;
  switch (phase) {
    case 'morning':
      angle = Math.PI * (0.85 - progress * 0.35);
      break;
    case 'day':
      angle = Math.PI * (0.5 - progress * 0.15);
      break;
    case 'sunset':
      angle = Math.PI * (0.35 - progress * 0.25);
      break;
    case 'night':
      angle = Math.PI * (0.1 + progress * 0.75);
      break;
  }
  const radius = 38;
  const cx = 50;
  const cy = 52;
  const x = cx + Math.cos(angle) * radius;
  const y = cy - Math.sin(angle) * radius * 0.9;

  if (phase === 'night' && progress < 0.5) {
    return { x, y: Math.min(y, 45), size: 30, color: '#e2e8f0', glow: '0 0 20px #e2e8f044, 0 0 40px #94a3b822', opacity: 0.8 };
  }

  const isSunset = phase === 'sunset';
  const isMorning = phase === 'morning';
  return {
    x, y: Math.min(y, 48),
    size: isSunset ? 36 + progress * 8 : 32,
    color: isSunset ? `hsl(${40 - progress * 20}, 100%, ${55 - progress * 10}%)` : isMorning ? '#fde68a' : '#fbbf24',
    glow: isSunset
      ? `0 0 ${40 + progress * 30}px hsl(${30 - progress * 15}, 100%, 50%), 0 0 ${60 + progress * 40}px hsl(${20}, 80%, 40%)`
      : `0 0 30px #fbbf2466, 0 0 60px #f59e0b33`,
    opacity: 1,
  };
}

function getWaterParkTier(totalUpgrades: number) {
  let tier = WATER_PARK_TIERS_DATA[0];
  for (const t of WATER_PARK_TIERS_DATA) {
    if (totalUpgrades >= t.threshold) tier = t;
  }
  return tier;
}

function TriviaGame({ onWin, onFail }: { onWin: (bonus: number) => void; onFail: () => void }) {
  const question = useMemo(() => TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)], []);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const pick = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    setTimeout(() => {
      if (idx === question.answer) {
        onWin(1);
      } else {
        onFail();
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-3">
      <span className="text-[10px] uppercase tracking-widest text-gray-500">{question.category}</span>
      <p className="text-white font-bold text-center text-sm leading-snug">{question.question}</p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
        {question.choices.map((c, i) => {
          let bg = 'bg-white/5 border-white/10 hover:bg-white/10';
          if (revealed) {
            if (i === question.answer) bg = 'bg-emerald-500/30 border-emerald-400/50';
            else if (i === selected) bg = 'bg-red-500/30 border-red-400/50';
            else bg = 'bg-white/[0.02] border-white/5 opacity-40';
          }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              className={`w-full p-2.5 rounded-xl text-sm font-medium text-white border transition-all ${bg}`}
            >{c}</button>
          );
        })}
      </div>
      {revealed && (
        <p className={`text-sm font-bold ${selected === question.answer ? 'text-emerald-400' : 'text-red-400'}`}>
          {selected === question.answer ? '✓ Correct! Sigma Brain!' : `✗ Wrong! Answer: ${question.choices[question.answer]}`}
        </p>
      )}
    </div>
  );
}

function Island({ side, tier, onClick }: { side: 'left' | 'right'; tier?: typeof WATER_PARK_TIERS_DATA[0]; onClick: () => void }) {
  const { t } = useLanguage();
  const isRight = side === 'right';
  return (
    <button onClick={onClick}
      className={`absolute z-[5] cursor-pointer group transition-transform hover:scale-105 active:scale-95 ${isRight ? 'right-0 sm:right-2' : 'left-0 sm:left-2'}`}
      style={{ width: 'clamp(180px, 30vw, 280px)', bottom: '38%' }}
    >
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-20 sm:-top-24 pointer-events-none">
          <div className="relative w-24 h-32 sm:w-28 sm:h-36">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 sm:w-4 h-20 sm:h-24 bg-gradient-to-t from-amber-800 to-amber-700 rounded-sm" style={{ transform: `translateX(-50%) rotate(${isRight ? 5 : -5}deg)` }} />
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="absolute left-1/2 origin-bottom" style={{
                transform: `translateX(-50%) rotate(${(i - 2.5) * 28 + (isRight ? 8 : -8)}deg)`,
                width: '60px', height: '22px',
                background: `linear-gradient(${i % 2 === 0 ? '135deg' : '45deg'}, #16a34a, #22c55e, #15803d)`,
                borderRadius: '0 80% 0 80%',
                top: `${i * 3}px`,
                opacity: 0.9,
              }} />
            ))}
          </div>
        </div>
        <div className="w-full h-12 sm:h-16 rounded-t-[50%] rounded-b-[30%]"
          style={{ background: 'linear-gradient(180deg, #d4a853 0%, #c9a243 30%, #a8842f 70%, #8a6b20 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
        <div className="absolute inset-x-0 top-0 h-12 sm:h-16 flex items-center justify-center gap-1 text-lg sm:text-xl">
          {isRight && tier && tier.structures.length > 0 ? tier.structures.map((e, i) => (
            <span key={i} className="drop-shadow-lg">{e}</span>
          )) : (
            <span className="drop-shadow-lg text-2xl">{isRight ? '🏝️' : '🔮'}</span>
          )}
        </div>
        <p className="text-center text-white font-black mt-1 drop-shadow-lg group-hover:text-yellow-300 transition-colors"
          style={{
            fontSize: 'clamp(11px, 2.5vw, 16px)',
            fontStyle: 'italic',
            transform: `rotate(${isRight ? 2 : -2}deg)`,
            textShadow: '2px 2px 0 rgba(0,0,0,0.7), -1px -1px 0 rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.5)',
            letterSpacing: '1px',
            fontFamily: "'Segoe UI', Impact, sans-serif",
          }}>
          {isRight ? (tier ? t(tier.labelKey) : t('sc.island.waterpark')) : t('sc.island.mysticShort')}
        </p>
      </div>
    </button>
  );
}

function PatchNotesModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [selectedVersion, setSelectedVersion] = useState(0);

  const versions = [
    {
      version: 'v2.5',
      title: t('sc.patch.v25.title'),
      date: '2026',
      entries: [
        { icon: '🏆', color: 'text-yellow-300', title: t('sc.patch.v25.lb.title'), desc: t('sc.patch.v25.lb.desc') },
        { icon: '🎖️', color: 'text-cyan-300', title: t('sc.patch.v25.badges.title'), desc: t('sc.patch.v25.badges.desc') },
        { icon: '🛒', color: 'text-emerald-300', title: t('sc.patch.v25.shop.title'), desc: t('sc.patch.v25.shop.desc') },
        { icon: '🌍', color: 'text-blue-300', title: t('sc.patch.v25.lang.title'), desc: t('sc.patch.v25.lang.desc') },
        { icon: '📋', color: 'text-purple-300', title: t('sc.patch.v25.quests.title'), desc: t('sc.patch.v25.quests.desc') },
      ],
    },
    {
      version: 'v2.0',
      title: t('sc.patch.v20.title'),
      date: '2025',
      entries: [
        { icon: '🌊', color: 'text-yellow-300', title: t('sc.patch.v20.waterpark.title'), desc: t('sc.patch.v20.waterpark.desc') },
        { icon: '🔥', color: 'text-red-400', title: t('sc.patch.v20.overheat.title'), desc: t('sc.patch.v20.overheat.desc') },
        { icon: '🔮', color: 'text-purple-300', title: t('sc.patch.v20.mystic.title'), desc: t('sc.patch.v20.mystic.desc') },
        { icon: '🧠', color: 'text-cyan-300', title: t('sc.patch.v20.trivia.title'), desc: t('sc.patch.v20.trivia.desc') },
        { icon: '⚡', color: 'text-emerald-300', title: t('sc.patch.v20.opt.title'), desc: t('sc.patch.v20.opt.desc') },
        { icon: '🏝️', color: 'text-amber-300', title: t('sc.patch.v20.islands.title'), desc: t('sc.patch.v20.islands.desc') },
      ],
    },
  ];

  const current = versions[selectedVersion];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gradient-to-b from-[#1a1040] to-[#0d0d2b] rounded-2xl border border-purple-500/30 max-w-md w-full max-h-[80vh] overflow-y-auto p-5 shadow-2xl shadow-purple-900/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
            {t('sc.patch.title')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex gap-1.5 mb-4">
          {versions.map((v, i) => (
            <button key={v.version} onClick={() => setSelectedVersion(i)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedVersion === i ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white'}`}
            >{v.version}</button>
          ))}
        </div>

        <div className="mb-3">
          <h3 className="text-sm font-bold text-white">{current.title}</h3>
          <p className="text-[10px] text-gray-500">{current.date}</p>
        </div>

        <div className="space-y-3 text-sm">
          {current.entries.map((entry, i) => (
            <div key={i}>
              <h3 className={`${entry.color} font-bold mb-1`}>{entry.icon} {entry.title}</h3>
              <p className="text-gray-300">{entry.desc}</p>
            </div>
          ))}
          <p className="text-gray-500 text-xs text-center pt-2 border-t border-white/10">{t('sc.patch.footer')}</p>
        </div>
      </div>
    </div>
  );
}

interface AlphaOrb {
  id: number;
  x: number;
  y: number;
  bonus: number;
  spawned: number;
}

interface TreasureChest {
  id: number;
  x: number;
  y: number;
  hitsNeeded: number;
  hitsReceived: number;
  reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  spawned: number;
}

const CHEST_RARITIES = [
  { rarity: 'common' as const, weight: 60, multMin: 3, multMax: 8, hits: 5, color: '#9ca3af', emoji: '📦' },
  { rarity: 'rare' as const, weight: 25, multMin: 10, multMax: 25, hits: 10, color: '#3b82f6', emoji: '🎁' },
  { rarity: 'epic' as const, weight: 12, multMin: 30, multMax: 60, hits: 20, color: '#a855f7', emoji: '💎' },
  { rarity: 'legendary' as const, weight: 3, multMin: 80, multMax: 150, hits: 35, color: '#f59e0b', emoji: '👑' },
];

function rollChestRarity() {
  const total = CHEST_RARITIES.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const cr of CHEST_RARITIES) {
    r -= cr.weight;
    if (r <= 0) return cr;
  }
  return CHEST_RARITIES[0];
}

interface GameState {
  sigmas: number;
  rawClicks: number;
  ownedClick: Record<string, number>;
  ownedIdle: Record<string, number>;
  rebirths: number;
  auraMult: number;
  puzzlesUnlocked: boolean[];
  puzzleExpiry: number[];
  totalUpgrades: number;
  lifetimeHoursPlayed: number;
  lifetimeSigmas: number;
  sigmasSinceRebirth: number;
  unlockedCosmetics: string[];
  equippedTitle: string | null;
  equippedBorder: string | null;
  equippedBadges: string[];
  focusGameWins: number;
  totalPuzzlesSolved: number;
  brainFogTriggers: number;
  orbsCollected: number;
  prestigePoints: number;
  prestigeUpgrades: Record<string, number>;
  criticalHits: number;
  maxCombo: number;
  totalComboBonus: number;
  chestsOpened: number;
  legendaryChests: number;
  lastSaveTimestamp: number;
  totalOfflineEarnings: number;
  globalMultiplierLevel: number;
  synergyLevels: Record<string, number>;
}

const defaultState: GameState = {
  sigmas: 0,
  rawClicks: 0,
  ownedClick: {},
  ownedIdle: {},
  rebirths: 0,
  auraMult: 1,
  puzzlesUnlocked: [false, false, false],
  puzzleExpiry: [0, 0, 0],
  totalUpgrades: 0,
  lifetimeHoursPlayed: 0,
  lifetimeSigmas: 0,
  sigmasSinceRebirth: 0,
  unlockedCosmetics: [],
  equippedTitle: null,
  equippedBorder: null,
  equippedBadges: [],
  focusGameWins: 0,
  totalPuzzlesSolved: 0,
  brainFogTriggers: 0,
  orbsCollected: 0,
  prestigePoints: 0,
  prestigeUpgrades: {},
  criticalHits: 0,
  maxCombo: 0,
  totalComboBonus: 0,
  chestsOpened: 0,
  legendaryChests: 0,
  lastSaveTimestamp: Date.now(),
  totalOfflineEarnings: 0,
  globalMultiplierLevel: 0,
  synergyLevels: {},
};

function BeachDecorations({ isNight }: { isNight: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[45%] pointer-events-none z-[3]">
      <span className="absolute text-lg sm:text-xl opacity-60" style={{ left: '15%', bottom: '20%' }}>🐚</span>
      <span className="absolute text-sm sm:text-base opacity-50" style={{ left: '70%', bottom: '25%' }}>🐚</span>
      <span className="absolute text-lg sm:text-xl opacity-50" style={{ left: '45%', bottom: '15%' }}>⭐</span>
      <span className="absolute text-sm opacity-40" style={{ left: '85%', bottom: '30%' }}>🪸</span>
      <span className="absolute text-base opacity-40" style={{ left: '30%', bottom: '10%' }}>🐠</span>
      <span className="absolute text-sm opacity-30" style={{ left: '55%', bottom: '8%' }}>🌊</span>
      <span className="absolute text-base opacity-40" style={{ left: '8%', bottom: '12%' }}>🦀</span>
      <span className="absolute text-sm opacity-35" style={{ left: '78%', bottom: '18%' }}>🏖️</span>
      {!isNight && (
        <>
          <span className="absolute text-lg opacity-30" style={{ left: '92%', bottom: '35%' }}>☀️</span>
          <span className="absolute text-sm opacity-25" style={{ left: '25%', bottom: '5%' }}>🐙</span>
        </>
      )}
    </div>
  );
}

function SimonSaysPuzzle({ difficulty, onWin, onFail }: { difficulty: number; onWin: () => void; onFail: () => void }) {
  const { t } = useLanguage();
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
  const seqLength = 4 + difficulty * 2;
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [showingIdx, setShowingIdx] = useState(-1);
  const [phase, setPhase] = useState<'showing' | 'input' | 'result'>('showing');
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setPlayerSeq([]);
    setPhase('showing');
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setShowingIdx(seq[i]);
        setTimeout(() => setShowingIdx(-1), 400);
        i++;
      } else {
        clearInterval(interval);
        setPhase('input');
      }
    }, 700);
    return () => clearInterval(interval);
  }, [seqLength]);

  const handlePress = (idx: number) => {
    if (phase !== 'input') return;
    const newSeq = [...playerSeq, idx];
    setPlayerSeq(newSeq);
    const pos = newSeq.length - 1;
    if (newSeq[pos] !== sequence[pos]) {
      setPhase('result');
      setResultMsg(t('sc.mini.wrong'));
      setTimeout(onFail, 1500);
      return;
    }
    if (newSeq.length === sequence.length) {
      setPhase('result');
      setResultMsg(t('sc.mini.solved'));
      setTimeout(onWin, 1200);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <p className="text-sm text-gray-400">
        {phase === 'showing' ? t('sc.mini.watch') : phase === 'input' ? `${t('sc.mini.repeat')} (${playerSeq.length}/${sequence.length})` : resultMsg}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {colors.map((c, i) => (
          <button key={i} onClick={() => handlePress(i)} disabled={phase !== 'input'}
            className="w-20 h-20 rounded-xl border-2 transition-all duration-150"
            style={{
              backgroundColor: showingIdx === i ? c : `${c}44`,
              borderColor: showingIdx === i ? '#fff' : `${c}88`,
              transform: showingIdx === i ? 'scale(1.1)' : 'scale(1)',
              cursor: phase === 'input' ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MathPuzzle({ difficulty, onWin, onFail }: { difficulty: number; onWin: () => void; onFail: () => void }) {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState('');
  const puzzle = useMemo(() => {
    const ops = ['+', '-', '*'];
    const a = Math.floor(Math.random() * (10 + difficulty * 5)) + 5;
    const b = Math.floor(Math.random() * (8 + difficulty * 3)) + 2;
    const c = Math.floor(Math.random() * (6 + difficulty * 2)) + 1;
    const op1 = ops[Math.floor(Math.random() * (difficulty >= 1 ? 3 : 2))];
    const op2 = ops[Math.floor(Math.random() * (difficulty >= 2 ? 3 : 2))];
    const expr = `${a} ${op1} ${b} ${op2} ${c}`;
    let result: number;
    const calc = (x: number, op: string, y: number) => op === '+' ? x + y : op === '-' ? x - y : x * y;
    if (op2 === '*') {
      result = calc(a, op1, calc(b, op2, c));
    } else if (op1 === '*') {
      result = calc(calc(a, op1, b), op2, c);
    } else {
      result = calc(calc(a, op1, b), op2, c);
    }
    return { expr, result };
  }, [difficulty]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === puzzle.result) {
      onWin();
    } else {
      onFail();
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4 p-4">
      <p className="text-gray-400 text-sm">{t('sc.mini.solve')}</p>
      <p className="text-3xl font-mono font-bold text-cyan-300">{puzzle.expr} = ?</p>
      <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
        className="bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white text-center text-xl w-32 outline-none focus:border-cyan-500"
        autoFocus
      />
      <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2 rounded-xl">{t('sc.mini.submit')}</button>
    </form>
  );
}

function FocusMiniGame({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [hit, setHit] = useState(0);
  const needed = 8;

  useEffect(() => {
    const spawn = () => {
      const t = { id: Date.now() + Math.random(), x: Math.random() * 80 + 10, y: Math.random() * 70 + 15 };
      setTargets(prev => [...prev.slice(-4), t]);
    };
    spawn();
    const iv = setInterval(spawn, 900);
    return () => clearInterval(iv);
  }, []);

  const hitTarget = (id: number) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    const newHit = hit + 1;
    setHit(newHit);
    if (newHit >= needed) onComplete();
  };

  return (
    <div className="relative w-full h-64 bg-black/30 rounded-xl border border-white/10 overflow-hidden">
      <p className="absolute top-2 left-1/2 -translate-x-1/2 text-sm text-gray-400 z-10">{t('sc.mini.focus')} ({hit}/{needed})</p>
      <AnimatePresence>
        {targets.map(t => (
          <motion.button key={t.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => hitTarget(t.id)}
            className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-lg"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >🎯</motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

function InventoryPanel({ gs, onEquipTitle, onEquipBorder, onEquipBadge, serverInventory }: {
  gs: GameState;
  onEquipTitle: (id: string) => void;
  onEquipBorder: (id: string) => void;
  onEquipBadge: (id: string) => void;
  serverInventory?: string[];
}) {
  const [subTab, setSubTab] = useState<'all' | 'badges' | 'borders' | 'titles' | 'future'>('all');
  const unlocked = new Set([...(gs.unlockedCosmetics || []), ...(serverInventory || [])]);

  const items = subTab === 'all' ? ALL_COSMETICS
    : subTab === 'badges' ? SC_BADGES
    : subTab === 'borders' ? SC_BORDERS
    : subTab === 'titles' ? MASTERY_TITLES
    : [];

  const handleEquip = (item: CosmeticItem) => {
    if (!unlocked.has(item.id)) return;
    if (item.category === 'title') onEquipTitle(item.id);
    else if (item.category === 'border') onEquipBorder(item.id);
    else if (item.category === 'badge') onEquipBadge(item.id);
  };

  const isEquipped = (item: CosmeticItem) => {
    if (item.category === 'title') return gs.equippedTitle === item.id;
    if (item.category === 'border') return gs.equippedBorder === item.id;
    if (item.category === 'badge') return (gs.equippedBadges || []).includes(item.id);
    return false;
  };

  const stbtn = (tab: typeof subTab, label: string) => (
    <button onClick={() => setSubTab(tab)}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${subTab === tab ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 text-gray-500 border border-white/10'}`}
    >{label}</button>
  );

  return (
    <div className="p-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-amber-300">🎒 Inventory</h3>
        <span className="text-[10px] text-gray-500">{unlocked.size}/{ALL_COSMETICS.length} unlocked</span>
      </div>

      <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
        <div className="relative w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-lg"
          style={gs.equippedBorder ? (BORDER_STYLES[gs.equippedBorder] || {}) : { border: '2px solid rgba(255,255,255,0.2)' }}>
          🗿
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold truncate">Player</span>
            {(gs.equippedBadges || []).slice(0, 3).map(bid => {
              const badge = SC_BADGES.find(b => b.id === bid);
              return badge ? (
                <span key={bid} title={badge.name} className="inline-flex items-center">
                  {badge.icon.startsWith('/') ? <span className="inline-block w-5 h-5 overflow-hidden rounded"><img src={badge.icon} alt={badge.name} className="w-full h-full object-contain scale-[2]" /></span> : <span className="text-xs">{badge.icon}</span>}
                </span>
              ) : null;
            })}
          </div>
          {gs.equippedTitle && (() => {
            const title = MASTERY_TITLES.find(t => t.id === gs.equippedTitle);
            return title ? <p className={`text-[10px] font-bold ${title.cssClass || ''}`} style={{ color: RARITY_COLORS[title.rarity] }}>{title.icon} {title.name}</p> : null;
          })()}
        </div>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-none">
        {stbtn('all', 'All')}
        {stbtn('badges', 'Badges')}
        {stbtn('borders', 'Borders')}
        {stbtn('titles', 'Titles')}
        {stbtn('future', '🔒 Future')}
      </div>

      {subTab === 'future' ? (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">🔮</p>
          <p className="text-gray-400 text-sm">More cosmetics coming soon...</p>
          <p className="text-gray-600 text-xs mt-1">Backgrounds, Effects, and more!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map(item => {
            const isUnlocked = unlocked.has(item.id);
            const equipped = isEquipped(item);
            return (
              <button key={item.id} onClick={() => handleEquip(item)} disabled={!isUnlocked}
                className={`group relative rounded-xl p-2.5 border text-left transition-all ${
                  equipped
                    ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : isUnlocked
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                    : 'bg-white/[0.02] border-white/5 opacity-50 grayscale cursor-default'
                }`}
              >
                {equipped && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-[8px] text-black font-bold">✓</span>
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute top-1.5 right-1.5 text-gray-600 text-xs">🔒</div>
                )}
                <div className="text-xl mb-1">{item.icon?.startsWith('/') ? <span className="inline-block w-8 h-8 overflow-hidden rounded"><img src={item.icon} alt={item.name} className="w-full h-full object-contain scale-[2]" /></span> : item.icon}</div>
                <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                <p className="text-[9px] mt-0.5 font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>
                  {item.rarity.toUpperCase()} {item.category === 'title' ? '📜' : item.category === 'border' ? '🖼️' : '📛'}
                </p>
                {isUnlocked && item.description && (
                  <p className="text-[8px] text-gray-400 mt-1 leading-tight line-clamp-2">{item.description}</p>
                )}
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-xl flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[9px] text-gray-300 text-center leading-tight">{item.howToUnlock}</p>
                  </div>
                )}
                {isUnlocked && !equipped && (
                  <div className="absolute inset-0 rounded-xl flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[9px] text-cyan-300 font-bold">Click to Equip</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[9px] text-gray-600">
        <span>1 Border</span><span>·</span><span>1 Title</span><span>·</span><span>Up to 3 Badges</span>
      </div>
    </div>
  );
}

interface LeaderboardEntry {
  userId?: number;
  username: string;
  nameColor?: string | null;
  profilePic?: string | null;
  activeBorder?: string | null;
  level?: number;
  lifetimeSigmas: number;
  rebirths: number;
  equippedTitle?: string | null;
  equippedBorder?: string | null;
  equippedBadges?: string[];
}

function MiniProfileModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialApi.getProfile(userId).then(d => setProfile(d.user)).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-xs relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors text-sm">✕</button>
        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Loading...</div>
        ) : !profile ? (
          <div className="py-8 text-center text-gray-500 text-sm">Could not load profile.</div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white border-2 border-white/20">
              {profile.profile_pic_url ? <img src={profile.profile_pic_url} alt="" className="w-full h-full rounded-full object-cover" /> : profile.username?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold" style={{ color: profile.name_color || '#fff' }}>{profile.username}</h3>
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-500">Level</p>
                <p className="text-white font-bold text-sm">{profile.level || 1}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-500">Streak</p>
                <p className="text-white font-bold text-sm">{profile.streak || 0}d</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-500">Coins</p>
                <p className="text-white font-bold text-sm">{(profile.coins || 0).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">
              {profile.isOnline ? '🟢 Online now' : profile.last_seen ? `Last seen ${new Date(profile.last_seen).toLocaleDateString()}` : ''}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FriendLeaderboard({ loggedIn, onViewProfile }: { loggedIn: boolean; onViewProfile: (id: number) => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true);
    progressApi.getFriendsLeaderboard('sigma-clicker')
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [loggedIn]);

  if (!loggedIn) return <p className="text-yellow-500/70 text-xs text-center py-4">Log in to see your friend leaderboard</p>;
  if (loading) return <p className="text-gray-400 text-xs text-center py-4 animate-pulse">Loading...</p>;
  if (entries.length === 0) return <p className="text-gray-500 text-xs text-center py-4">No friends with Sigma Clicker progress yet. Add friends in the Social Hub!</p>;

  return (
    <div className="space-y-1.5">
      {entries.map((e: any, i: number) => (
        <div key={i} className={`flex justify-between items-center rounded-lg p-2 border cursor-pointer hover:bg-white/10 transition-colors ${e.isMe ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-white/5 border-white/10'}`}
          onClick={() => e.userId && onViewProfile(e.userId)}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </span>
            <span className="text-sm font-bold" style={{ color: e.nameColor || '#fff' }}>
              {e.username}{e.isMe ? ' (you)' : ''}
            </span>
          </div>
          <div className="text-right">
            <span className="text-white text-xs font-bold">{formatNum(e.lifetimeSigmas)}</span>
            {e.rebirths > 0 && <span className="text-purple-300 text-xs ml-2">✦{e.rebirths}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

type RankedData = {
  season: string;
  seasonEnd: string;
  rank: string;
  seasonSigmas: number;
  seasonRebirths: number;
  position: number | null;
  totalPlayers: number;
  progressToNext: number;
  nextTier: { name: string; minSigmas: number } | null;
  currentTier: { name: string; minSigmas: number } | null;
  tiers: { name: string; minSigmas: number; color: string }[];
  leaderboard: { username: string; nameColor: string; profilePic: string; activeBorder: string; level: number; seasonSigmas: number; seasonRebirths: number; rank: string; position: number }[];
  history: { season: string; sigmas: number; rebirths: number; rank: string; position: number | null }[];
};

const RANK_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#00CED1',
  Diamond: '#B9F2FF',
  Master: '#9B59B6',
  Grandmaster: '#E74C3C',
  Legend: '#FF6B35',
};

const RANK_ICONS: Record<string, string> = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎',
  Diamond: '💠', Master: '👑', Grandmaster: '🔥', Legend: '⚡',
};

function LeaderboardPanel({ gs, sessionStart, loggedIn, username }: { gs: GameState; sessionStart: number; loggedIn: boolean; username?: string }) {
  const { t } = useLanguage();
  const [lbTab, setLbTab] = useState<'local' | 'friends' | 'global' | 'ranked'>('ranked');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<number | null>(null);
  const [rankedData, setRankedData] = useState<RankedData | null>(null);
  const [rankedLoading, setRankedLoading] = useState(false);

  const friendCode = useMemo(() => {
    if (!loggedIn || !username) return '';
    let h = 0;
    for (let i = 0; i < username.length; i++) {
      h = ((h << 5) - h + username.charCodeAt(i)) | 0;
    }
    return `SC-${Math.abs(h).toString(36).substring(0, 6).toUpperCase().padEnd(6, 'X')}`;
  }, [loggedIn, username]);

  useEffect(() => {
    if (lbTab === 'global' && loggedIn) {
      setLoading(true);
      fetch('/api/progress/leaderboard/sigma-clicker')
        .then(r => r.ok ? r.json() : [])
        .then(data => setGlobalEntries(Array.isArray(data) ? data : []))
        .catch(() => setGlobalEntries([]))
        .finally(() => setLoading(false));
    }
  }, [lbTab, loggedIn]);

  const localHistory: { lifetimeSigmas: number; rebirths: number; date: string }[] = (() => {
    try {
      const raw = localStorage.getItem('sigmaClicker_localLb');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();

  useEffect(() => {
    if (gs.lifetimeSigmas > 0) {
      const entry = { lifetimeSigmas: gs.lifetimeSigmas, rebirths: gs.rebirths, date: new Date().toLocaleDateString() };
      const existing = (() => { try { return JSON.parse(localStorage.getItem('sigmaClicker_localLb') || '[]'); } catch { return []; } })();
      const dominated = existing.some((e: any) => e.lifetimeSigmas >= gs.lifetimeSigmas && e.rebirths >= gs.rebirths);
      if (!dominated) {
        const updated = [...existing.filter((e: any) => !(gs.lifetimeSigmas >= e.lifetimeSigmas && gs.rebirths >= e.rebirths)), entry]
          .sort((a: any, b: any) => b.lifetimeSigmas - a.lifetimeSigmas).slice(0, 10);
        localStorage.setItem('sigmaClicker_localLb', JSON.stringify(updated));
      }
    }
  }, [gs.lifetimeSigmas, gs.rebirths]);

  const fetchRankedData = useCallback(() => {
    if (!loggedIn) return;
    const token = localStorage.getItem('vault_token');
    if (!token) return;
    setRankedLoading(true);
    fetch('/api/progress/ranked/sigma-clicker', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setRankedData(data))
      .catch(() => setRankedData(null))
      .finally(() => setRankedLoading(false));
  }, [loggedIn]);

  useEffect(() => {
    if (lbTab === 'ranked' && loggedIn) {
      fetchRankedData();
      const iv = setInterval(fetchRankedData, 30000);
      return () => clearInterval(iv);
    }
  }, [lbTab, loggedIn, fetchRankedData]);

  const lastSyncedSigmas = useRef(0);
  const lastSyncedRebirths = useRef(0);
  useEffect(() => {
    if (!loggedIn || gs.lifetimeSigmas <= 0) return;
    if (gs.lifetimeSigmas <= lastSyncedSigmas.current * 1.01 && gs.rebirths <= lastSyncedRebirths.current) return;
    const timer = setTimeout(async () => {
      const token = localStorage.getItem('vault_token');
      if (!token) return;
      lastSyncedSigmas.current = gs.lifetimeSigmas;
      lastSyncedRebirths.current = gs.rebirths;
      try {
        const pt = Math.floor((Date.now() - sessionStart) / 1000);
        await progressApi.save(GAME_ID, gs, pt);
      } catch {}
      try {
        const resp = await fetch('/api/progress/ranked/sigma-clicker/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ lifetimeSigmas: gs.lifetimeSigmas, rebirths: gs.rebirths }),
        });
        if (resp.ok && lbTab === 'ranked') {
          const freshResp = await fetch('/api/progress/ranked/sigma-clicker', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (freshResp.ok) {
            const freshData = await freshResp.json();
            setRankedData(freshData);
          }
        }
      } catch {}
    }, 5000);
    return () => clearTimeout(timer);
  }, [loggedIn, gs.lifetimeSigmas, gs.rebirths]);

  const tbtn = (tab: 'local' | 'friends' | 'global' | 'ranked', label: string) => (
    <button key={tab} onClick={() => setLbTab(tab)}
      className={`flex-1 py-1 rounded-lg text-xs font-bold ${lbTab === tab ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}
    >{label}</button>
  );

  return (
    <div className="p-2">
      <h3 className="text-sm font-bold text-yellow-300 mb-2">{t('sc.lb.title')}</h3>
      <div className="flex gap-1 mb-3">
        {tbtn('ranked', '🏅 Ranked')}
        {tbtn('local', t('sc.lb.local'))}
        {tbtn('friends', t('sc.lb.friends'))}
        {tbtn('global', t('sc.lb.global'))}
      </div>

      {lbTab === 'ranked' && (
        <div className="space-y-3">
          {!loggedIn ? (
            <p className="text-yellow-500/70 text-xs text-center py-4">Log in to view Ranked</p>
          ) : rankedLoading ? (
            <p className="text-gray-400 text-xs text-center py-4 animate-pulse">Loading ranked data...</p>
          ) : !rankedData ? (
            <p className="text-gray-500 text-xs text-center py-4">Play to start your ranked journey!</p>
          ) : (() => {
            const rd = rankedData;
            const seasonEnd = new Date(rd.seasonEnd);
            const now = new Date();
            const daysLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const seasonLabel = (() => {
              const [y, m] = rd.season.split('-');
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${months[parseInt(m) - 1]} ${y}`;
            })();

            return (
              <>
                <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{RANK_ICONS[rd.rank] || '🏅'}</span>
                      <span className="text-sm font-bold" style={{ color: RANK_COLORS[rd.rank] || '#fff' }}>{rd.rank}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Season: {seasonLabel}</p>
                      <p className="text-[10px] text-gray-500">{daysLeft}d left</p>
                    </div>
                  </div>

                  {rd.position !== null && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-gray-400">Position:</span>
                      <span className="text-xs font-bold text-white">#{rd.position}</span>
                      <span className="text-[10px] text-gray-500">of {rd.totalPlayers}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-400">Season Sigmas:</span>
                    <span className="text-xs font-bold text-cyan-300">{formatNum(rd.seasonSigmas)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-400">Season Rebirths:</span>
                    <span className="text-xs font-bold text-purple-300">🔄 {formatNum(rd.seasonRebirths)}</span>
                  </div>

                  {rd.nextTier && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[9px] mb-1">
                        <span style={{ color: RANK_COLORS[rd.currentTier?.name || 'Bronze'] }}>{rd.currentTier?.name}</span>
                        <span style={{ color: RANK_COLORS[rd.nextTier.name] }}>{rd.nextTier.name}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(2, rd.progressToNext * 100)}%`,
                            background: `linear-gradient(90deg, ${RANK_COLORS[rd.currentTier?.name || 'Bronze']}, ${RANK_COLORS[rd.nextTier.name]})`,
                          }} />
                      </div>
                      <p className="text-[9px] text-gray-500 mt-1 text-center">{formatNum(rd.nextTier.minSigmas - rd.seasonSigmas)} sigmas to {rd.nextTier.name}</p>
                    </div>
                  )}

                  {rd.rank === 'Grandmaster' && !rd.nextTier && (
                    <div className="mt-2">
                      <p className="text-[9px] text-center" style={{ color: RANK_COLORS.Legend }}>
                        ⚡ Reach Top 3 to become Legend ⚡
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white/[0.03] rounded-xl p-2 border border-white/10">
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Rank Tiers</h4>
                  <div className="space-y-1">
                    {[...rd.tiers, { name: 'Legend', minSigmas: -1, color: '#FF6B35' }].map((tier) => {
                      const isCurrentRank = tier.name === rd.rank;
                      const isAchieved = tier.name !== 'Legend'
                        ? rd.seasonSigmas >= tier.minSigmas
                        : rd.rank === 'Legend';
                      return (
                        <div key={tier.name}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] ${isCurrentRank ? 'bg-white/10 border border-white/20' : 'opacity-60'}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{RANK_ICONS[tier.name]}</span>
                            <span className="font-bold" style={{ color: tier.color }}>{tier.name}</span>
                          </div>
                          <span className="text-gray-400">
                            {tier.name === 'Legend' ? 'Top 3' : formatNum(tier.minSigmas)}
                            {isAchieved && ' ✓'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {rd.leaderboard.length > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-2 border border-white/10">
                    <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Season Leaderboard</h4>
                    <div className="space-y-1">
                      {rd.leaderboard.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5 border border-white/5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[10px] font-bold shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                              #{entry.position}
                            </span>
                            {entry.profilePic ? (
                              <img src={entry.profilePic} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[7px] font-bold text-white shrink-0">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[10px] font-medium truncate" style={{ color: entry.nameColor || '#fff' }}>{entry.username}</span>
                            <span className="text-[8px]" style={{ color: RANK_COLORS[entry.rank] }}>{RANK_ICONS[entry.rank]}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-white font-bold">{formatNum(entry.seasonSigmas)}</span>
                            <span className="text-[8px] text-purple-400">🔄{entry.seasonRebirths || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rd.history.length > 0 && (
                  <div className="bg-white/[0.03] rounded-xl p-2 border border-white/10">
                    <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Past Seasons</h4>
                    <div className="space-y-1">
                      {rd.history.map((h, i) => {
                        const [y, m] = h.season.split('-');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return (
                          <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5">
                            <span className="text-[10px] text-gray-400">{months[parseInt(m) - 1]} {y}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold" style={{ color: RANK_COLORS[h.rank] || '#fff' }}>{RANK_ICONS[h.rank]} {h.rank}</span>
                              <span className="text-[8px] text-purple-400">🔄{h.rebirths || 0}</span>
                              {h.position && <span className="text-[9px] text-gray-500">#{h.position}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[9px] text-gray-600 text-center">Ranks reset on the 1st of each month. Earn sigmas & rebirths to climb!</p>
              </>
            );
          })()}
        </div>
      )}

      {lbTab === 'local' && (
        <div className="space-y-1.5">
          {localHistory.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">{t('sc.lb.noRuns')}</p>
          ) : localHistory.map((e: any, i: number) => (
            <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 border border-white/10">
              <span className="text-xs text-gray-400">#{i + 1} &middot; {e.date}</span>
              <div className="text-right">
                <span className="text-white text-xs font-bold">{formatNum(e.lifetimeSigmas)}</span>
                {e.rebirths > 0 && <span className="text-purple-300 text-xs ml-2">✦{e.rebirths}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {lbTab === 'friends' && (
        <FriendLeaderboard loggedIn={loggedIn} onViewProfile={setViewProfileId} />
      )}

      {lbTab === 'global' && (
        <div className="space-y-1.5">
          {!loggedIn ? (
            <p className="text-yellow-500/70 text-xs text-center py-4">{t('sc.lb.loginGlobal')}</p>
          ) : loading ? (
            <p className="text-gray-400 text-xs text-center py-4 animate-pulse">{t('sc.lb.loading')}</p>
          ) : globalEntries.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">{t('sc.lb.noEntries')}</p>
          ) : globalEntries.map((e, i) => {
            const lbBorderStyle = e.equippedBorder ? (BORDER_STYLES[e.equippedBorder] || {}) : (e.activeBorder ? { border: `2px solid ${e.activeBorder}` } : {});
            const lbTitle = e.equippedTitle ? MASTERY_TITLES.find(t => t.id === e.equippedTitle) : null;
            return (
            <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-2 border border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                  #{i + 1}
                </span>
                {e.profilePic ? (
                  <>
                    <img src={e.profilePic} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" style={lbBorderStyle} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; const fb = (ev.target as HTMLImageElement).nextElementSibling; if (fb) (fb as HTMLElement).style.display = 'flex'; }} />
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ display: 'none', ...lbBorderStyle }}>
                      {e.username.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={lbBorderStyle}>
                    {e.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-medium truncate hover:underline cursor-pointer"
                      style={{ color: e.nameColor || '#ffffff' }}
                      onClick={() => e.userId && setViewProfileId(e.userId)}
                    >{e.username}</span>
                    {(e.equippedBadges || []).slice(0, 3).map(bid => {
                      const badge = SC_BADGES.find(b => b.id === bid);
                      return badge ? (
                        <span key={bid} title={badge.name} className="inline-flex items-center">
                          {badge.icon.startsWith('/') ? <span className="inline-block w-4 h-4 overflow-hidden rounded"><img src={badge.icon} alt={badge.name} className="w-full h-full object-contain scale-[2]" /></span> : <span className="text-[9px]">{badge.icon}</span>}
                        </span>
                      ) : null;
                    })}
                  </div>
                  {lbTitle && <p className={`text-[8px] font-bold leading-none ${lbTitle.cssClass || ''}`} style={{ color: RARITY_COLORS[lbTitle.rarity] }}>{lbTitle.name}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-white text-xs font-bold">{formatNum(e.lifetimeSigmas)}</span>
                {e.rebirths > 0 && <span className="text-purple-300 text-xs ml-2">✦{e.rebirths}</span>}
              </div>
            </div>
            );
          })}
          <div className="bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/20 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-cyan-300 text-xs font-bold">{t('sc.lb.you')}</span>
              <div className="text-right">
                <span className="text-white text-xs font-bold">{formatNum(gs.lifetimeSigmas)}</span>
                {gs.rebirths > 0 && <span className="text-purple-300 text-xs ml-2">✦{gs.rebirths}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewProfileId && <MiniProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}
      </AnimatePresence>
    </div>
  );
}

export function NeonClicker() {
  const { state: appState, updateSigmaStats, buyItem } = useGameContext();
  const { t } = useLanguage();
  const [gs, setGs] = useState<GameState>(defaultState);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSaveReminder, setShowSaveReminder] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('upgrades');
  const [showAutoRebirthPrompt, setShowAutoRebirthPrompt] = useState(false);
  const [alphaOrbs, setAlphaOrbs] = useState<AlphaOrb[]>([]);
  const clickTimestampsRef = useRef<number[]>([]);
  const clickPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const [hasBrainFog, setHasBrainFog] = useState(false);
  const [puzzleCooldown, setPuzzleCooldown] = useState<number[]>([0, 0, 0]);
  const [activePuzzle, setActivePuzzle] = useState<number | null>(null);
  const [sessionStart] = useState(Date.now());
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [soundOn, setSoundOn] = useState(true);
  const [heat, setHeat] = useState(0);
  const [isOverheated, setIsOverheated] = useState(false);
  const [showRightIsland, setShowRightIsland] = useState(false);
  const [showLeftIsland, setShowLeftIsland] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [triviaActive, setTriviaActive] = useState(false);
  const [triviaCooldown, setTriviaCooldown] = useState(0);
  const [tempMultiplier, setTempMultiplier] = useState(1);
  const [tempMultEnd, setTempMultEnd] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const musicStarted = useRef(false);
  const orbBtnRef = useRef<HTMLDivElement>(null);
  const [cpmDisplay, setCpmDisplay] = useState(0);
  const [cosmeticToasts, setCosmeticToasts] = useState<{ id: string; name: string; icon: string; rarity: string }[]>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const [buyMode, setBuyMode] = useState<1 | 2 | 5 | 10 | 25 | 50 | 100 | 'max'>(1);
  const [buyWarning, setBuyWarning] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [comboGraceEnd, setComboGraceEnd] = useState(0);
  const [comboTick, setComboTick] = useState(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboDecayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastCritical, setLastCritical] = useState<{ mult: number; ts: number } | null>(null);
  const [treasureChests, setTreasureChests] = useState<TreasureChest[]>([]);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  const [goldenClickActive, setGoldenClickActive] = useState(false);
  const [sigmaGrindsetActive, setSigmaGrindsetActive] = useState(false);
  const grindsetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [goldenClickEnd, setGoldenClickEnd] = useState(0);

  const [now, setNow] = useState(Date.now);
  const puzzleActive = (gs.puzzleExpiry || [0, 0, 0]).map(e => e > now);
  const puzzleMult = PUZZLE_REWARDS_DATA.reduce((acc, pr, i) => puzzleActive[i] ? acc * pr.mult : acc, 1);
  const has2xBoost = appState.inventory.includes('sigma-2x-boost');
  const hasAutoClicker = appState.inventory.includes('sigma-auto-clicker');
  const hasAutoRebirth = appState.inventory.includes('sigma-auto-rebirth');
  const isOwner = appState.isOwner;
  const heatShieldCount = appState.inventory.filter((x: string) => x === 'sigma-heat-shield').length;
  const hasHeatShield = heatShieldCount > 0;
  const hasGoldenOrb = appState.inventory.includes('sigma-golden-orb');
  const hasNeonOrb = appState.inventory.includes('sigma-neon-orb');
  const hasIslandTheme = appState.inventory.includes('sigma-island-theme');
  const storeClickMult = has2xBoost ? 2 : 1;
  const pu = gs.prestigeUpgrades || {};
  const sl = gs.synergyLevels || {};
  const prestigeAura = 1 + (pu.auraBoost || 0) * 1.0;
  const prestigeMult = getPrestigeMultiplier(gs.rebirths);
  const effectiveAura = prestigeMult * prestigeAura;
  const prestigeCritChance = Math.min(0.5, (pu.critChance || 0) * 0.05);
  const comboWindowBonus = (pu.comboExtend || 0) * 500;
  const comboBonusMult = 1 + (pu.comboExtend || 0) * 0.10;
  const orbSpawnMult = 1 + (pu.orbFrequency || 0) * 0.15;
  const orbValueMult = 1 + (pu.orbFrequency || 0) * 0.20;
  const globalMultBonus = 1 + (gs.globalMultiplierLevel || 0) * 0.25;
  const synergyGlobal = SYNERGY_UPGRADES.find(s => s.id === 'global-mult')?.effect(sl['global-mult'] || 0) || 1;
  const synergyIdleFromClick = SYNERGY_UPGRADES.find(s => s.id === 'click-idle')?.effect(sl['click-idle'] || 0) || 1;
  const synergyClickFromIdle = SYNERGY_UPGRADES.find(s => s.id === 'idle-click')?.effect(sl['idle-click'] || 0) || 1;
  const mewJawMult = SYNERGY_UPGRADES.find(s => s.id === 'mew-jaw')?.effect(sl['mew-jaw'] || 0) || 1;
  const gymSleepMult = SYNERGY_UPGRADES.find(s => s.id === 'gym-sleep')?.effect(sl['gym-sleep'] || 0) || 1;
  const goldenMult = goldenClickActive ? 5 : 1;
  const grindsetMult = sigmaGrindsetActive ? 3 : 1;
  const valueScale = gs.rebirths > 0 ? getRebirthCostScale(gs.rebirths - 1) : 1;
  const clickBase = 1 + CLICK_UPGRADES.reduce((a, u) => {
    const owned = gs.ownedClick[u.id] || 0;
    const milestone = getMilestoneMultiplier(owned);
    const val = u.value * valueScale * owned * milestone;
    return a + (u.id === 'jawline' ? val * mewJawMult : val);
  }, 0);
  const clickPower = Math.floor(clickBase * effectiveAura * puzzleMult * tempMultiplier * storeClickMult * globalMultBonus * synergyGlobal * synergyClickFromIdle * goldenMult * grindsetMult);
  const idleBase = IDLE_UPGRADES.reduce((a, u) => {
    const owned = gs.ownedIdle[u.id] || 0;
    const milestone = getMilestoneMultiplier(owned);
    const val = u.value * valueScale * owned * milestone;
    return a + (u.id === 'sleep' ? val * gymSleepMult : val);
  }, 0);
  const idlePower = Math.floor(idleBase * effectiveAura * puzzleMult * tempMultiplier * globalMultBonus * synergyGlobal * synergyIdleFromClick);
  const waterParkTier = getWaterParkTier(gs.totalUpgrades);
  const starPositions = useMemo(() => Array.from({ length: 25 }, () => ({
    x: Math.random() * 100, y: Math.random() * 45,
    size: 1 + Math.random() * 2, dur: 2 + Math.random() * 3, delay: Math.random() * 3,
  })), []);
  const timeOfDay = getTimeOfDay(gs.sigmasSinceRebirth || gs.lifetimeSigmas, gs.rebirths);
  const skyGradient = getSkyGradient(timeOfDay.phase, timeOfDay.progress);
  const sun = getSunPosition(timeOfDay.phase, timeOfDay.progress);
  const isNight = timeOfDay.phase === 'night';
  const sandColor = hasIslandTheme
    ? (isNight ? 'hsl(280, 40%, 25%)' : timeOfDay.phase === 'sunset' ? 'hsl(270, 50%, 45%)' : 'hsl(290, 60%, 65%)')
    : (isNight ? 'hsl(38, 40%, 30%)' : timeOfDay.phase === 'sunset' ? 'hsl(35, 55%, 50%)' : 'hsl(43, 70%, 72%)');

  const cpm = cpmDisplay;

  useEffect(() => {
    updateSigmaStats(gs.lifetimeSigmas, gs.rebirths, gs.rawClicks);
  }, [gs.lifetimeSigmas, gs.rebirths, gs.rawClicks]);

  useEffect(() => {
    const gsWithTime = { ...gs, lifetimeHoursPlayed: gs.lifetimeHoursPlayed + (Date.now() - startTimeRef.current) / 3600000 };
    const newUnlocks: string[] = [];
    ALL_COSMETICS.forEach(item => {
      if (!(gs.unlockedCosmetics || []).includes(item.id) && item.check(gsWithTime)) {
        newUnlocks.push(item.id);
      }
    });
    (appState.inventory || []).forEach((itemId: string) => {
      if (itemId.startsWith('badge-') && ALL_COSMETICS.some(c => c.id === itemId) && !(gs.unlockedCosmetics || []).includes(itemId) && !newUnlocks.includes(itemId)) {
        newUnlocks.push(itemId);
      }
    });
    if (newUnlocks.length > 0) {
      setGs(prev => ({ ...prev, unlockedCosmetics: [...(prev.unlockedCosmetics || []), ...newUnlocks] }));
      const newToasts = newUnlocks.map(id => {
        const item = ALL_COSMETICS.find(c => c.id === id);
        if (!item) return null;
        return { id, name: item.name, icon: item.icon || '🏆', rarity: item.rarity };
      }).filter((t): t is NonNullable<typeof t> => t !== null && !prevUnlockedRef.current.has(t.id));
      if (newToasts.length > 0) {
        setCosmeticToasts(prev => [...prev, ...newToasts]);
        newToasts.forEach(t => prevUnlockedRef.current.add(t.id));
        setTimeout(() => setCosmeticToasts(prev => prev.slice(newToasts.length)), 4000);
      }
    }
  }, [gs.rawClicks, gs.lifetimeSigmas, gs.rebirths, gs.totalUpgrades, gs.focusGameWins, gs.totalPuzzlesSolved, gs.brainFogTriggers, gs.orbsCollected, gs.lifetimeHoursPlayed, gs.ownedClick, gs.ownedIdle, gs.puzzleExpiry, now, appState.inventory]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGs(prev => {
        const gsWithTime = { ...prev, lifetimeHoursPlayed: prev.lifetimeHoursPlayed + (Date.now() - startTimeRef.current) / 3600000 };
        const newUnlocks: string[] = [];
        ALL_COSMETICS.forEach(item => {
          if (!(prev.unlockedCosmetics || []).includes(item.id) && item.check(gsWithTime)) {
            newUnlocks.push(item.id);
          }
        });
        if (newUnlocks.length > 0) {
          const newToasts = newUnlocks.map(id => {
            const item = ALL_COSMETICS.find(c => c.id === id);
            if (!item) return null;
            return { id, name: item.name, icon: item.icon || '🏆', rarity: item.rarity };
          }).filter((t): t is NonNullable<typeof t> => t !== null && !prevUnlockedRef.current.has(t.id));
          if (newToasts.length > 0) {
            setCosmeticToasts(p => [...p, ...newToasts]);
            newToasts.forEach(t => prevUnlockedRef.current.add(t.id));
            setTimeout(() => setCosmeticToasts(p => p.slice(newToasts.length)), 4000);
          }
          return { ...prev, unlockedCosmetics: [...(prev.unlockedCosmetics || []), ...newUnlocks] };
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (gs.unlockedCosmetics) {
      prevUnlockedRef.current = new Set(gs.unlockedCosmetics);
    }
  }, [loaded]);

  const equipTitle = (id: string) => {
    setGs(prev => ({ ...prev, equippedTitle: prev.equippedTitle === id ? null : id }));
  };
  const equipBorder = (id: string) => {
    setGs(prev => ({ ...prev, equippedBorder: prev.equippedBorder === id ? null : id }));
  };
  const equipBadge = (id: string) => {
    setGs(prev => {
      const badges = prev.equippedBadges || [];
      if (badges.includes(id)) {
        return { ...prev, equippedBadges: badges.filter(b => b !== id) };
      }
      if (badges.length >= 3) {
        return { ...prev, equippedBadges: [...badges.slice(1), id] };
      }
      return { ...prev, equippedBadges: [...badges, id] };
    });
  };

  const saveProgress = useCallback(async (currentGs: GameState) => {
    const toSave = { ...currentGs, lifetimeHoursPlayed: currentGs.lifetimeHoursPlayed + (Date.now() - startTimeRef.current) / 3600000, lastSaveTimestamp: Date.now() };
    if (appState.authMode !== 'logged_in') {
      localStorage.setItem('sigmaClicker_v2', JSON.stringify(toSave));
      setSaveStatus('saved');
      return;
    }
    setSaveStatus('saving');
    try {
      const pt = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await progressApi.save(GAME_ID, toSave, pt);
      setSaveStatus('saved');
    } catch {
      localStorage.setItem('sigmaClicker_v2', JSON.stringify(toSave));
      setSaveStatus('unsaved');
    }
  }, [appState.authMode]);

  useEffect(() => {
    const load = async () => {
      let data: GameState | null = null;
      if (appState.authMode === 'logged_in') {
        try {
          const res = await progressApi.get(GAME_ID);
          if (res.progress) data = res.progress as unknown as GameState;
        } catch {}
      }
      if (!data) {
        try {
          const local = localStorage.getItem('sigmaClicker_v2');
          if (local) data = JSON.parse(local);
        } catch {}
      }
      if (data) {
        const merged = { ...defaultState, ...data };
        if (!merged._prestigeRebalanceV3) {
          const oldUpgrades = merged.prestigeUpgrades || {};
          let refundedPoints = 0;
          const UPGRADE_COSTS: Record<string, number> = {};
          PRESTIGE_UPGRADES.forEach(u => { UPGRADE_COSTS[u.id] = u.cost; });
          const newUpgrades: Record<string, number> = {};
          for (const [id, level] of Object.entries(oldUpgrades)) {
            const upg = PRESTIGE_UPGRADES.find(u => u.id === id);
            if (!upg) {
              refundedPoints += (level as number) * (UPGRADE_COSTS[id] || 1);
              continue;
            }
            const clamped = Math.min(level as number, upg.maxLevel);
            const excess = (level as number) - clamped;
            refundedPoints += excess * upg.cost;
            newUpgrades[id] = clamped;
          }
          merged.prestigeUpgrades = newUpgrades;
          merged.prestigePoints = (merged.prestigePoints || 0) + refundedPoints;
          merged._prestigeRebalanceV3 = true;
        }
        if (merged.lastSaveTimestamp && merged.lastSaveTimestamp > 0) {
          const elapsedSec = Math.floor((Date.now() - merged.lastSaveTimestamp) / 1000);
          if (elapsedSec > 60) {
            const offlineRebirths = merged.rebirths || 0;
            const offlineValueScale = offlineRebirths > 0 ? getRebirthCostScale(offlineRebirths - 1) : 1;
            const baseIdle = IDLE_UPGRADES.reduce((a, u) => a + u.value * offlineValueScale * (merged.ownedIdle[u.id] || 0), 0);
            if (baseIdle > 0) {
              const cappedSec = Math.min(elapsedSec, 8 * 3600);
              const offlineRate = baseIdle;
              const earned = offlineRate * cappedSec;
              merged.sigmas += earned;
              merged.lifetimeSigmas += earned;
              merged.sigmasSinceRebirth = (merged.sigmasSinceRebirth || 0) + earned;
              merged.totalOfflineEarnings = (merged.totalOfflineEarnings || 0) + earned;
              setOfflineEarnings(earned);
              setTempMultiplier(2);
              setTempMultEnd(Date.now() + 300000);
            }
          }
        }
        setGs(merged);
      }
      setLoaded(true);
    };
    load();
  }, [appState.authMode]);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveProgress(gs), 8000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [gs, loaded, saveProgress]);

  useEffect(() => {
    if (!loaded) return;
    const autoSaveInterval = setInterval(() => {
      saveProgress(gs);
    }, 180000);
    return () => clearInterval(autoSaveInterval);
  }, [loaded, gs, saveProgress]);

  useEffect(() => {
    if (!loaded) return;
    const reminderInterval = setInterval(() => {
      setShowSaveReminder(true);
      setTimeout(() => setShowSaveReminder(false), 8000);
    }, 300000);
    return () => clearInterval(reminderInterval);
  }, [loaded]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') {
        const msg = '⚠️ You have unsaved progress in Sigma Clicker! Click Save before leaving.';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  useEffect(() => {
    const autoClickPower = hasAutoClicker ? clickPower * 10 : 0;
    const ownerAutoClickPower = isOwner ? clickPower * 50 : 0;
    const totalAutoPower = autoClickPower + ownerAutoClickPower;
    if (idlePower > 0 || totalAutoPower > 0) {
      const iv = setInterval(() => {
        setGs(prev => {
          const idleEarned = hasBrainFog ? Math.floor(idlePower * 0.1) : idlePower;
          const autoEarned = hasBrainFog ? 0 : totalAutoPower;
          const total = idleEarned + autoEarned;
          return { ...prev, sigmas: prev.sigmas + total, lifetimeSigmas: prev.lifetimeSigmas + total, sigmasSinceRebirth: (prev.sigmasSinceRebirth || 0) + total };
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [idlePower, hasBrainFog, hasAutoClicker, clickPower, isOwner]);

  useEffect(() => {
    if (!hasAutoRebirth) return;
    const iv = setInterval(() => {
      const threshold = getPrestigeThreshold(gs.rebirths);
      const reqs = getPrestigeRequirements();
      if (gs.sigmas >= threshold && reqs.met && !showAutoRebirthPrompt) {
        setShowAutoRebirthPrompt(true);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [hasAutoRebirth, gs.sigmas, gs.rebirths, showAutoRebirthPrompt]);

  useEffect(() => {
    const iv = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const elapsed = n - sessionStart;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      setSessionTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [sessionStart]);

  useEffect(() => {
    const spawnOrb = () => {
      setAlphaOrbs(prev => {
        if (prev.length >= 2) return prev;
        const zones = [
          { xMin: 5, xMax: 25, yMin: 10, yMax: 45 },
          { xMin: 75, xMax: 95, yMin: 10, yMax: 45 },
          { xMin: 30, xMax: 70, yMin: 55, yMax: 75 },
        ];
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const orbBonusLevel = (pu.orbBonus || 0);
        const orbValPrestige = 1 + (pu.orbFrequency || 0) * 0.20;
        const orb: AlphaOrb = {
          id: Date.now() + Math.random(),
          x: Math.random() * (zone.xMax - zone.xMin) + zone.xMin,
          y: Math.random() * (zone.yMax - zone.yMin) + zone.yMin,
          bonus: Math.floor(((clickPower * 150) + (idlePower * 60)) * (1 + orbBonusLevel) * orbValPrestige),
          spawned: Date.now(),
        };
        return [...prev, orb];
      });
    };
    const baseInterval = 12000 + Math.random() * 10000;
    const orbSpawnRate = 1 + ((pu.orbFrequency || 0) * 0.15);
    const iv = setInterval(spawnOrb, baseInterval / orbSpawnRate);
    const initial = setTimeout(spawnOrb, 5000);
    return () => { clearInterval(iv); clearTimeout(initial); };
  }, [clickPower, idlePower]);

  useEffect(() => {
    const iv = setInterval(() => {
      setAlphaOrbs(prev => prev.filter(o => Date.now() - o.spawned < 6000));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const spawnChest = () => {
      setTreasureChests(prev => {
        if (prev.length >= 1) return prev;
        const roll = rollChestRarity();
        const reward = Math.floor((clickPower * roll.multMin + idlePower * roll.multMax) * (1 + Math.random()));
        const chestZones = [
          { xMin: 5, xMax: 30, yMin: 60, yMax: 80 },
          { xMin: 70, xMax: 95, yMin: 60, yMax: 80 },
          { xMin: 30, xMax: 70, yMin: 75, yMax: 88 },
        ];
        const cz = chestZones[Math.floor(Math.random() * chestZones.length)];
        const chest: TreasureChest = {
          id: Date.now() + Math.random(),
          x: Math.random() * (cz.xMax - cz.xMin) + cz.xMin,
          y: Math.random() * (cz.yMax - cz.yMin) + cz.yMin,
          hitsNeeded: roll.hits,
          hitsReceived: 0,
          reward: Math.max(reward, 100),
          rarity: roll.rarity,
          spawned: Date.now(),
        };
        return [...prev, chest];
      });
    };
    const iv = setInterval(spawnChest, 30000 + Math.random() * 30000);
    const initial = setTimeout(spawnChest, 15000);
    return () => { clearInterval(iv); clearTimeout(initial); };
  }, [clickPower, idlePower]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTreasureChests(prev => prev.filter(c => Date.now() - c.spawned < 30000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const hitChest = (chestId: number) => {
    setTreasureChests(prev => prev.map(c => {
      if (c.id !== chestId) return c;
      const newHits = c.hitsReceived + 1;
      if (newHits >= c.hitsNeeded) {
        soundEngine.playChestOpen();
        setGs(p => ({
          ...p,
          sigmas: p.sigmas + c.reward,
          lifetimeSigmas: p.lifetimeSigmas + c.reward,
          sigmasSinceRebirth: (p.sigmasSinceRebirth || 0) + c.reward,
          chestsOpened: (p.chestsOpened || 0) + 1,
          legendaryChests: c.rarity === 'legendary' ? (p.legendaryChests || 0) + 1 : (p.legendaryChests || 0),
        }));
        return { ...c, hitsReceived: newHits };
      }
      soundEngine.playClick();
      return { ...c, hitsReceived: newHits };
    }).filter(c => c.hitsReceived < c.hitsNeeded));
  };

  useEffect(() => {
    if (combo > 0) {
      const iv = setInterval(() => setComboTick(Date.now()), 500);
      return () => clearInterval(iv);
    }
  }, [combo > 0]);

  useEffect(() => {
    if (goldenClickEnd > 0) {
      const iv = setInterval(() => {
        if (Date.now() >= goldenClickEnd) {
          setGoldenClickActive(false);
          setGoldenClickEnd(0);
        }
      }, 500);
      return () => clearInterval(iv);
    }
  }, [goldenClickEnd]);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      clickTimestampsRef.current = clickTimestampsRef.current.filter(t => now - t < 60000);
      setCpmDisplay(clickTimestampsRef.current.length);

      if (hasBrainFog) return;
      const recentClicks = clickTimestampsRef.current.filter(t => now - t < 3000);

      const cps = recentClicks.length / 3;
      if (cps > 15 && recentClicks.length > 45) {
        const intervals: number[] = [];
        for (let i = 1; i < recentClicks.length; i++) {
          intervals.push(recentClicks[i] - recentClicks[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
        if (variance < 15) {
          setHasBrainFog(true);
          setGs(p => ({ ...p, brainFogTriggers: (p.brainFogTriggers || 0) + 1 }));
          return;
        }
      }
    }, 500);
    return () => clearInterval(iv);
  }, [hasBrainFog]);

  useEffect(() => {
    const iv = setInterval(() => {
      setPuzzleCooldown(prev => prev.map(c => Math.max(0, c - 1)));
      setTriviaCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const shieldMult = 1 + (heatShieldCount * 0.02);
    const iv = setInterval(() => {
      if (isOverheated) {
        setHeat(prev => {
          const next = Math.max(0, prev - 2 * shieldMult);
          if (next <= 0) setIsOverheated(false);
          return next;
        });
      } else {
        setHeat(prev => Math.max(0, prev - 0.8 * shieldMult));
      }
    }, 100);
    return () => clearInterval(iv);
  }, [isOverheated, heatShieldCount]);

  useEffect(() => {
    if (tempMultEnd > 0) {
      const iv = setInterval(() => {
        if (Date.now() >= tempMultEnd) {
          setTempMultiplier(1);
          setTempMultEnd(0);
        }
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [tempMultEnd]);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopHoldClick = useCallback(() => {
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    if (holdTimeoutRef.current) { clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; }
  }, []);

  const startHoldClick = useCallback(() => {
    stopHoldClick();
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        const btn = orbBtnRef.current?.querySelector('button');
        if (btn && !btn.disabled) btn.click();
        else stopHoldClick();
      }, 250);
    }, 400);
  }, [stopHoldClick]);

  useEffect(() => {
    return () => stopHoldClick();
  }, [stopHoldClick]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasBrainFog || isOverheated) return;

    setHeat(prev => {
      const next = Math.min(100, prev + 3.5);
      if (next >= 100 && !isOverheated) {
        setIsOverheated(true);
        setCombo(c => {
          const newCombo = c + 1;
          const comboBonus = Math.floor(clickPower * (1 + newCombo * 0.15) * comboBonusMult);
          soundEngine.playCombo();
          setGs(p => ({
            ...p,
            sigmas: p.sigmas + comboBonus,
            lifetimeSigmas: p.lifetimeSigmas + comboBonus,
            sigmasSinceRebirth: (p.sigmasSinceRebirth || 0) + comboBonus,
            totalComboBonus: (p.totalComboBonus || 0) + comboBonus,
            maxCombo: Math.max(p.maxCombo || 0, newCombo),
          }));
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          if (comboDecayRef.current) clearTimeout(comboDecayRef.current);
          setComboGraceEnd(Date.now() + 30000 + comboWindowBonus);
          const startDecay = () => {
            const decayTick = () => {
              setCombo(c => {
                if (c <= 0) return 0;
                const next = c - 1;
                if (next > 0) {
                  const delay = next >= 8 ? 5000 : next >= 4 ? 8000 : next >= 2 ? 12000 : 15000;
                  comboDecayRef.current = setTimeout(decayTick, delay);
                }
                return next;
              });
            };
            decayTick();
          };
          comboTimerRef.current = setTimeout(startDecay, 30000 + comboWindowBonus);
          return newCombo;
        });
      }
      return next;
    });

    if (grindsetTimerRef.current) clearTimeout(grindsetTimerRef.current);
    grindsetTimerRef.current = setTimeout(() => {
      setSigmaGrindsetActive(false);
    }, 3000);

    const now10 = Date.now();
    const recentClicks10 = clickTimestampsRef.current.filter(t => now10 - t < 10000);
    if (recentClicks10.length >= 15 && !sigmaGrindsetActive) {
      setSigmaGrindsetActive(true);
    }

    if (!musicStarted.current) {
      musicStarted.current = true;
      soundEngine.startMusic();
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let critMult = 1;
    const critRoll = Math.random();
    const baseMegaCrit = 0.02;
    const baseCrit = 0.08;
    const megaCritChance = baseMegaCrit + prestigeCritChance * 0.4;
    const critChance = baseCrit + prestigeCritChance;
    if (critRoll < megaCritChance) {
      critMult = 20;
      soundEngine.playCritical();
      setLastCritical({ mult: 20, ts: Date.now() });
      setTimeout(() => setLastCritical(null), 1500);
    } else if (critRoll < critChance) {
      critMult = 5;
      soundEngine.playCritical();
      setLastCritical({ mult: 5, ts: Date.now() });
      setTimeout(() => setLastCritical(null), 1500);
    } else {
      soundEngine.playClick();
    }

    const power = Math.floor(clickPower * critMult);
    setGs(prev => ({
      ...prev,
      sigmas: prev.sigmas + power,
      rawClicks: prev.rawClicks + 1,
      lifetimeSigmas: prev.lifetimeSigmas + power,
      sigmasSinceRebirth: (prev.sigmasSinceRebirth || 0) + power,
      criticalHits: critMult > 1 ? (prev.criticalHits || 0) + 1 : (prev.criticalHits || 0),
    }));
    clickTimestampsRef.current.push(Date.now());
    clickPositionsRef.current = [...clickPositionsRef.current.slice(-20), { x, y }];

    const btn = orbBtnRef.current;
    if (btn) {
      const numEl = document.createElement('div');
      numEl.textContent = critMult > 1 ? `⚡ CRIT x${critMult}! +${formatNum(power)}` : `+${formatNum(power)}`;
      const numColor = critMult >= 20 ? '#f59e0b' : critMult >= 10 ? '#f97316' : '#fde047';
      const numSize = critMult > 1 ? '24px' : '18px';
      numEl.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);pointer-events:none;z-index:30;font-size:${numSize};font-weight:900;color:${numColor};text-shadow:0 2px 4px rgba(0,0,0,0.6);animation:floatUp 0.7s ease-out forwards;`;
      btn.appendChild(numEl);
      setTimeout(() => numEl.remove(), 700);

      const container = containerRef.current;
      if (container) {
        const cx = e.clientX - container.getBoundingClientRect().left;
        const cy = e.clientY - container.getBoundingClientRect().top;
        const ripple = document.createElement('div');
        ripple.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:120px;height:120px;border-radius:50%;pointer-events:none;z-index:15;background:radial-gradient(circle,rgba(6,182,212,0.3) 0%,rgba(6,182,212,0) 70%);animation:clickRipple 0.5s ease-out forwards;`;
        container.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);

        const ring = document.createElement('div');
        ring.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:80px;height:80px;border-radius:50%;pointer-events:none;z-index:15;border:2px solid rgba(6,182,212,0.5);animation:clickRing 0.4s ease-out forwards;`;
        container.appendChild(ring);
        setTimeout(() => ring.remove(), 400);
      }
    }
  };

  const grabOrb = (orb: AlphaOrb) => {
    soundEngine.playOrb();
    setGs(prev => ({ ...prev, sigmas: prev.sigmas + orb.bonus, lifetimeSigmas: prev.lifetimeSigmas + orb.bonus, sigmasSinceRebirth: (prev.sigmasSinceRebirth || 0) + orb.bonus, orbsCollected: (prev.orbsCollected || 0) + 1 }));
    setAlphaOrbs(prev => prev.filter(o => o.id !== orb.id));
    if (Math.random() < 0.2 && !goldenClickActive) {
      setGoldenClickActive(true);
      setGoldenClickEnd(Date.now() + 30000);
    }
  };

  const costMult = 1 - Math.min(0.5, (pu.costReduction || 0) * 0.10);
  const rebirthScale = getRebirthCostScale(gs.rebirths);
  const getUpgradeScale = (u: { minRebirths?: number }) => getRebirthCostScale(gs.rebirths, u.minRebirths || 0);
  const getClickCost = (u: ClickUpgrade) => Math.floor(u.baseCost * getUpgradeScale(u) * Math.pow(u.growthFactor, gs.ownedClick[u.id] || 0) * costMult);
  const getIdleCost = (u: IdleUpgrade) => Math.floor(u.baseCost * getUpgradeScale(u) * Math.pow(u.growthFactor, gs.ownedIdle[u.id] || 0) * costMult);

  const getTotalCostForN = (baseCost: number, owned: number, n: number, growthFactor: number, scale: number) => {
    let total = 0;
    for (let i = 0; i < n; i++) {
      total += Math.floor(baseCost * scale * Math.pow(growthFactor, owned + i) * costMult);
    }
    return total;
  };

  const getClickTotalCost = (u: ClickUpgrade) => {
    const owned = gs.ownedClick[u.id] || 0;
    const scale = getUpgradeScale(u);
    const n = buyMode === 'max' ? getMaxBuyable(gs.sigmas, u.baseCost * scale, owned, costMult, u.growthFactor) : buyMode;
    return getTotalCostForN(u.baseCost, owned, n, u.growthFactor, scale);
  };

  const getIdleTotalCost = (u: IdleUpgrade) => {
    const owned = gs.ownedIdle[u.id] || 0;
    const scale = getUpgradeScale(u);
    const n = buyMode === 'max' ? getMaxBuyable(gs.sigmas, u.baseCost * scale, owned, costMult, u.growthFactor) : buyMode;
    return getTotalCostForN(u.baseCost, owned, n, u.growthFactor, scale);
  };

  const getMaxBuyable = (currentSigmas: number, baseCost: number, owned: number, costMultiplier: number, growthFactor: number = 1.18) => {
    let count = 0;
    let totalCost = 0;
    let sigmasLeft = currentSigmas;
    let lvl = owned;
    while (true) {
      const c = Math.floor(baseCost * Math.pow(growthFactor, lvl) * costMultiplier);
      if (sigmasLeft < c) break;
      sigmasLeft -= c;
      totalCost += c;
      count++;
      lvl++;
      if (count >= 1000) break;
    }
    return { count, totalCost };
  };

  const getBuyAmount = () => {
    if (buyMode === 'max') return 999;
    return buyMode;
  };

  const showBuyWarning = (msg: string) => {
    setBuyWarning(msg);
    setTimeout(() => setBuyWarning(null), 2000);
  };

  const buyClick = (u: ClickUpgrade) => {
    const amount = getBuyAmount();
    const scale = getUpgradeScale(u);
    const firstCost = Math.floor(u.baseCost * scale * Math.pow(u.growthFactor, gs.ownedClick[u.id] || 0) * costMult);
    if (gs.sigmas < firstCost) {
      showBuyWarning(`Not enough sigmas! Need ${formatNum(firstCost)}`);
      return;
    }
    let bought = 0;
    let totalSpent = 0;
    setGs(prev => {
      let sigmas = prev.sigmas;
      let owned = prev.ownedClick[u.id] || 0;
      for (let i = 0; i < amount; i++) {
        const cost = Math.floor(u.baseCost * scale * Math.pow(u.growthFactor, owned) * costMult);
        if (sigmas < cost) break;
        sigmas -= cost;
        totalSpent += cost;
        owned++;
        bought++;
      }
      if (bought === 0) return prev;
      soundEngine.playBuy();
      return {
        ...prev,
        sigmas,
        ownedClick: { ...prev.ownedClick, [u.id]: owned },
        totalUpgrades: prev.totalUpgrades + bought,
      };
    });
  };

  const buyIdle = (u: IdleUpgrade) => {
    const amount = getBuyAmount();
    const scale = getUpgradeScale(u);
    const firstCost = Math.floor(u.baseCost * scale * Math.pow(u.growthFactor, gs.ownedIdle[u.id] || 0) * costMult);
    if (gs.sigmas < firstCost) {
      showBuyWarning(`Not enough sigmas! Need ${formatNum(firstCost)}`);
      return;
    }
    setGs(prev => {
      let sigmas = prev.sigmas;
      let owned = prev.ownedIdle[u.id] || 0;
      let bought = 0;
      for (let i = 0; i < amount; i++) {
        const cost = Math.floor(u.baseCost * scale * Math.pow(u.growthFactor, owned) * costMult);
        if (sigmas < cost) break;
        sigmas -= cost;
        owned++;
        bought++;
      }
      if (bought === 0) return prev;
      soundEngine.playBuy();
      return {
        ...prev,
        sigmas,
        ownedIdle: { ...prev.ownedIdle, [u.id]: owned },
        totalUpgrades: prev.totalUpgrades + bought,
      };
    });
  };

  const buySynergy = (syn: SynergyUpgradeData) => {
    setGs(prev => {
      const prevSl = prev.synergyLevels || {};
      const level = prevSl[syn.id] || 0;
      if (level >= syn.maxLevel) return prev;
      const cost = Math.floor(syn.baseCost * rebirthScale * Math.pow(1.5, level));
      if (prev.sigmas < cost) return prev;
      soundEngine.playBuy();
      return {
        ...prev,
        sigmas: prev.sigmas - cost,
        synergyLevels: { ...prevSl, [syn.id]: level + 1 },
      };
    });
  };

  const buyGlobalMult = () => {
    setGs(prev => {
      const level = prev.globalMultiplierLevel || 0;
      if (level >= GLOBAL_MULT_MAX) return prev;
      const cost = Math.floor(GLOBAL_MULT_COST_BASE * rebirthScale * Math.pow(2, level));
      if (prev.sigmas < cost) return prev;
      soundEngine.playBuy();
      return {
        ...prev,
        sigmas: prev.sigmas - cost,
        globalMultiplierLevel: level + 1,
      };
    });
  };

  const REBIRTH_THRESHOLD = getPrestigeThreshold(gs.rebirths);

  const PRESTIGE_REQUIRED_UPGRADES: { rebirths: number; click: string[]; idle: string[] }[] = [
    { rebirths: 0, click: ['mewing'], idle: ['gym'] },
    { rebirths: 1, click: ['mewing', 'jawline', 'bonesmash'], idle: ['gym', 'creatine', 'tren'] },
    { rebirths: 2, click: ['mewing', 'jawline', 'bonesmash', 'looksmax', 'mogging'], idle: ['gym', 'creatine', 'tren', 'sleep', 'gigachad'] },
    { rebirths: 3, click: ['mewing', 'jawline', 'bonesmash', 'looksmax', 'mogging', 'sigma-aura'], idle: ['gym', 'creatine', 'tren', 'sleep', 'gigachad', 'sigma-factory'] },
  ];

  const getPrestigeRequirements = () => {
    const req = PRESTIGE_REQUIRED_UPGRADES.find(r => r.rebirths === gs.rebirths) ||
      (gs.rebirths >= 4 ? {
        click: CLICK_UPGRADES.filter(u => !u.minRebirths || u.minRebirths <= gs.rebirths).map(u => u.id),
        idle: IDLE_UPGRADES.filter(u => !u.minRebirths || u.minRebirths <= gs.rebirths).map(u => u.id),
      } : { click: ['mewing'], idle: ['gym'] });
    const missingClick = req.click.filter(id => (gs.ownedClick[id] || 0) < 1);
    const missingIdle = req.idle.filter(id => (gs.ownedIdle[id] || 0) < 1);
    return { missingClick, missingIdle, met: missingClick.length === 0 && missingIdle.length === 0 };
  };

  const prestigeReqs = getPrestigeRequirements();
  const canRebirth = gs.sigmas >= REBIRTH_THRESHOLD && prestigeReqs.met;

  const allClickMaxed = CLICK_UPGRADES.every(u => (gs.ownedClick[u.id] || 0) >= 500);
  const allIdleMaxed = IDLE_UPGRADES.every(u => (gs.ownedIdle[u.id] || 0) >= 500);
  const isEndgame = allClickMaxed && allIdleMaxed && gs.rebirths >= 10;

  const doRebirth = () => {
    if (!canRebirth) return;
    soundEngine.playRebirth();
    setGs(prev => {
      const prevPu = prev.prestigeUpgrades || {};
      const startSigmas = 0;
      const newRebirths = prev.rebirths + 1;
      return {
        ...defaultState,
        sigmas: startSigmas,
        rebirths: newRebirths,
        auraMult: getPrestigeMultiplier(newRebirths),
        lifetimeHoursPlayed: prev.lifetimeHoursPlayed,
        lifetimeSigmas: prev.lifetimeSigmas,
        rawClicks: prev.rawClicks,
        sigmasSinceRebirth: 0,
        unlockedCosmetics: prev.unlockedCosmetics,
        equippedTitle: prev.equippedTitle,
        equippedBorder: prev.equippedBorder,
        equippedBadges: prev.equippedBadges,
        focusGameWins: prev.focusGameWins,
        totalPuzzlesSolved: prev.totalPuzzlesSolved,
        brainFogTriggers: prev.brainFogTriggers,
        orbsCollected: prev.orbsCollected,
        prestigePoints: (prev.prestigePoints || 0) + 1,
        prestigeUpgrades: prev.prestigeUpgrades || {},
        criticalHits: prev.criticalHits || 0,
        maxCombo: prev.maxCombo || 0,
        chestsOpened: prev.chestsOpened || 0,
        legendaryChests: prev.legendaryChests || 0,
        totalOfflineEarnings: prev.totalOfflineEarnings || 0,
        totalComboBonus: prev.totalComboBonus || 0,
        synergyLevels: prev.synergyLevels || {},
        globalMultiplierLevel: prev.globalMultiplierLevel || 0,
        lastSaveTimestamp: Date.now(),
      };
    });
    setActiveTab('rebirth');
  };

  const exportSave = () => {
    const toExport = { ...gs, lifetimeHoursPlayed: gs.lifetimeHoursPlayed + (Date.now() - startTimeRef.current) / 3600000, lastSaveTimestamp: Date.now() };
    const data = JSON.stringify(toExport);
    const encoded = btoa(data);
    const blob = new Blob([encoded], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-clicker-save-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  };

  const importSave = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => {
      if (input.parentNode) document.body.removeChild(input);
    };
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { cleanup(); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = ev.target?.result as string;
          let decoded: string;
          try {
            decoded = atob(raw.trim());
          } catch {
            decoded = raw.trim();
          }
          const data = JSON.parse(decoded) as GameState;
          if (data.sigmas !== undefined && data.rebirths !== undefined) {
            const merged = { ...defaultState, ...data, lastSaveTimestamp: Date.now() };
            setGs(merged);
            localStorage.setItem('sigmaClicker_v2', JSON.stringify(merged));
            if (appState.authMode === 'logged_in') {
              progressApi.save(GAME_ID, merged).catch(() => {});
            }
            setSaveStatus('unsaved');
            alert('Save imported successfully!');
          } else {
            alert('Invalid save file: missing required game data.');
          }
        } catch (err) {
          alert('Failed to import save. Make sure you selected a valid Sigma Clicker save file.');
        }
        cleanup();
      };
      reader.onerror = () => {
        alert('Failed to read the file.');
        cleanup();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const [showTrueReset, setShowTrueReset] = useState(false);
  const doTrueReset = () => {
    setGs({ ...defaultState, lastSaveTimestamp: Date.now() });
    localStorage.removeItem('sigmaClicker_v2');
    setShowTrueReset(false);
    setActiveTab('upgrades');
  };

  const REFUND_COIN_COST = 10_000;
  const hasAnyPrestigeUpgrades = Object.values(gs.prestigeUpgrades || {}).some(v => v > 0);
  const canRefund = appState.coins >= REFUND_COIN_COST && hasAnyPrestigeUpgrades;

  const refundAllPrestige = () => {
    if (!canRefund) return;
    const purchased = buyItem('prestige-refund-token', REFUND_COIN_COST, true);
    if (!purchased) return;
    setGs(prev => {
      const pu = prev.prestigeUpgrades || {};
      let refunded = 0;
      for (const [id, level] of Object.entries(pu)) {
        const upg = PRESTIGE_UPGRADES.find(u => u.id === id);
        if (upg && typeof level === 'number') {
          refunded += level * upg.cost;
        }
      }
      return {
        ...prev,
        prestigePoints: (prev.prestigePoints || 0) + refunded,
        prestigeUpgrades: {},
      };
    });
  };

  const buyPrestigeUpgrade = (upg: PrestigeUpgradeData) => {
    const currentLevel = (gs.prestigeUpgrades || {})[upg.id] || 0;
    if (currentLevel >= upg.maxLevel) return;
    if ((gs.prestigePoints || 0) < upg.cost) return;
    setGs(prev => ({
      ...prev,
      prestigePoints: (prev.prestigePoints || 0) - upg.cost,
      prestigeUpgrades: { ...(prev.prestigeUpgrades || {}), [upg.id]: currentLevel + 1 },
    }));
  };

  const PUZZLE_DURATION_MS = 120_000;

  const puzzleWin = (idx: number) => {
    soundEngine.playPuzzleWin();
    setGs(prev => {
      const expiry = [...(prev.puzzleExpiry || [0, 0, 0])];
      expiry[idx] = Date.now() + PUZZLE_DURATION_MS;
      return { ...prev, puzzleExpiry: expiry, totalPuzzlesSolved: (prev.totalPuzzlesSolved || 0) + 1 };
    });
    setActivePuzzle(null);
  };

  const puzzleFail = (idx: number) => {
    soundEngine.playPuzzleFail();
    setPuzzleCooldown(prev => {
      const n = [...prev];
      n[idx] = 300;
      return n;
    });
    setActivePuzzle(null);
  };

  const triviaWin = () => {
    soundEngine.playPuzzleWin();
    const coinBonus = Math.max(1000, Math.floor(idlePower * 60 + clickPower * 30));
    const giveMultiplier = Math.random() > 0.5;
    if (giveMultiplier) {
      setTempMultiplier(2);
      setTempMultEnd(Date.now() + 60000);
    }
    setGs(prev => ({ ...prev, sigmas: prev.sigmas + coinBonus, lifetimeSigmas: prev.lifetimeSigmas + coinBonus, sigmasSinceRebirth: (prev.sigmasSinceRebirth || 0) + coinBonus }));
    setTriviaCooldown(120);
    setTriviaActive(false);
  };

  const triviaFail = () => {
    soundEngine.playPuzzleFail();
    setTriviaCooldown(120);
    setTriviaActive(false);
  };

  const tabBtn = (tab: Tab, label: string, emoji: string) => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
    >{emoji} {label}</button>
  );

  useEffect(() => {
    return () => { soundEngine.stopMusic(); };
  }, []);

  if (!loaded) {
    return <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-900 to-cyan-900"><p className="text-white animate-pulse text-xl">{t('sc.loading')}</p></div>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto overflow-x-hidden select-none" style={{
      background: skyGradient,
      transition: 'background 2s ease',
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          50% { transform: translateX(3px) rotate(1deg); }
          75% { transform: translateX(-2px) rotate(-0.5deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; box-shadow: 0 0 16px #facc1599, 0 0 32px #f59e0b55; }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 24px #facc15cc, 0 0 48px #f59e0b88, 0 0 64px #d9770644; }
        }
        @keyframes clickRipple {
          0% { transform: translate(-50%,-50%) scale(0); opacity: 0.7; }
          60% { opacity: 0.3; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
        @keyframes clickRing {
          0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(1.2); opacity: 0; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -130%) scale(1.5); }
        }
        @keyframes sc-rainbow {
          0% { color: #ef4444; }
          14% { color: #f59e0b; }
          28% { color: #eab308; }
          42% { color: #22c55e; }
          57% { color: #3b82f6; }
          71% { color: #8b5cf6; }
          85% { color: #ec4899; }
          100% { color: #ef4444; }
        }
        @keyframes sc-flame {
          0%, 100% { text-shadow: 0 0 4px #ef4444, 0 0 8px #f97316, 0 -2px 12px #ef444466; color: #fbbf24; }
          50% { text-shadow: 0 0 8px #f97316, 0 0 16px #ef4444, 0 -4px 20px #f9731688; color: #f59e0b; }
        }
        @keyframes sc-glitch {
          0%, 100% { text-shadow: 0 0 4px currentColor; transform: translate(0); }
          20% { text-shadow: -2px 0 #ef4444, 2px 0 #3b82f6; transform: translate(-1px, 1px); }
          40% { text-shadow: 2px 0 #ef4444, -2px 0 #3b82f6; transform: translate(1px, -1px); }
          60% { text-shadow: 0 0 8px currentColor; transform: translate(0); }
        }
        .sc-title-rainbow { animation: sc-rainbow 3s linear infinite; font-weight: 900; }
        .sc-title-flame { animation: sc-flame 1.5s ease-in-out infinite; font-weight: 900; }
        .sc-title-glitch { animation: sc-glitch 2s steps(1) infinite; }
        .sc-title-ascended { text-shadow: 0 0 8px #fbbf24, 0 0 16px #f59e0b44; font-weight: 900; }
        .sc-title-glow-purple { text-shadow: 0 0 6px #a855f766; }
        .sc-title-glow-blue { text-shadow: 0 0 6px #3b82f666; }
        .sc-title-glow-gold { text-shadow: 0 0 6px #fbbf2466; }
        .sc-title-glow-red { text-shadow: 0 0 6px #ef444466; }
        .sc-title-glow-green { text-shadow: 0 0 6px #22c55e66; }
        .sc-title-glow-cyan { text-shadow: 0 0 6px #06b6d466; }
        .sc-title-glow-yellow { text-shadow: 0 0 6px #eab30866; }
        .sc-title-glow-orange { text-shadow: 0 0 6px #f9731666; }
        .sc-title-glow-pink { text-shadow: 0 0 6px #ec489966; }
        @keyframes chestBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes goldenPulse {
          0%, 100% { box-shadow: 0 0 12px #fbbf2466, inset 0 0 8px #fbbf2433; }
          50% { box-shadow: 0 0 24px #fbbf24aa, inset 0 0 16px #fbbf2455; }
        }
        @keyframes critFlash {
          0% { opacity: 0.8; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes comboGlow {
          0%, 100% { text-shadow: 0 0 4px #f97316; }
          50% { text-shadow: 0 0 12px #f97316, 0 0 20px #ea580c; }
        }
      `}</style>

      <div className="relative w-full h-[100vh] min-h-[500px] overflow-hidden">

      {isNight && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          {starPositions.map((s, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.x}%`,
              top: `${s.y}%`,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }} />
          ))}
        </div>
      )}

      <div className="absolute z-[2] pointer-events-none transition-all duration-1000" style={{
        left: `${sun.x}%`,
        top: `${sun.y}%`,
        width: `${sun.size}px`,
        height: `${sun.size}px`,
        borderRadius: '50%',
        background: sun.color,
        boxShadow: sun.glow,
        transform: 'translate(-50%, -50%)',
        opacity: sun.opacity,
      }} />

      <div className="absolute inset-x-0 bottom-0 z-[3] pointer-events-none" style={{ height: '50%' }}>
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, transparent 0%, ${sandColor}44 10%, ${sandColor}88 25%, ${sandColor} 45%, ${sandColor} 100%)`,
          transition: 'background 2s ease',
        }} />
        <div className="absolute inset-x-0 bottom-0 h-[65%]" style={{
          background: sandColor,
          transition: 'background 2s ease',
        }} />
      </div>

      <div className="absolute inset-x-0 z-[4] pointer-events-none" style={{ top: '40%', height: '16%' }}>
        <div className="absolute inset-0" style={{
          background: isNight
            ? 'linear-gradient(180deg, rgba(15,30,60,0.0) 0%, rgba(20,50,90,0.6) 20%, rgba(10,40,80,0.8) 50%, rgba(15,35,65,0.4) 100%)'
            : 'linear-gradient(180deg, rgba(0,120,200,0.0) 0%, rgba(0,150,220,0.5) 20%, rgba(0,130,200,0.6) 50%, rgba(0,100,180,0.3) 100%)',
          transition: 'background 2s ease',
        }} />
        <div className="absolute w-full" style={{ top: '30%', height: '3px', background: `linear-gradient(90deg, transparent 5%, ${isNight ? 'rgba(100,180,255,0.15)' : 'rgba(255,255,255,0.25)'} 30%, ${isNight ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.35)'} 50%, ${isNight ? 'rgba(100,180,255,0.15)' : 'rgba(255,255,255,0.25)'} 70%, transparent 95%)` }} />
        <div className="absolute w-full" style={{ top: '55%', height: '2px', background: `linear-gradient(90deg, transparent 15%, ${isNight ? 'rgba(100,180,255,0.1)' : 'rgba(255,255,255,0.2)'} 40%, ${isNight ? 'rgba(100,180,255,0.15)' : 'rgba(255,255,255,0.3)'} 60%, transparent 85%)` }} />
        <div className="absolute w-full" style={{ top: '75%', height: '2px', background: `linear-gradient(90deg, transparent 10%, ${isNight ? 'rgba(100,180,255,0.08)' : 'rgba(255,255,255,0.15)'} 35%, ${isNight ? 'rgba(100,180,255,0.12)' : 'rgba(255,255,255,0.2)'} 55%, transparent 90%)` }} />
      </div>

      <BeachDecorations isNight={isNight} />

      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}

      <div className="absolute top-2 left-2 right-2 z-20 flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-2.5 py-1.5 border border-white/10">
            <div className="relative w-7 h-7 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-sm"
              style={gs.equippedBorder ? { ...(BORDER_STYLES[gs.equippedBorder] || {}), borderRadius: '50%' } : { border: '2px solid rgba(255,255,255,0.3)' }}>
              🗿
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white text-[10px] font-bold truncate max-w-[60px]">{appState.username || 'Player'}</span>
                {(gs.equippedBadges || []).slice(0, 3).map(bid => {
                  const badge = SC_BADGES.find(b => b.id === bid);
                  return badge ? (
                    <span key={bid} title={badge.name} className="inline-flex items-center">
                      {badge.icon.startsWith('/') ? <span className="inline-block w-4.5 h-4.5 overflow-hidden rounded"><img src={badge.icon} alt={badge.name} className="w-full h-full object-contain scale-[2]" /></span> : <span className="text-[10px]">{badge.icon}</span>}
                    </span>
                  ) : null;
                })}
              </div>
              {gs.equippedTitle && (() => {
                const title = MASTERY_TITLES.find(ti => ti.id === gs.equippedTitle);
                return title ? <span className={`text-[8px] font-bold leading-none ${title.cssClass || ''}`} style={{ color: RARITY_COLORS[title.rarity] }}>{title.name}</span> : null;
              })()}
            </div>
          </div>
          <button onClick={() => { const on = soundEngine.toggle(); setSoundOn(on); }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black/40 border border-white/20 hover:bg-black/50 transition-colors">
            {soundOn ? <Volume2 className="w-3 h-3 text-cyan-300" /> : <VolumeX className="w-3 h-3 text-gray-500" />}
          </button>
          <div className="relative">
            {showSaveReminder && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-500 text-black text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce pointer-events-none z-50">
                💾 Remember to save!
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-500" />
              </div>
            )}
            <button onClick={() => { saveProgress(gs); setShowSaveReminder(false); }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black/40 border transition-colors cursor-pointer ${saveStatus === 'unsaved' ? 'border-yellow-400/60 animate-pulse' : 'border-white/20 hover:bg-black/50'}`}
              title="💾 Save your progress — auto-saves every 3 minutes. Click to save now!">
              <Save className={`w-3 h-3 ${saveStatus === 'unsaved' ? 'text-yellow-400' : 'text-white/60'}`} />
              <span className={saveStatus === 'saved' ? 'text-emerald-300' : saveStatus === 'saving' ? 'text-yellow-300 animate-pulse' : 'text-yellow-400 font-bold'}>
                {saveStatus === 'saved' ? '✓' : saveStatus === 'saving' ? '...' : 'Save!'}
              </span>
            </button>
          </div>
          {gs.rebirths > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-300">
              ✦ {gs.rebirths}
            </span>
          )}
        </div>
        <button onClick={() => setShowPatchNotes(true)}
          className="text-[10px] bg-black/40 hover:bg-black/60 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30 transition-all">
          v2.5
        </button>
      </div>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <p className="text-xl sm:text-2xl font-bold text-yellow-200 drop-shadow" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
          <span className="inline-block w-10 h-10 mr-1 align-middle overflow-hidden rounded"><img src="/sigma-currency.png" alt="sigma" className="w-full h-full object-contain scale-[2.5]" /></span> {formatNum(gs.sigmas)} {t('sc.stat.sigmas')}
        </p>
        <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">
          {formatNum(clickPower)}/{t('sc.hud.click')} · {formatNum(idlePower)}/{t('sc.hud.sec')}
          {prestigeMult > 1 && <span className="text-purple-300"> · {prestigeMult}x {t('sc.prestige.aura')}</span>}
          {puzzleMult > 1 && <span className="text-yellow-300"> · {puzzleMult}x {t('sc.hud.brain')}</span>}
          {sigmaGrindsetActive && <span className="text-emerald-300 animate-pulse"> · 3x Grindset</span>}
          {tempMultiplier > 1 && <span className="text-orange-300 animate-pulse"> · {tempMultiplier}x {tempMultEnd > Date.now() ? '🌙 Rested Aura' : t('sc.hud.boost')}</span>}
          {isOwner && <span className="text-yellow-300"> · 👑 50x Auto</span>}
          {hasAutoRebirth && <span className="text-purple-300"> · ♻️ Auto-Rebirth</span>}
        </p>
      </div>

      {hasBrainFog && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-red-500/30 max-w-sm mx-4 text-center">
            <p className="text-2xl mb-2">🧠💨</p>
            <h3 className="text-xl font-bold text-red-400 mb-2">{t('sc.brainfog.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('sc.brainfog.desc')}</p>
            <FocusMiniGame onComplete={() => { setHasBrainFog(false); setGs(p => ({ ...p, focusGameWins: (p.focusGameWins || 0) + 1 })); }} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {cosmeticToasts.map((toast, i) => (
          <motion.div key={toast.id + i}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-16 right-3 z-[60] pointer-events-none"
            style={{ top: `${64 + i * 60}px` }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border shadow-2xl backdrop-blur-sm"
              style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(30,30,30,0.9))', borderColor: RARITY_COLORS[toast.rarity] + '60' }}>
              <span className="text-lg">{toast.icon.startsWith('/') ? <span className="inline-block w-6 h-6 overflow-hidden rounded"><img src={toast.icon} alt={toast.name} className="w-full h-full object-contain scale-[2]" /></span> : toast.icon}</span>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">🏆 Unlocked!</p>
                <p className="text-xs font-bold" style={{ color: RARITY_COLORS[toast.rarity] }}>{toast.name}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {buyWarning && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
          >
            <div className="px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-950/90 backdrop-blur-sm shadow-2xl">
              <p className="text-sm font-bold text-red-300 whitespace-nowrap">⚠️ {buyWarning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAutoRebirthPrompt && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#1a1a2e] border border-purple-500/40 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl shadow-purple-500/20 text-center">
              <p className="text-3xl mb-3">☠️</p>
              <h3 className="text-lg font-bold text-white mb-2">Ready to Rebirth?</h3>
              <p className="text-sm text-gray-400 mb-1">You've reached the threshold of <span className="text-yellow-300 font-bold">{formatNum(getPrestigeThreshold(gs.rebirths))}</span> Sigmas!</p>
              <p className="text-sm text-purple-300 mb-4">Rebirthing will reset your upgrades but grant <span className="font-bold">+1 Prestige Point</span> and a stronger aura multiplier.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAutoRebirthPrompt(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20 transition-all"
                >Not Yet</button>
                <button
                  onClick={() => { setShowAutoRebirthPrompt(false); doRebirth(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.03] shadow-lg shadow-purple-500/30 transition-all"
                >☠️ Rebirth!</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {alphaOrbs.map(orb => (
          <button key={orb.id}
            onClick={() => grabOrb(orb)}
            className="absolute w-10 h-10 rounded-full pointer-events-auto cursor-pointer z-20 flex items-center justify-center text-base"
            style={{
              left: `${orb.x}%`, top: `${orb.y}%`,
              background: 'radial-gradient(circle at 35% 35%, #fef08a, #facc15, #f59e0b, #d97706)',
              boxShadow: '0 0 16px #facc1599, 0 0 32px #f59e0b55, 0 0 48px #d9770633',
              animation: 'orbPulse 1.5s ease-in-out infinite',
            }}
            title={`+${formatNum(orb.bonus)} ${t('sc.stat.sigmas')}!`}
          >⚡</button>
        ))}

        {treasureChests.map(chest => {
          const rarityColors: Record<string, string> = { common: '#94a3b8', rare: '#3b82f6', epic: '#a855f7', legendary: '#fbbf24' };
          const rarityEmojis: Record<string, string> = { common: '📦', rare: '🎁', epic: '💎', legendary: '👑' };
          const progress = chest.hitsReceived / chest.hitsNeeded;
          return (
            <button key={chest.id} onClick={() => hitChest(chest.id)}
              className="absolute pointer-events-auto cursor-pointer z-20 flex flex-col items-center"
              style={{ left: `${chest.x}%`, top: `${chest.y}%`, animation: 'chestBounce 1.5s ease-in-out infinite' }}>
              <span className="text-3xl">{rarityEmojis[chest.rarity]}</span>
              <div className="w-12 h-1.5 bg-black/40 rounded-full mt-0.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: rarityColors[chest.rarity] }} />
              </div>
              <span className="text-[10px] font-bold mt-0.5" style={{ color: rarityColors[chest.rarity] }}>
                <span className="inline-flex items-center gap-1">{formatNum(chest.reward)} <span className="inline-block w-4 h-4 overflow-hidden"><img src="/synergy-coin.png" alt="Σ" className="w-full h-full object-contain scale-[2.2]" /></span></span>
              </span>
            </button>
          );
        })}
      </div>

      {sigmaGrindsetActive && (
        <div className="absolute top-2 right-4 z-30 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 border border-emerald-400/40"
          style={{ animation: 'goldenPulse 1.5s ease-in-out infinite', background: 'rgba(16,185,129,0.15)' }}>
          🔥 SIGMA GRINDSET 3x
        </div>
      )}
      {goldenClickActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full text-sm font-bold text-yellow-300 border border-yellow-400/40"
          style={{ animation: 'goldenPulse 1s ease-in-out infinite', background: 'rgba(250,204,21,0.15)' }}>
          ⚡ GOLDEN CLICK 5x — {Math.max(0, Math.ceil((goldenClickEnd - Date.now()) / 1000))}s
        </div>
      )}

      {combo >= 1 && (() => {
        void comboTick;
        const comboName = combo >= 10 ? 'MELTDOWN' : combo >= 7 ? 'INFERNO' : combo >= 4 ? 'BLAZING' : combo >= 2 ? 'HEATED' : 'WARM';
        const comboColor = combo >= 10 ? '#ef4444' : combo >= 7 ? '#f97316' : combo >= 4 ? '#fb923c' : combo >= 2 ? '#fdba74' : '#fed7aa';
        const now = Date.now();
        const graceLeft = Math.max(0, comboGraceEnd - now);
        const isDecaying = graceLeft <= 0;
        const graceProgress = graceLeft > 0 ? graceLeft / 30000 : 0;
        const isWarning = graceLeft > 0 && graceLeft < 8000;
        return (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm border min-w-[140px]"
            style={{ borderColor: `${comboColor}66`, animation: 'comboGlow 0.8s ease-in-out infinite' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <div>
                <p className="font-black text-sm leading-tight" style={{ color: comboColor }}>{comboName}</p>
                <p className="text-[10px] text-gray-400">Streak x{combo}</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: isDecaying ? '0%' : `${graceProgress * 100}%`,
                  backgroundColor: isWarning ? '#ef4444' : comboColor,
                  animation: isWarning ? 'comboGlow 0.4s ease-in-out infinite' : undefined,
                }} />
            </div>
            {isWarning && !isDecaying && (
              <p className="text-[9px] text-red-400 font-bold mt-0.5 animate-pulse">Overheat to keep streak!</p>
            )}
            {isDecaying && (
              <p className="text-[9px] text-gray-500 mt-0.5">Cooling down...</p>
            )}
          </div>
        );
      })()}

      {lastCritical && (
        <div className="absolute left-1/2 -translate-x-1/2 z-40 text-amber-400 font-black text-2xl pointer-events-none"
          style={{ top: '12%', animation: 'critFlash 1s ease-out forwards' }}>
          ⚡ CRITICAL x{lastCritical.mult}!
        </div>
      )}

      <div ref={orbBtnRef} className="absolute left-1/2 z-10" style={{ top: '28%', transform: 'translate(-50%, -50%)' }}>
        <motion.button
          whileHover={!isOverheated ? { scale: 1.08 } : {}}
          whileTap={!isOverheated ? { scale: 0.82, rotate: -10 } : {}}
          onClick={handleClick}
          onPointerDown={startHoldClick}
          onPointerUp={stopHoldClick}
          onPointerLeave={stopHoldClick}
          onPointerCancel={stopHoldClick}
          disabled={hasBrainFog || isOverheated}
          className={`relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full border-4 overflow-hidden group flex items-center justify-center transition-all ${isOverheated ? 'border-red-500/60' : hasGoldenOrb ? 'border-yellow-400/60' : hasNeonOrb ? 'border-pink-400/60' : 'border-white/30'}`}
          style={{
            boxShadow: isOverheated
              ? '0 0 50px rgba(239,68,68,0.6), 0 0 100px rgba(239,68,68,0.3), 0 10px 30px rgba(0,0,0,0.4)'
              : hasGoldenOrb ? '0 0 50px rgba(250,204,21,0.6), 0 0 100px rgba(250,204,21,0.3), 0 10px 30px rgba(0,0,0,0.4)'
              : hasNeonOrb ? '0 0 50px rgba(236,72,153,0.6), 0 0 100px rgba(236,72,153,0.3), 0 10px 30px rgba(0,0,0,0.4)'
              : '0 0 50px rgba(6,182,212,0.5), 0 0 100px rgba(6,182,212,0.2), 0 10px 30px rgba(0,0,0,0.4)',
            animation: isOverheated ? 'shake 0.3s infinite' : undefined,
          }}
        >
          <div className={`absolute inset-0 ${isOverheated ? 'bg-gradient-to-br from-red-500 to-red-800' : hasGoldenOrb ? 'bg-gradient-to-br from-yellow-400 to-amber-600' : hasNeonOrb ? 'bg-gradient-to-br from-pink-400 to-fuchsia-600' : 'bg-gradient-to-br from-cyan-400 to-blue-600'} transition-colors duration-500`} />
          <img src="/sigma.png" alt="Sigma" className={`absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain transition-opacity ${isOverheated ? 'opacity-50' : 'opacity-90 group-hover:opacity-100'}`} draggable={false} style={{ margin: 'auto' }} />
          {isOverheated && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-bounce">🔥</span>
            </div>
          )}
        </motion.button>

        <div className="mt-2 w-44 sm:w-52 md:w-60 mx-auto">
          <div className="h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-150" style={{
              width: `${heat}%`,
              background: heat > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : heat > 50 ? 'linear-gradient(90deg, #22c55e, #f59e0b)' : 'linear-gradient(90deg, #22c55e, #3b82f6)',
            }} />
          </div>
          <p className={`text-center text-[10px] mt-0.5 ${isOverheated ? 'text-red-400 font-bold animate-pulse' : heat > 80 ? 'text-orange-400' : 'text-white/40'}`}>
            {isOverheated ? t('sc.heat.overheated') : heat > 80 ? t('sc.heat.hot') : heat > 0 ? `${t('sc.heat.label')}: ${Math.floor(heat)}%` : t('sc.heat.idle')}
          </p>
        </div>
      </div>

      <Island side="left" onClick={() => setShowLeftIsland(true)} />
      <Island side="right" tier={waterParkTier} onClick={() => setShowRightIsland(true)} />

      {showRightIsland && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowRightIsland(false)}>
          <div className="relative rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl shadow-cyan-900/40"
            style={{ background: 'linear-gradient(135deg, #0a1a35 0%, #0d2847 40%, #0a2040 100%)' }}
            onClick={e => e.stopPropagation()}>
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏝️</span>
                  <div>
                    <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">{t('sc.island.waterpark')}</h2>
                    <p className="text-[10px] text-cyan-300/50 uppercase tracking-widest font-bold">{t('sc.island.upgradeStation')}</p>
                  </div>
                </div>
                <button onClick={() => setShowRightIsland(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
              </div>
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-3 border border-cyan-500/20 mb-4 flex items-center gap-3">
                <div className="text-2xl">{waterParkTier.structures.length > 0 ? waterParkTier.structures.join('') : '🏜️'}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-cyan-300">{t(waterParkTier.labelKey)}</p>
                  <p className="text-[10px] text-gray-400">{t('sc.island.buyUpgrades')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{t('sc.island.balance')}</p>
                  <p className="text-sm font-bold text-yellow-300"><span className="inline-block w-6 h-6 mr-1 align-middle overflow-hidden rounded"><img src="/sigma-currency.png" alt="sigma" className="w-full h-full object-contain scale-[2.2]" /></span> {formatNum(gs.sigmas)}</p>
                </div>
              </div>
              <div className="space-y-3 mb-3">
                <h3 className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-[3px] flex items-center gap-2"><span className="flex-1 h-px bg-cyan-500/20" />{t('sc.clickPower')}<span className="flex-1 h-px bg-cyan-500/20" /></h3>
                {CLICK_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => {
                  const cost = getClickCost(u);
                  const owned = gs.ownedClick[u.id] || 0;
                  const ok = gs.sigmas >= cost;
                  const progress = ok ? 100 : Math.min(99, (gs.sigmas / cost) * 100);
                  return (
                    <button key={u.id} onClick={() => buyClick(u)} disabled={!ok}
                      className={`group w-full relative overflow-hidden rounded-xl transition-all duration-200 ${ok ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10' : 'opacity-50'}`}>
                      <div className={`absolute inset-0 ${ok ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10' : 'bg-white/[0.02]'}`} />
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${progress}%`, opacity: ok ? 0.8 : 0.3 }} />
                      <div className="relative flex items-center gap-3 p-3 border border-cyan-500/15 rounded-xl">
                        <div className="w-20 h-20 rounded-lg bg-cyan-500/10 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                          {u.icon.startsWith('/') ? <img src={u.icon} alt={u.name} className="w-full h-full object-contain scale-[1.8] brightness-110" /> : u.icon}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-sm truncate">{u.name}</p>
                            {owned > 0 && <span className="text-cyan-400 text-[10px] shrink-0 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">Lv{owned}</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{u.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-bold text-sm ${ok ? 'text-cyan-300' : 'text-gray-500'}`}>{formatNum(cost)}</p>
                          <p className="text-[9px] text-gray-500">sigmas</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <h3 className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[3px] flex items-center gap-2 mt-4"><span className="flex-1 h-px bg-emerald-500/20" />{t('sc.idlePower')}<span className="flex-1 h-px bg-emerald-500/20" /></h3>
                {IDLE_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => {
                  const cost = getIdleCost(u);
                  const owned = gs.ownedIdle[u.id] || 0;
                  const ok = gs.sigmas >= cost;
                  const progress = ok ? 100 : Math.min(99, (gs.sigmas / cost) * 100);
                  return (
                    <button key={u.id} onClick={() => buyIdle(u)} disabled={!ok}
                      className={`group w-full relative overflow-hidden rounded-xl transition-all duration-200 ${ok ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10' : 'opacity-50'}`}>
                      <div className={`absolute inset-0 ${ok ? 'bg-gradient-to-r from-emerald-500/15 to-green-500/10' : 'bg-white/[0.02]'}`} />
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 transition-all" style={{ width: `${progress}%`, opacity: ok ? 0.8 : 0.3 }} />
                      <div className="relative flex items-center gap-3 p-3 border border-emerald-500/15 rounded-xl">
                        <div className="w-20 h-20 rounded-lg bg-emerald-500/10 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                          {u.icon.startsWith('/') ? <img src={u.icon} alt={u.name} className="w-full h-full object-contain scale-[1.8] brightness-110" /> : u.icon}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white text-sm truncate">{u.name}</p>
                            {owned > 0 && <span className="text-emerald-400 text-[10px] shrink-0 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Lv{owned}</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{u.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-bold text-sm ${ok ? 'text-emerald-300' : 'text-gray-500'}`}>{formatNum(cost)}</p>
                          <p className="text-[9px] text-gray-500">sigmas</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeftIsland && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => { setShowLeftIsland(false); setTriviaActive(false); }}>
          <div className="relative rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl shadow-purple-900/40"
            style={{ background: 'linear-gradient(135deg, #1a0a35 0%, #150830 40%, #0d0628 100%)' }}
            onClick={e => e.stopPropagation()}>
            <div className="absolute inset-0 rounded-2xl border border-purple-400/20 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">{t('sc.island.mystic')}</h2>
                    <p className="text-[10px] text-purple-300/50 uppercase tracking-widest font-bold">{t('sc.island.ancientPowers')}</p>
                  </div>
                </div>
                <button onClick={() => { setShowLeftIsland(false); setTriviaActive(false); }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
              </div>

              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.1), rgba(219,39,119,0.05))' }}>
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">☠️</span>
                      <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">{t('sc.prestige.title')}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{t('sc.prestige.desc')}</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-black/20 rounded-lg p-2 text-center border border-purple-500/10">
                        <p className="text-[9px] text-gray-500 uppercase">{t('sc.prestige.required')}</p>
                        <p className="text-xs font-bold text-white">{formatNum(REBIRTH_THRESHOLD)}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2 text-center border border-purple-500/10">
                        <p className="text-[9px] text-gray-500 uppercase">{t('sc.prestige.current')}</p>
                        <p className={`text-xs font-bold ${gs.sigmas >= REBIRTH_THRESHOLD ? 'text-emerald-400' : 'text-red-400'}`}>{formatNum(gs.sigmas)}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2 text-center border border-purple-500/10">
                        <p className="text-[9px] text-gray-500 uppercase">{t('sc.prestige.aura')}</p>
                        <p className="text-xs font-bold text-purple-300">{prestigeMult}x → {getPrestigeMultiplier(gs.rebirths + 1)}x</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${Math.min(100, (gs.sigmas / REBIRTH_THRESHOLD) * 100)}%` }} />
                    </div>
                    {!prestigeReqs.met && (
                      <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] text-red-300 font-bold mb-1">Required upgrades to prestige:</p>
                        {prestigeReqs.missingClick.length > 0 && (
                          <p className="text-[9px] text-red-400">Click: {prestigeReqs.missingClick.map(id => CLICK_UPGRADES.find(u => u.id === id)?.name || id).join(', ')}</p>
                        )}
                        {prestigeReqs.missingIdle.length > 0 && (
                          <p className="text-[9px] text-red-400">Idle: {prestigeReqs.missingIdle.map(id => IDLE_UPGRADES.find(u => u.id === id)?.name || id).join(', ')}</p>
                        )}
                      </div>
                    )}
                    <button onClick={doRebirth} disabled={!canRebirth}
                      className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${canRebirth ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'}`}
                    >☠️ {t('sc.prestige.title')} · {t('sc.stat.rebirths')}: {gs.rebirths}</button>
                    {(gs.prestigePoints || 0) > 0 && (
                      <button onClick={() => setActiveTab('rebirth')} className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg py-1.5 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer">
                        <span>💜</span>
                        <span className="font-bold">{gs.prestigePoints}</span>
                        <span className="text-purple-400">prestige points available → Go to Rebirth Shop</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(245,158,11,0.05))' }}>
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🧠</span>
                      <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">{t('sc.trivia.title')}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{t('sc.trivia.desc')}</p>
                    {triviaActive ? (
                      <TriviaGame onWin={triviaWin} onFail={triviaFail} />
                    ) : triviaCooldown > 0 ? (
                      <div className="text-center py-4 bg-black/20 rounded-xl border border-red-500/10">
                        <p className="text-red-400 text-lg font-bold">⏳ {Math.floor(triviaCooldown / 60)}:{String(triviaCooldown % 60).padStart(2, '0')}</p>
                        <p className="text-gray-500 text-xs mt-1">{t('sc.trivia.recharging')}</p>
                      </div>
                    ) : (
                      <button onClick={() => setTriviaActive(true)}
                        className="w-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 text-yellow-300 font-bold text-sm px-4 py-3 rounded-xl border border-yellow-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/10">
                        🎰 {t('sc.trivia.generate')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEndgame && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
          <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 text-center backdrop-blur-sm shadow-lg shadow-yellow-500/10">
            <p className="text-2xl mb-1">🏆</p>
            <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">SIGMA COMPLETE</h3>
            <p className="text-xs text-yellow-200/70 mt-1">You have reached peak Sigma. All upgrades maxed, all rebirths conquered.</p>
            <p className="text-[10px] text-gray-400 mt-2">Total Sigmas: {formatNum(gs.lifetimeSigmas)} · Rebirths: {gs.rebirths} · Hours: {gs.lifetimeHoursPlayed.toFixed(1)}</p>
          </div>
        </div>
      )}

      {appState.authMode !== 'logged_in' && (
        <div className="absolute top-10 right-2 z-20">
          <span className="text-[10px] bg-black/40 text-yellow-300/80 px-2 py-0.5 rounded-full">☁️ {t('sc.loginToSave')}</span>
        </div>
      )}

      <a href="https://recroom.com" target="_blank" rel="noopener noreferrer" className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 opacity-40 hover:opacity-70 transition-opacity cursor-pointer">
        <span className="text-[8px] text-white/80 italic">{t('sc.originates')}</span>
        <img src="/recroom-logo.png" alt="Rec Room" className="h-4" draggable={false} />
      </a>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="text-white/50 text-xs text-center">
          <span>▼ {t('sc.scrollMenu')} ▼</span>
        </div>
      </div>

      </div>

      <div className="relative z-20 min-h-[60vh]" style={{
        background: `linear-gradient(180deg, ${isNight ? 'rgba(15,10,30,0.95)' : 'rgba(30,20,10,0.85)'} 0%, ${isNight ? 'rgba(10,8,25,0.98)' : 'rgba(25,15,5,0.92)'} 100%)`,
      }}>
        <div className="p-3 sm:p-4 max-w-2xl mx-auto">
          <h2 className="text-lg font-black text-white mb-3 text-center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>Sigma Clicker</h2>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none justify-center flex-wrap">
            {tabBtn('upgrades', t('sc.tab.upgrades'), '💪')}
            {tabBtn('puzzles', t('sc.tab.puzzles'), '🧠')}
            {tabBtn('synergy', 'Synergy', '🔗')}
            {tabBtn('inventory', 'Inventory', '🎒')}
            {tabBtn('rebirth', t('sc.tab.rebirth'), '🔄')}
            {tabBtn('stats', t('sc.tab.stats'), '📊')}
            {tabBtn('leaderboard', t('sc.tab.board'), '🏆')}
            {tabBtn('credits', t('sc.tab.credits'), '👥')}
          </div>

          <div className="mt-3">
            {activeTab === 'upgrades' && (
              <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">Buy Amount:</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {([1, 2, 5, 10, 25, 50, 100, 'max'] as const).map(mode => (
                    <button key={mode} onClick={() => setBuyMode(mode)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${buyMode === mode ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white'}`}>
                      {mode === 'max' ? 'MAX' : `x${mode}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-[3px] flex items-center gap-2"><span className="flex-1 h-px bg-cyan-500/20" />{t('sc.clickPower')}<span className="flex-1 h-px bg-cyan-500/20" /></h3>
                  {CLICK_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => {
                    const cost = getClickCost(u);
                    const totalCost = buyMode !== 1 ? getClickTotalCost(u) : cost;
                    const owned = gs.ownedClick[u.id] || 0;
                    const ok = gs.sigmas >= cost;
                    const canAffordTotal = gs.sigmas >= totalCost;
                    const progress = ok ? 100 : Math.min(99, (gs.sigmas / cost) * 100);
                    return (
                      <button key={u.id} onClick={() => buyClick(u)} disabled={!ok}
                        className={`group w-full relative overflow-hidden rounded-xl transition-all duration-200 ${ok ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10' : 'opacity-50'}`}>
                        <div className={`absolute inset-0 ${ok ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10' : 'bg-white/[0.02]'}`} />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${progress}%`, opacity: ok ? 0.8 : 0.3 }} />
                        <div className="relative flex items-center gap-3 p-3 border border-cyan-500/15 rounded-xl">
                          <div className="w-20 h-20 rounded-lg bg-cyan-500/10 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                            {u.icon.startsWith('/') ? <img src={u.icon} alt={u.name} className="w-full h-full object-contain scale-[1.8] brightness-110" /> : u.icon}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm truncate">{u.name}</p>
                              {owned > 0 && <span className="text-cyan-400 text-[10px] shrink-0 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">Lv{owned}</span>}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{u.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-bold text-sm ${canAffordTotal ? 'text-cyan-300' : ok ? 'text-yellow-400' : 'text-gray-500'}`}>{formatNum(totalCost)}</p>
                            {buyMode !== 1 && <p className="text-[10px] text-gray-500">{formatNum(cost)} ea</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[3px] flex items-center gap-2"><span className="flex-1 h-px bg-emerald-500/20" />{t('sc.idlePower')}<span className="flex-1 h-px bg-emerald-500/20" /></h3>
                  {IDLE_UPGRADES.filter(u => !u.minRebirths || gs.rebirths >= u.minRebirths).map(u => {
                    const cost = getIdleCost(u);
                    const totalCost = buyMode !== 1 ? getIdleTotalCost(u) : cost;
                    const owned = gs.ownedIdle[u.id] || 0;
                    const ok = gs.sigmas >= cost;
                    const canAffordTotal = gs.sigmas >= totalCost;
                    const progress = ok ? 100 : Math.min(99, (gs.sigmas / cost) * 100);
                    return (
                      <button key={u.id} onClick={() => buyIdle(u)} disabled={!ok}
                        className={`group w-full relative overflow-hidden rounded-xl transition-all duration-200 ${ok ? 'hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10' : 'opacity-50'}`}>
                        <div className={`absolute inset-0 ${ok ? 'bg-gradient-to-r from-emerald-500/15 to-green-500/10' : 'bg-white/[0.02]'}`} />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 transition-all" style={{ width: `${progress}%`, opacity: ok ? 0.8 : 0.3 }} />
                        <div className="relative flex items-center gap-3 p-3 border border-emerald-500/15 rounded-xl">
                          <div className="w-20 h-20 rounded-lg bg-emerald-500/10 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                            {u.icon.startsWith('/') ? <img src={u.icon} alt={u.name} className="w-full h-full object-contain scale-[1.8] brightness-110" /> : u.icon}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm truncate">{u.name}</p>
                              {owned > 0 && <span className="text-emerald-400 text-[10px] shrink-0 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Lv{owned}</span>}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{u.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-bold text-sm ${canAffordTotal ? 'text-emerald-300' : ok ? 'text-yellow-400' : 'text-gray-500'}`}>{formatNum(totalCost)}</p>
                            {buyMode !== 1 && <p className="text-[10px] text-gray-500">{formatNum(cost)} ea</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
            )}

            {activeTab === 'synergy' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-purple-500/20">
                  <h3 className="text-sm font-bold text-purple-300 mb-1">🔗 Synergy Upgrades</h3>
                  <p className="text-[11px] text-gray-400">Boost power through cross-system synergies. Costs sigmas.</p>
                </div>
                {SYNERGY_UPGRADES.map(syn => {
                  const level = sl[syn.id] || 0;
                  const maxed = level >= syn.maxLevel;
                  const cost = Math.floor(syn.baseCost * rebirthScale * Math.pow(1.5, level));
                  const ok = !maxed && gs.sigmas >= cost;
                  return (
                    <button key={syn.id} onClick={() => buySynergy(syn)} disabled={!ok && !maxed}
                      className={`w-full relative overflow-hidden rounded-xl transition-all ${ok ? 'hover:scale-[1.02]' : maxed ? 'opacity-70' : 'opacity-50'}`}>
                      <div className={`absolute inset-0 ${ok ? 'bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10' : 'bg-white/[0.02]'}`} />
                      <div className="relative flex items-center gap-3 p-3 border border-purple-500/15 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-xl shrink-0">{syn.icon}</div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-white text-sm">{syn.name} {level > 0 && <span className="text-purple-400 text-xs ml-1 bg-purple-400/10 px-1.5 py-0.5 rounded-full">Lv{level}/{syn.maxLevel}</span>}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{syn.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {maxed ? <span className="text-green-400 text-xs font-bold">MAX</span> : <p className={`font-bold text-sm ${ok ? 'text-purple-300' : 'text-gray-500'} inline-flex items-center gap-1`}>{formatNum(cost)} <span className="inline-block w-4 h-4 overflow-hidden"><img src="/synergy-coin.png" alt="Σ" className="w-full h-full object-contain scale-[2.2]" /></span></p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-300 mb-1">🌟 Global Multiplier</h3>
                  <p className="text-[11px] text-gray-400 mb-2">Boosts ALL sigma income by +25% per level. Current: +{(gs.globalMultiplierLevel || 0) * 25}%</p>
                  <button onClick={buyGlobalMult}
                    disabled={(gs.globalMultiplierLevel || 0) >= GLOBAL_MULT_MAX || gs.sigmas < Math.floor(GLOBAL_MULT_COST_BASE * rebirthScale * Math.pow(2, gs.globalMultiplierLevel || 0))}
                    className={`w-full p-2.5 rounded-lg font-bold text-sm transition-all ${(gs.globalMultiplierLevel || 0) >= GLOBAL_MULT_MAX ? 'bg-green-500/10 text-green-400 border border-green-500/30' : gs.sigmas >= Math.floor(GLOBAL_MULT_COST_BASE * rebirthScale * Math.pow(2, gs.globalMultiplierLevel || 0)) ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    {(gs.globalMultiplierLevel || 0) >= GLOBAL_MULT_MAX ? 'MAXED' : <span className="inline-flex items-center gap-1">Upgrade Lv{(gs.globalMultiplierLevel || 0) + 1} — {formatNum(Math.floor(GLOBAL_MULT_COST_BASE * rebirthScale * Math.pow(2, gs.globalMultiplierLevel || 0)))} <span className="inline-block w-4 h-4 overflow-hidden"><img src="/synergy-coin.png" alt="Σ" className="w-full h-full object-contain scale-[2.2]" /></span></span>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'puzzles' && (
              <div className="space-y-3 p-1">
                <h3 className="text-sm font-bold text-yellow-300">{t('sc.puzzles.title')}</h3>
                <p className="text-xs text-gray-400">{t('sc.puzzles.desc')}</p>
                {activePuzzle !== null ? (
                  <div className="bg-black/30 rounded-xl p-3 border border-yellow-500/20">
                    <h4 className="text-sm font-bold text-yellow-300 mb-2 text-center">{t(PUZZLE_REWARDS_DATA[activePuzzle].nameKey)}</h4>
                    {activePuzzle < 2 ? (
                      <SimonSaysPuzzle difficulty={activePuzzle} onWin={() => puzzleWin(activePuzzle)} onFail={() => puzzleFail(activePuzzle)} />
                    ) : (
                      <MathPuzzle difficulty={activePuzzle} onWin={() => puzzleWin(activePuzzle)} onFail={() => puzzleFail(activePuzzle)} />
                    )}
                    <button onClick={() => setActivePuzzle(null)} className="mt-2 text-xs text-gray-500 hover:text-white">{t('sc.puzzle.cancel')}</button>
                  </div>
                ) : (
                  PUZZLE_REWARDS_DATA.map((pr, i) => {
                    const expiry = (gs.puzzleExpiry || [0, 0, 0])[i];
                    const active = expiry > now;
                    const secsLeft = active ? Math.ceil((expiry - now) / 1000) : 0;
                    const minsLeft = Math.floor(secsLeft / 60);
                    const sLeft = secsLeft % 60;
                    return (
                      <div key={pr.id} className={`p-3 rounded-xl border ${active ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-sm">{pr.icon} {t(pr.nameKey)}</p>
                            <p className="text-xs text-gray-400">{t(pr.descKey)}</p>
                          </div>
                          {active ? (
                            <div className="text-right">
                              <span className="text-yellow-400 font-bold text-sm">✓ {t('sc.puzzle.active')}</span>
                              <p className="text-[11px] text-yellow-500/70">{minsLeft}:{String(sLeft).padStart(2, '0')} left</p>
                            </div>
                          ) : puzzleCooldown[i] > 0 ? (
                            <span className="text-red-400 text-xs">{Math.floor(puzzleCooldown[i] / 60)}:{String(puzzleCooldown[i] % 60).padStart(2, '0')}</span>
                          ) : (
                            <button onClick={() => setActivePuzzle(i)} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30">{t('sc.puzzle.attempt')}</button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'rebirth' && (
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col items-center gap-3">
                  <h3 className="text-xl font-bold text-purple-300">{t('sc.rebirth.title')}</h3>
                  <p className="text-sm text-gray-400 text-center max-w-xs">{t('sc.rebirth.desc')}</p>
                  <div className="bg-black/30 p-4 rounded-xl border border-purple-500/20 text-center w-full">
                    <p className="text-gray-400 text-sm">{t('sc.prestige.required')}: <span className="text-white font-bold">{formatNum(REBIRTH_THRESHOLD)} {t('sc.stat.sigmas')}</span></p>
                    <p className="text-sm mt-1">{t('sc.prestige.current')}: <span className={gs.sigmas >= REBIRTH_THRESHOLD ? 'text-emerald-400' : 'text-red-400'}>{formatNum(gs.sigmas)}</span></p>
                    <p className="text-sm mt-1">{t('sc.prestige.currentAura')}: <span className="text-purple-300">{prestigeMult}x → {getPrestigeMultiplier(gs.rebirths + 1)}x</span></p>
                    <p className="text-sm">{t('sc.stat.rebirths')}: <span className="text-purple-300">{gs.rebirths}</span></p>
                  </div>
                  {!prestigeReqs.met && (
                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs text-red-300 font-bold mb-1">Must own these upgrades first:</p>
                      {prestigeReqs.missingClick.map(id => <p key={id} className="text-[11px] text-red-400">⚡ {CLICK_UPGRADES.find(u => u.id === id)?.name}</p>)}
                      {prestigeReqs.missingIdle.map(id => <p key={id} className="text-[11px] text-red-400">⚙️ {IDLE_UPGRADES.find(u => u.id === id)?.name}</p>)}
                    </div>
                  )}
                  <button onClick={doRebirth} disabled={!canRebirth}
                    className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${canRebirth ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg shadow-purple-500/30' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'}`}
                  >☠️ {t('sc.rebirth.egoBtn')}</button>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">✨ Rebirth Shop</h4>
                    <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-1">
                      <span className="text-sm">💜</span>
                      <span className="text-sm font-bold text-purple-300">{gs.prestigePoints || 0}</span>
                      <span className="text-[10px] text-purple-400">pts</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">Earn 1 point per Rebirth. Upgrades persist across all rebirths!</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESTIGE_UPGRADES.map(upg => {
                      const level = (gs.prestigeUpgrades || {})[upg.id] || 0;
                      const maxed = level >= upg.maxLevel;
                      const canAfford = (gs.prestigePoints || 0) >= upg.cost;
                      return (
                        <div key={upg.id} className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${maxed ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                          <span className="text-xl shrink-0">{upg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white truncate">{upg.name}</p>
                              {maxed && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">MAX</span>}
                            </div>
                            <p className="text-[10px] text-gray-400">{upg.desc}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex gap-0.5">
                                {Array.from({ length: Math.min(upg.maxLevel, 10) }).map((_, i) => (
                                  <div key={i} className={`h-1 w-2 rounded-full ${i < Math.min(level, 10) ? 'bg-purple-400' : 'bg-white/10'}`} />
                                ))}
                                {upg.maxLevel > 10 && <span className="text-[9px] text-gray-500 ml-1">{level}/{upg.maxLevel}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => buyPrestigeUpgrade(upg)}
                            disabled={maxed || !canAfford}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${maxed ? 'bg-white/5 text-gray-600 cursor-default' : canAfford ? 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-105' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                          >
                            {maxed ? 'MAX' : `💜 ${upg.cost}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={refundAllPrestige}
                    disabled={!canRefund}
                    className={`w-full mt-4 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${canRefund ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:scale-[1.02]' : 'bg-white/[0.02] border-white/5 text-gray-600 cursor-not-allowed'}`}
                  >
                    <span>♻️</span>
                    <span>Refund All Upgrades</span>
                    <span className="text-[10px] opacity-70">({(REFUND_COIN_COST).toLocaleString()} Coins)</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <div className="grid grid-cols-2 gap-2 p-1">
                  {[
                    [t('sc.stat.rawClicks'), formatNum(gs.rawClicks), '🖱️'],
                    [t('sc.stat.sigmas'), formatNum(gs.sigmas), '🗿'],
                    [t('sc.stat.spc'), formatNum(clickPower), '👆'],
                    [t('sc.stat.cps'), formatNum(idlePower), '⚙️'],
                    [t('sc.stat.cpm'), String(cpm), '📈'],
                    [t('sc.stat.sessionTime'), sessionTime, '⏱️'],
                    [t('sc.stat.hoursPlayed'), (gs.lifetimeHoursPlayed + (Date.now() - sessionStart) / 3600000).toFixed(1), '🕐'],
                    [t('sc.stat.upgradesBought'), String(gs.totalUpgrades), '📦'],
                    [t('sc.stat.rebirths'), String(gs.rebirths), '🔄'],
                    [t('sc.stat.auraMult'), prestigeMult + 'x', '✨'],
                    [t('sc.stat.brainMult'), puzzleMult + 'x', '🧠'],
                    [t('sc.stat.lifetimeSigmas'), formatNum(gs.lifetimeSigmas), '💎'],
                    ['Critical Hits', formatNum(gs.criticalHits || 0), '⚡'],
                    ['Max Combo', String(gs.maxCombo || 0), '🔥'],
                    ['Chests Opened', String(gs.chestsOpened || 0), '📦'],
                    ['Legendary Chests', String(gs.legendaryChests || 0), '👑'],
                    ['Combo Bonus', formatNum(gs.totalComboBonus || 0), '💥'],
                    ['Offline Earnings', formatNum(gs.totalOfflineEarnings || 0), '🌙'],
                    ['Global Mult', `+${(gs.globalMultiplierLevel || 0) * 25}%`, '🌟'],
                    ['Synergy Levels', String(Object.values(gs.synergyLevels || {}).reduce((a: number, b: number) => a + b, 0)), '🔗'],
                  ].map(([label, val, icon]) => (
                    <div key={label} className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                      <p className="text-xs text-gray-400">{icon} {label}</p>
                      <p className="text-lg font-bold text-white">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={exportSave} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-bold">
                    <Download size={16} /> Export Save
                  </button>
                  <button onClick={importSave} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-sm font-bold">
                    <Upload size={16} /> Import Save
                  </button>
                </div>
                <div className="mt-3 border-t border-red-500/10 pt-3">
                  {!showTrueReset ? (
                    <button onClick={() => setShowTrueReset(true)} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-500/5 text-red-400/60 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-bold">
                      🔥 True Reset
                    </button>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                      <p className="text-red-300 font-bold text-sm mb-1">Are you sure?</p>
                      <p className="text-red-400/70 text-xs mb-3">This will erase ALL progress — rebirths, prestige points, cosmetics, everything. This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowTrueReset(false)} className="flex-1 p-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">Cancel</button>
                        <button onClick={doTrueReset} className="flex-1 p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all text-sm font-bold">Yes, Reset Everything</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <InventoryPanel gs={gs} onEquipTitle={equipTitle} onEquipBorder={equipBorder} onEquipBadge={equipBadge} serverInventory={appState.inventory} />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardPanel gs={gs} sessionStart={sessionStart} loggedIn={appState.authMode === 'logged_in'} username={appState.username} />
            )}

            {activeTab === 'credits' && (
              <div className="p-2 space-y-3">
                <div className="flex flex-col items-center mb-2">
                  <span className="inline-block w-16 h-16 overflow-hidden rounded-xl border-2 border-amber-500/40 bg-black/40"><img src="/sigma-creator-badge.png" alt="Sigma Creator" className="w-full h-full object-contain scale-[1.8]" /></span>
                  <h3 className="text-sm font-bold text-amber-300 text-center mt-2">{t('sc.credits.title')}</h3>
                </div>
                {[
                  { name: 'Milo', discord: 'milo_kdi', insta: 'milo_kd1' },
                  { name: '702jv', discord: '702jv', insta: 'elver_galarga974' },
                  { name: 'Sigma Studios', x: 'AlphaM6099', insta: 'sigma_studiosofficial' },
                ].map(p => (
                  <div key={p.name} className="bg-white/5 rounded-xl p-3 border border-amber-500/20">
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {p.discord && (
                        <a href={`https://discord.com/users/${p.discord}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full hover:bg-indigo-500/30 transition-colors cursor-pointer">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                          {p.discord}
                        </a>
                      )}
                      {p.insta && (
                        <a href={`https://instagram.com/${p.insta}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full hover:bg-pink-500/30 transition-colors cursor-pointer">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                          {p.insta}
                        </a>
                      )}
                      {p.x && (
                        <a href={`https://x.com/${p.x}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-full hover:bg-gray-500/30 transition-colors cursor-pointer">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          {p.x}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {offlineEarnings > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOfflineEarnings(0)}>
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-cyan-500/30 max-w-sm mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🌙</div>
            <h3 className="text-xl font-black text-white mb-2">Welcome Back!</h3>
            <p className="text-gray-400 text-sm mb-2">While you were away, your idle machines earned:</p>
            <p className="text-3xl font-black text-cyan-300 mb-2" style={{ textShadow: '0 0 12px #06b6d466' }}><span className="inline-flex items-center gap-1">+{formatNum(offlineEarnings ?? 0)} <span className="inline-block w-5 h-5 overflow-hidden"><img src="/synergy-coin.png" alt="Σ" className="w-full h-full object-contain scale-[2.2]" /></span></span></p>
            <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <p className="text-emerald-300 text-sm font-bold">✨ Rested Aura Active!</p>
              <p className="text-emerald-400/70 text-xs">2x production for 5 minutes</p>
            </div>
            <button onClick={() => setOfflineEarnings(0)}
              className="w-full p-3 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
              Collect & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
