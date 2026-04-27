import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { Trophy, Settings, Users, User, Play, RotateCcw, Shield } from 'lucide-react';

const GRID_SIZE = 20;
const BASE_TICK_RATE = 150;

type Point = { x: number; y: number };
type FruitType = 'apple' | 'pineapple' | 'grape' | 'blueberry' | 'cherry' | 'lemon' | 'portal';
type Fruit = Point & { type: FruitType; id: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type DeadSegment = { x: number; y: number; vx: number; vy: number; life: number; color: string; angle: number; rotSpeed: number };

type Player = {
  id: number;
  snake: Point[];
  direction: Point;
  inputQueue: Point[];
  score: number;
  status: 'alive' | 'dead';
  effects: { speedBoost: number; magnet: number; inverted: number; shield: boolean };
  skin: string;
  fruitsEaten: number;
  deadSegments: DeadSegment[];
};

type GameSettings = {
  twoPlayer: boolean;
  portalMode: boolean;
  twinMode: boolean;
  ghostMode: boolean;
  wallLess: boolean;
  statueMode: boolean;
  speedRamp: boolean;
};

class AudioSynth {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(type: 'crunch' | 'bloop' | 'crash' | 'levelup') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (type === 'crunch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'bloop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'levelup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }
}
const audio = new AudioSynth();

export function SnakeGame() {
  const { state, equipSkin } = useGameContext();
  const activeSkin = state.activeSkins?.snake || 'default';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [highScore, setHighScore] = useState(0);
  
  const [settings, setSettings] = useState<GameSettings>({
    twoPlayer: false,
    portalMode: false,
    twinMode: false,
    ghostMode: false,
    wallLess: false,
    statueMode: false,
    speedRamp: false,
  });

  const [showSettings, setShowSettings] = useState(false);

  const playersRef = useRef<Player[]>([]);
  const fruitsRef = useRef<Fruit[]>([]);
  const portalsRef = useRef<Point[]>([]);
  const statuesRef = useRef<Point[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTickRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const fruitIdCounter = useRef(0);
  const timeRef = useRef(0);

  const initGame = useCallback(() => {
    audio.init();
    const p1: Player = {
      id: 1,
      snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
      direction: { x: 1, y: 0 },
      inputQueue: [],
      score: 0,
      status: 'alive',
      effects: { speedBoost: 0, magnet: 0, inverted: 0, shield: false },
      skin: activeSkin,
      fruitsEaten: 0,
      deadSegments: []
    };

    const newPlayers = [p1];

    if (settings.twoPlayer) {
      newPlayers.push({
        id: 2,
        snake: [{ x: 14, y: 10 }, { x: 15, y: 10 }, { x: 16, y: 10 }],
        direction: { x: -1, y: 0 },
        inputQueue: [],
        score: 0,
        status: 'alive',
        effects: { speedBoost: 0, magnet: 0, inverted: 0, shield: false },
        skin: 'default', // P2 gets default for now
        fruitsEaten: 0,
        deadSegments: []
      });
    }

    if (settings.twinMode && !settings.twoPlayer) {
       newPlayers.push({
        id: 2,
        snake: [{ x: 14, y: 10 }, { x: 15, y: 10 }, { x: 16, y: 10 }],
        direction: { x: -1, y: 0 },
        inputQueue: [],
        score: 0,
        status: 'alive',
        effects: { speedBoost: 0, magnet: 0, inverted: 0, shield: false },
        skin: 'ghost', // Twin is ghosty
        fruitsEaten: 0,
        deadSegments: []
      });
    }

    playersRef.current = newPlayers;
    fruitsRef.current = [];
    portalsRef.current = [];
    statuesRef.current = [];
    particlesRef.current = [];
    spawnFruit();
    if (settings.portalMode) spawnFruit('portal');

    setGameState('playing');
    lastTickRef.current = performance.now();
  }, [activeSkin, settings]);

  const spawnFruit = (forceType?: FruitType) => {
    let x, y;
    let valid = false;
    while (!valid) {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      valid = true;
      
      for (const p of playersRef.current) {
        if (p.snake.some(s => s.x === x && s.y === y)) valid = false;
      }
      if (statuesRef.current.some(s => s.x === x && s.y === y)) valid = false;
      if (portalsRef.current.some(p => p.x === x && p.y === y)) valid = false;
      if (fruitsRef.current.some(f => f.x === x && f.y === y)) valid = false;
    }

    let type: FruitType = 'apple';
    if (forceType) {
      type = forceType;
    } else {
      const rand = Math.random();
      if (rand < 0.05) type = 'pineapple';
      else if (rand < 0.10) type = 'grape';
      else if (rand < 0.15) type = 'blueberry';
      else if (rand < 0.20) type = 'cherry';
      else if (rand < 0.25) type = 'lemon';
    }

    fruitsRef.current.push({ x, y, type, id: fruitIdCounter.current++ });
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x: x + 0.5,
        y: y + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        life: 1,
        maxLife: 1 + Math.random(),
        color,
        size: Math.random() * 0.4 + 0.1
      });
    }
  };

  const shatterSnake = (player: Player) => {
    player.snake.forEach((segment, i) => {
      player.deadSegments.push({
        x: segment.x,
        y: segment.y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 1,
        color: getSkinColor(player.skin, i, i===0),
        angle: 0,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    });
    player.snake = [];
  };

  const getSkinColor = (skin: string, index: number, isHead: boolean) => {
    switch(skin) {
      case 'neon': return '#d946ef';
      case 'gold': return '#facc15';
      case 'ghost': return 'rgba(255,255,255,0.5)';
      case 'glitch': return index % 2 === 0 ? '#22d3ee' : '#ef4444';
      case 'zebra': return index % 2 === 0 ? '#ffffff' : '#000000';
      case 'robo': return '#94a3b8'; // slate-400
      case 'rainbow': 
        const colors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
        return colors[index % colors.length];
      default: return isHead ? '#34d399' : '#10b981';
    }
  };

  const getFruitColor = (type: FruitType) => {
    switch(type) {
      case 'apple': return '#ef4444';
      case 'pineapple': return '#facc15';
      case 'grape': return '#a855f7';
      case 'blueberry': return '#3b82f6';
      case 'cherry': return '#9f1239';
      case 'lemon': return '#fef08a';
      case 'portal': return '#06b6d4';
    }
  };

  const updateLogic = useCallback(() => {
    const players = playersRef.current;
    let anyAlive = false;

    players.forEach(p => {
      if (p.effects.speedBoost > 0) p.effects.speedBoost--;
      if (p.effects.magnet > 0) p.effects.magnet--;
      if (p.effects.inverted > 0) p.effects.inverted--;
    });

    players.forEach(player => {
      if (player.status === 'dead') return;
      anyAlive = true;

      if (player.inputQueue.length > 0) {
        const nextDir = player.inputQueue.shift()!;
        if (player.direction.x !== -nextDir.x || player.direction.y !== -nextDir.y) {
          player.direction = nextDir;
        }
      }

      let dir = { ...player.direction };
      if (player.effects.inverted > 0) {
        dir.x *= -1;
        dir.y *= -1;
      }

      if (settings.twinMode && !settings.twoPlayer && player.id === 2) {
        const p1 = players.find(p => p.id === 1);
        if (p1) {
          dir = { x: -p1.direction.x, y: -p1.direction.y };
        }
      }

      const head = player.snake[0];
      let newHead = { x: head.x + dir.x, y: head.y + dir.y };

      if (settings.wallLess) {
        newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
        newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
      }

      if (player.effects.magnet > 0 && fruitsRef.current.length > 0) {
        const closestFruit = fruitsRef.current.reduce((prev, curr) => {
          const dPrev = Math.abs(prev.x - head.x) + Math.abs(prev.y - head.y);
          const dCurr = Math.abs(curr.x - head.x) + Math.abs(curr.y - head.y);
          return dCurr < dPrev ? curr : prev;
        }, fruitsRef.current[0]);

        if (closestFruit) {
          const dx = closestFruit.x - head.x;
          const dy = closestFruit.y - head.y;
          if (Math.abs(dx) + Math.abs(dy) <= 3) { // Magnet range
            if (Math.abs(dx) > Math.abs(dy)) {
              newHead = { x: head.x + Math.sign(dx), y: head.y };
            } else {
              newHead = { x: head.x, y: head.y + Math.sign(dy) };
            }
          }
        }
      }

      let collided = false;

      if (!settings.wallLess && (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE)) {
        collided = true;
      }

      if (statuesRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
        collided = true;
      }

      if (!settings.ghostMode) {
        for (const other of players) {
          if (other.status === 'dead') continue;
          
          if (other.id !== player.id && other.snake[0].x === newHead.x && other.snake[0].y === newHead.y) {
             collided = true;
             other.status = 'dead';
             shatterSnake(other);
             audio.play('crash');
          }

          const segmentsToCheck = (other.id === player.id) ? other.snake.slice(0, -1) : other.snake;
          
          if (segmentsToCheck.some(s => s.x === newHead.x && s.y === newHead.y)) {
            collided = true;
          }
        }
      }

      if (collided) {
        if (player.effects.shield) {
          player.effects.shield = false;
          return; 
        } else {
          player.status = 'dead';
          shatterSnake(player);
          audio.play('crash');
          return;
        }
      }

      const portalIdx = portalsRef.current.findIndex(p => p.x === newHead.x && p.y === newHead.y);
      if (portalIdx !== -1 && portalsRef.current.length === 2) {
        const otherPortal = portalsRef.current[1 - portalIdx];
        newHead = { x: otherPortal.x, y: otherPortal.y };
        audio.play('bloop');
      }

      player.snake.unshift(newHead);

      const fruitIdx = fruitsRef.current.findIndex(f => f.x === newHead.x && f.y === newHead.y);
      let grew = false;

      if (fruitIdx !== -1) {
        const fruit = fruitsRef.current[fruitIdx];
        fruitsRef.current.splice(fruitIdx, 1);
        spawnParticles(newHead.x, newHead.y, getFruitColor(fruit.type));
        audio.play('crunch');

        player.fruitsEaten++;
        
        if (settings.statueMode && player.fruitsEaten % 5 === 0 && player.snake.length > 3) {
           const tail = player.snake.pop()!;
           statuesRef.current.push(tail);
        }

        switch (fruit.type) {
          case 'apple':
            player.score += 10;
            grew = true;
            break;
          case 'pineapple':
            player.score += 50;
            player.effects.speedBoost = 20; // 20 ticks
            grew = true;
            player.snake.push({...player.snake[player.snake.length-1]}); // Grow extra
            player.snake.push({...player.snake[player.snake.length-1]});
            break;
          case 'grape':
            player.score += 20;
            if (player.snake.length > 3) {
              player.snake.pop();
              player.snake.pop();
            }
            break;
          case 'blueberry':
            player.score += 15;
            player.effects.magnet = 50; // 50 ticks
            grew = true;
            break;
          case 'cherry':
            player.score += 30;
            player.effects.inverted = 30; // 30 ticks
            grew = true;
            break;
          case 'lemon':
            player.score += 20;
            player.effects.shield = true;
            grew = true;
            break;
          case 'portal':
            player.score += 10;
            grew = true;
            portalsRef.current = [];
            let p1 = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
            let p2 = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
            portalsRef.current.push(p1, p2);
            break;
        }

        if (Math.floor(player.score / 100) > Math.floor((player.score - 50) / 100)) {
          audio.play('levelup');
        }

        spawnFruit();
        if (settings.portalMode && Math.random() < 0.1 && !fruitsRef.current.some(f => f.type === 'portal')) {
          spawnFruit('portal');
        }
      }

      if (!grew) {
        player.snake.pop();
      }
    });

    if (!anyAlive) {
      setGameState('gameover');
      setHighScore(prev => {
        const maxScore = Math.max(...players.map(p => p.score));
        return Math.max(prev, maxScore);
      });
    }
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const p1 = playersRef.current.find(p => p.id === 1);
      const p2 = playersRef.current.find(p => p.id === 2);

      const queueInput = (player: Player, dx: number, dy: number) => {
        if (!player) return;
        const lastInput = player.inputQueue.length > 0 ? player.inputQueue[player.inputQueue.length - 1] : player.direction;
        if (lastInput.x !== -dx || lastInput.y !== -dy) {
          if (player.inputQueue.length < 3) {
            player.inputQueue.push({ x: dx, y: dy });
          }
        }
      };

      switch (e.key) {
        case 'w': case 'W': if(p1) queueInput(p1, 0, -1); break;
        case 's': case 'S': if(p1) queueInput(p1, 0, 1); break;
        case 'a': case 'A': if(p1) queueInput(p1, -1, 0); break;
        case 'd': case 'D': if(p1) queueInput(p1, 1, 0); break;
        
        case 'ArrowUp': if(p2) queueInput(p2, 0, -1); else if(!settings.twoPlayer && p1) queueInput(p1, 0, -1); break;
        case 'ArrowDown': if(p2) queueInput(p2, 0, 1); else if(!settings.twoPlayer && p1) queueInput(p1, 0, 1); break;
        case 'ArrowLeft': if(p2) queueInput(p2, -1, 0); else if(!settings.twoPlayer && p1) queueInput(p1, -1, 0); break;
        case 'ArrowRight': if(p2) queueInput(p2, 1, 0); else if(!settings.twoPlayer && p1) queueInput(p1, 1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, settings]);

  const touchStartRef = useRef<{x: number, y: number, id: number}[]>([]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      touchStartRef.current.push({ x: t.clientX, y: t.clientY, id: t.identifier });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const start = touchStartRef.current.find(ts => ts.id === t.identifier);
      if (start) {
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          let targetPlayer = playersRef.current.find(p => p.id === 1);
          if (settings.twoPlayer) {
             if (start.x > window.innerWidth / 2) {
               targetPlayer = playersRef.current.find(p => p.id === 2);
             }
          }

          if (targetPlayer) {
            const lastInput = targetPlayer.inputQueue.length > 0 ? targetPlayer.inputQueue[targetPlayer.inputQueue.length - 1] : targetPlayer.direction;
            let nx = 0, ny = 0;
            if (Math.abs(dx) > Math.abs(dy)) {
              nx = Math.sign(dx);
            } else {
              ny = Math.sign(dy);
            }
            if (lastInput.x !== -nx || lastInput.y !== -ny) {
              targetPlayer.inputQueue.push({ x: nx, y: ny });
            }
          }
        }
        touchStartRef.current = touchStartRef.current.filter(ts => ts.id !== t.identifier);
      }
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (container) {
      const size = Math.min(container.clientWidth, container.clientHeight);
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
    }

    const cellSize = canvas.width / GRID_SIZE;
    timeRef.current += 0.016; // Approx delta time

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#AAD751' : '#A2D149';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.fillStyle = '#78716c'; // stone-500
    statuesRef.current.forEach(s => {
      ctx.fillRect(s.x * cellSize, s.y * cellSize, cellSize, cellSize);
      ctx.fillStyle = '#57534e';
      ctx.fillRect(s.x * cellSize + 2, s.y * cellSize + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = '#78716c';
    });

    portalsRef.current.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2, cellSize/2 * (0.8 + Math.sin(timeRef.current * 5) * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#06b6d4' : '#d946ef';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    fruitsRef.current.forEach(f => {
      const cx = f.x * cellSize + cellSize / 2;
      const cy = f.y * cellSize + cellSize / 2;
      const radius = cellSize / 2 * 0.8;
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius + Math.sin(timeRef.current * 10 + f.id) * 2, 0, Math.PI * 2);
      ctx.fillStyle = getFruitColor(f.type);
      ctx.fill();

      if (f.type === 'apple' || f.type === 'cherry') {
        ctx.fillStyle = '#22c55e'; // leaf
        ctx.fillRect(cx - 2, cy - radius - 4, 4, 6);
      } else if (f.type === 'pineapple') {
        ctx.fillStyle = '#22c55e'; // crown
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - radius);
        ctx.lineTo(cx, cy - radius - 8);
        ctx.lineTo(cx + 6, cy - radius);
        ctx.fill();
      } else if (f.type === 'lemon') {
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    playersRef.current.forEach(player => {
      if (player.status === 'alive') {
        player.snake.forEach((segment, i) => {
          const isHead = i === 0;
          const px = segment.x * cellSize;
          const py = segment.y * cellSize;

          ctx.fillStyle = getSkinColor(player.skin, i, isHead);
          
          if (player.skin === 'ghost' || settings.ghostMode) {
            ctx.globalAlpha = 0.5;
          }

          const r = isHead ? cellSize * 0.4 : cellSize * 0.2;
          ctx.beginPath();
          if (player.skin === 'robo') {
            ctx.rect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize/3);
          } else {
            ctx.roundRect(px + 1, py + 1, cellSize - 2, cellSize - 2, r);
            ctx.fill();
          }

          if (player.effects.shield) {
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (isHead) {
            ctx.fillStyle = '#000';
            let ex1 = px + cellSize/2, ey1 = py + cellSize/2;
            let ex2 = px + cellSize/2, ey2 = py + cellSize/2;
            
            if (player.direction.x === 1) { ex1 += 4; ey1 -= 4; ex2 += 4; ey2 += 4; }
            else if (player.direction.x === -1) { ex1 -= 4; ey1 -= 4; ex2 -= 4; ey2 += 4; }
            else if (player.direction.y === 1) { ex1 -= 4; ey1 += 4; ex2 += 4; ey2 += 4; }
            else if (player.direction.y === -1) { ex1 -= 4; ey1 -= 4; ex2 += 4; ey2 -= 4; }

            ctx.beginPath(); ctx.arc(ex1, ey1, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(ex2, ey2, 2, 0, Math.PI*2); ctx.fill();
            
            if (player.skin === 'robo') {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath(); ctx.arc(ex1, ey1, 1, 0, Math.PI*2); ctx.fill();
              ctx.beginPath(); ctx.arc(ex2, ey2, 1, 0, Math.PI*2); ctx.fill();
            }

            if (player.skin === 'dragon') {
              ctx.fillStyle = '#ef4444';
              if (player.direction.x !== 0) {
                ctx.fillRect(px + cellSize/2 - 2, py - 8, 4, 8);
                ctx.fillRect(px + cellSize/2 - 2, py + cellSize, 4, 8);
              } else {
                ctx.fillRect(px - 8, py + cellSize/2 - 2, 8, 4);
                ctx.fillRect(px + cellSize, py + cellSize/2 - 2, 8, 4);
              }
            }
          }

          ctx.globalAlpha = 1.0;
        });
      }

      player.deadSegments.forEach(ds => {
        ctx.save();
        ctx.translate(ds.x * cellSize + cellSize/2, ds.y * cellSize + cellSize/2);
        ctx.rotate(ds.angle);
        ctx.globalAlpha = ds.life;
        ctx.fillStyle = ds.color;
        ctx.fillRect(-cellSize/2 + 2, -cellSize/2 + 2, cellSize - 4, cellSize - 4);
        ctx.restore();
      });
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cellSize, p.y * cellSize, p.size * cellSize, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

  }, [settings.ghostMode]);

  const loop = useCallback((timestamp: number) => {
    if (gameState === 'playing') {
      let currentTickRate = BASE_TICK_RATE;
      
      const p1 = playersRef.current.find(p => p.id === 1);
      if (settings.speedRamp && p1) {
        currentTickRate *= Math.pow(0.98, p1.fruitsEaten); // 2% faster per fruit
      }
      if (p1 && p1.effects.speedBoost > 0) {
        currentTickRate *= 0.5;
      }

      currentTickRate = Math.max(30, currentTickRate); // Cap max speed

      if (timestamp - lastTickRef.current >= currentTickRate) {
        updateLogic();
        lastTickRef.current = timestamp;
      }
    }

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    playersRef.current.forEach(player => {
      player.deadSegments.forEach(ds => {
        ds.x += ds.vx;
        ds.y += ds.vy;
        ds.angle += ds.rotSpeed;
        ds.life -= 0.01;
      });
      player.deadSegments = player.deadSegments.filter(ds => ds.life > 0);
    });

    draw();
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [gameState, updateLogic, draw, settings.speedRamp]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [loop]);


  const p1 = playersRef.current.find(p => p.id === 1);
  const p2 = playersRef.current.find(p => p.id === 2);

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#111] font-sans text-white overflow-hidden relative"
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}>
      
      <div className="w-full max-w-3xl p-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#AAD751] text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
            <Trophy className="w-5 h-5" />
            {highScore}
          </div>
          {gameState === 'playing' && p1 && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-emerald-400">{p1.score}</span>
              {p1.effects.shield && <Shield className="w-4 h-4 text-blue-400" />}
            </div>
          )}
          {gameState === 'playing' && p2 && (
            <div className="flex items-center gap-2 ml-4 border-l border-white/20 pl-4">
              <span className="text-xl font-bold text-blue-400">P2: {p2.score}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 w-full max-w-3xl flex items-center justify-center p-4 relative">
        <div className="w-full aspect-square relative rounded-xl overflow-hidden shadow-2xl border-4 border-[#578a34]">
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#AAD751] to-emerald-400">
                SNAKE
              </h1>
              <button 
                onClick={initGame}
                className="px-8 py-4 bg-[#AAD751] text-black font-bold text-xl rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_20px_rgba(170,215,81,0.4)]"
              >
                <Play className="w-6 h-6 fill-current" /> PLAY NOW
              </button>
              <button 
                onClick={() => window.open('https://ais-dev-vjdv3olj5bygaeozmzku4a-137900526880.us-east5.run.app', '_blank')}
                className="mt-4 px-6 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
              >
                Visit Website
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
              <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
              <div className="flex gap-8 mb-8">
                {p1 && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Player 1</p>
                    <p className="text-3xl font-bold text-emerald-400">{p1.score}</p>
                  </div>
                )}
                {p2 && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Player 2</p>
                    <p className="text-3xl font-bold text-blue-400">{p2.score}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={initGame}
                className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Game Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Game Mods</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-bold">Two Player Mode</div>
                        <div className="text-xs text-gray-400">WASD vs Arrow Keys</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.twoPlayer} onChange={e => setSettings({...settings, twoPlayer: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-cyan-400" />
                      <div>
                        <div className="font-bold">Portal Mode</div>
                        <div className="text-xs text-gray-400">Eat cyan fruits to spawn portals</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.portalMode} onChange={e => setSettings({...settings, portalMode: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="font-bold">Twin Mode</div>
                        <div className="text-xs text-gray-400">Control two mirrored snakes</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.twinMode} onChange={e => setSettings({...settings, twinMode: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" disabled={settings.twoPlayer} />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="font-bold">Ghost Mode</div>
                      <div className="text-xs text-gray-400">Pass through your own body</div>
                    </div>
                    <input type="checkbox" checked={settings.ghostMode} onChange={e => setSettings({...settings, ghostMode: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="font-bold">Wall-less</div>
                      <div className="text-xs text-gray-400">Wrap around the screen</div>
                    </div>
                    <input type="checkbox" checked={settings.wallLess} onChange={e => setSettings({...settings, wallLess: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="font-bold">Statue Mode</div>
                      <div className="text-xs text-gray-400">Drop permanent obstacles</div>
                    </div>
                    <input type="checkbox" checked={settings.statueMode} onChange={e => setSettings({...settings, statueMode: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="font-bold">Speed Ramp</div>
                      <div className="text-xs text-gray-400">Game gets faster over time</div>
                    </div>
                    <input type="checkbox" checked={settings.speedRamp} onChange={e => setSettings({...settings, speedRamp: e.target.checked})} className="w-5 h-5 accent-[#AAD751]" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Snake Skins</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(state.skins.snake || ['default']).map((skin) => (
                    <button
                      key={skin}
                      onClick={() => equipSkin('snake', skin)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        activeSkin === skin 
                          ? 'border-[#AAD751] bg-[#AAD751]/10' 
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-md" 
                        style={{ background: getSkinColor(skin, 0, true) }}
                      />
                      <span className="text-xs font-bold capitalize">{skin}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setShowSettings(false); initGame(); }}
              className="w-full mt-6 py-3 bg-[#AAD751] text-black font-bold rounded-xl hover:bg-[#99c249] transition-colors"
            >
              Apply & Restart
            </button>
          </div>
        </div>
      )}

      <div className="md:hidden p-4 text-center text-gray-400 text-sm">
        {settings.twoPlayer ? 'Split screen: Left side P1, Right side P2' : 'Swipe anywhere to move'}
      </div>
    </div>
  );
}

