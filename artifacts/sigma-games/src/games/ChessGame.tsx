import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { RotateCcw, Users, Bot, ChevronLeft, Lightbulb, Loader2, Undo2, Crown } from 'lucide-react';
import { aiChatApi } from '../api/client';

type GameMode = 'menu' | 'pvp' | 'ai';
type AIDifficulty = { label: string; elo: string; depth: number; randomness: number; icon: string; color: string };

const AI_DIFFICULTIES: AIDifficulty[] = [
  { label: 'Beginner', elo: '~400',  depth: 1, randomness: 0.75, icon: '🟢', color: 'from-green-500 to-emerald-500'  },
  { label: 'Easy',     elo: '~800',  depth: 2, randomness: 0.40, icon: '🟡', color: 'from-yellow-500 to-amber-500'   },
  { label: 'Medium',   elo: '~1200', depth: 3, randomness: 0.15, icon: '🟠', color: 'from-orange-500 to-red-500'     },
  { label: 'Hard',     elo: '~1600', depth: 3, randomness: 0.05, icon: '🔴', color: 'from-red-500 to-rose-600'       },
  { label: 'Expert',   elo: '~2000', depth: 4, randomness: 0.01, icon: '💀', color: 'from-purple-500 to-violet-600'  },
];

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === 'w' ? -99999 : 99999;
  if (game.isDraw() || game.isStalemate()) return 0;
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const idx = r * 8 + c;
      const mirrorIdx = (7 - r) * 8 + c;
      const pv = PIECE_VALUES[piece.type] || 0;
      const ps = PST[piece.type]?.[piece.color === 'w' ? idx : mirrorIdx] || 0;
      score += piece.color === 'w' ? pv + ps : -(pv + ps);
    }
  }
  score += game.turn() === 'w' ? game.moves().length * 2 : -game.moves().length * 2;
  return score;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, isMax: boolean): number {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);
  const moves = game.moves();
  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move); best = Math.max(best, minimax(game, depth - 1, alpha, beta, false)); game.undo();
      alpha = Math.max(alpha, best); if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move); best = Math.min(best, minimax(game, depth - 1, alpha, beta, true)); game.undo();
      beta = Math.min(beta, best); if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIMove(game: Chess, difficulty: AIDifficulty): string | null {
  const moves = game.moves();
  if (!moves.length) return null;
  if (Math.random() < difficulty.randomness) return moves[Math.floor(Math.random() * moves.length)];
  const isBlack = game.turn() === 'b';
  let bestMove = moves[0];
  let bestScore = isBlack ? Infinity : -Infinity;
  for (const move of moves) {
    game.move(move);
    const score = minimax(game, difficulty.depth - 1, -Infinity, Infinity, !isBlack);
    game.undo();
    if (isBlack ? score < bestScore : score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}

type PromotionPiece = 'q' | 'r' | 'b' | 'n';
const PROMO_SYMBOLS: Record<string, string> = { q: '♛', r: '♜', b: '♝', n: '♞' };
const PIECE_CAPTURE_SYMBOLS: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

export function ChessGame() {
  const [mode, setMode]               = useState<GameMode>('menu');
  const [difficulty, setDifficulty]   = useState<AIDifficulty>(AI_DIFFICULTIES[1]);
  const [game, setGame]               = useState(new Chess());
  const [status, setStatus]           = useState('');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isThinking, setIsThinking]   = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]); // pieces white has captured
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]); // pieces black has captured
  const [hint, setHint]               = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [selectedSquare, setSelectedSquare]   = useState<Square | null>(null);
  const [validMoveSquares, setValidMoveSquares] = useState<Record<string, object>>({});
  const [lastMove, setLastMove]       = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveListRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveListRef.current) moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
  }, [moveHistory]);

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate())    setStatus(`♛ Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`);
    else if (g.isStalemate()) setStatus('Stalemate — Draw!');
    else if (g.isDraw())    setStatus('Draw!');
    else if (mode === 'ai') setStatus(g.turn() === playerColor ? `Your turn${g.isCheck() ? ' — Check!' : ''}` : 'AI thinking…');
    else setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move${g.isCheck() ? ' — Check!' : ''}`);
  }, [mode, playerColor]);

  useEffect(() => { updateStatus(game); }, [game, updateStatus]);
  useEffect(() => () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); }, []);

  const getHint = async () => {
    if (hintLoading || game.isGameOver()) return;
    setHintLoading(true); setHint('');
    try {
      let text = '';
      for await (const chunk of aiChatApi.chessHintStream(game.fen(), moveHistory)) {
        text += chunk; setHint(text);
      }
    } catch { setHint('Could not get a hint right now. Try again!'); }
    setHintLoading(false);
  };

  const makeAIMove = useCallback((g: Chess, diff: AIDifficulty) => {
    if (g.isGameOver() || g.turn() === playerColor) return;
    setIsThinking(true);
    aiTimeoutRef.current = setTimeout(() => {
      const aiMove = getAIMove(g, diff);
      if (aiMove) {
        const result = g.move(aiMove);
        if (result) {
          if (result.captured) {
            const sym = PIECE_CAPTURE_SYMBOLS[result.captured] ?? '?';
            setCapturedBlack(p => [...p, sym]); // AI is black, captures go to black's pile
          }
          setMoveHistory(prev => [...prev, result.san]);
          setLastMove({ from: result.from as Square, to: result.to as Square });
        }
        setGame(new Chess(g.fen()));
      }
      setIsThinking(false);
    }, 250 + Math.random() * 400);
  }, [playerColor]);

  const applyPlayerMove = (g: Chess, from: Square, to: Square, promotion?: PromotionPiece): boolean => {
    const result = g.move({ from, to, promotion: promotion ?? 'q' });
    if (!result) return false;
    if (result.captured) {
      const sym = PIECE_CAPTURE_SYMBOLS[result.captured] ?? '?';
      setCapturedWhite(p => [...p, sym]);
    }
    setMoveHistory(prev => [...prev, result.san]);
    setLastMove({ from, to });
    setGame(new Chess(g.fen()));
    setSelectedSquare(null);
    setValidMoveSquares({});
    if (mode === 'ai' && !g.isGameOver()) setTimeout(() => makeAIMove(g, difficulty), 100);
    return true;
  };

  const selectSquare = (square: Square) => {
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    const highlights: Record<string, object> = {};
    moves.forEach(m => { highlights[m.to] = {}; });
    setValidMoveSquares(highlights);
  };

  const handleSquareClick = (square: Square) => {
    if (game.isGameOver()) return;
    if (mode === 'ai' && (game.turn() !== playerColor || isThinking)) return;
    const piece = game.get(square);

    if (selectedSquare) {
      if (validMoveSquares[square] !== undefined) {
        const gameCopy = new Chess(game.fen());
        const movingPiece = gameCopy.get(selectedSquare);
        if (movingPiece?.type === 'p') {
          const rank = square[1];
          if ((movingPiece.color === 'w' && rank === '8') || (movingPiece.color === 'b' && rank === '1')) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null); setValidMoveSquares({});
            return;
          }
        }
        applyPlayerMove(gameCopy, selectedSquare, square);
        return;
      }
      if (piece && piece.color === game.turn()) { selectSquare(square); return; }
      setSelectedSquare(null); setValidMoveSquares({});
      return;
    }
    if (piece && piece.color === game.turn()) selectSquare(square);
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (game.isGameOver()) return false;
    if (mode === 'ai' && (game.turn() !== playerColor || isThinking)) return false;
    const gameCopy = new Chess(game.fen());
    const piece = gameCopy.get(sourceSquare);
    if (piece?.type === 'p') {
      const rank = targetSquare[1];
      if ((piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1')) {
        const test = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
        if (!test) return false;
        gameCopy.undo();
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        setSelectedSquare(null); setValidMoveSquares({});
        return true;
      }
    }
    return applyPlayerMove(gameCopy, sourceSquare, targetSquare);
  };

  const handlePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion) return;
    const gameCopy = new Chess(game.fen());
    applyPlayerMove(gameCopy, pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  };

  const undoMove = () => {
    if (isThinking || !moveHistory.length) return;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    const g = new Chess(game.fen());
    const count = mode === 'ai' && moveHistory.length >= 2 ? 2 : 1;
    let undone = 0;
    for (let i = 0; i < count; i++) {
      const r = g.undo();
      if (r) {
        undone++;
        if (r.captured) {
          const sym = PIECE_CAPTURE_SYMBOLS[r.captured] ?? '?';
          if (r.color === 'w') setCapturedWhite(p => { const a = [...p]; const idx = a.lastIndexOf(sym); if (idx !== -1) a.splice(idx, 1); return a; });
          else setCapturedBlack(p => { const a = [...p]; const idx = a.lastIndexOf(sym); if (idx !== -1) a.splice(idx, 1); return a; });
        }
      }
    }
    setMoveHistory(p => p.slice(0, p.length - undone));
    setLastMove(null); setSelectedSquare(null); setValidMoveSquares({}); setIsThinking(false);
    setGame(new Chess(g.fen()));
  };

  const resetGame = () => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    const g = new Chess();
    setGame(g); setMoveHistory([]); setCapturedWhite([]); setCapturedBlack([]);
    setIsThinking(false); setLastMove(null); setSelectedSquare(null); setValidMoveSquares({});
    setHint(''); setPendingPromotion(null);
    if (mode === 'ai' && playerColor === 'b') setTimeout(() => makeAIMove(g, difficulty), 500);
  };

  const startGame = (m: GameMode, diff?: AIDifficulty, color?: 'w' | 'b') => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    const d = diff ?? difficulty;
    const c = color ?? 'w';
    setMode(m); if (diff) setDifficulty(diff); if (color) setPlayerColor(color);
    const g = new Chess();
    setGame(g); setMoveHistory([]); setCapturedWhite([]); setCapturedBlack([]);
    setIsThinking(false); setLastMove(null); setSelectedSquare(null); setValidMoveSquares({});
    setHint(''); setPendingPromotion(null);
    if (m === 'ai' && c === 'b') setTimeout(() => makeAIMove(g, d), 500);
  };

  // Custom square highlights
  const customSquareStyles: Record<string, object> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(124,58,237,0.35)' };
    customSquareStyles[lastMove.to]   = { backgroundColor: 'rgba(124,58,237,0.55)' };
  }
  if (selectedSquare) customSquareStyles[selectedSquare] = { backgroundColor: 'rgba(250,204,21,0.55)' };
  Object.keys(validMoveSquares).forEach(sq => {
    const hasPiece = game.get(sq as Square);
    customSquareStyles[sq] = hasPiece
      ? { boxShadow: 'inset 0 0 0 3px rgba(250,204,21,0.75)' }
      : { background: 'radial-gradient(circle, rgba(250,204,21,0.55) 25%, transparent 25%)' };
  });
  if (game.isCheck()) {
    game.board().forEach((row, r) => row.forEach((p, c) => {
      if (p?.type === 'k' && p.color === game.turn()) {
        customSquareStyles[String.fromCharCode(97 + c) + (8 - r)] = { backgroundColor: 'rgba(239,68,68,0.65)' };
      }
    }));
  }

  // ── MENU ─────────────────────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#111] text-white p-4 sm:p-8 overflow-y-auto">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-5xl">♟</span>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Chess</h1>
        </div>
        <p className="text-gray-500 mb-8 text-sm">Choose a mode to start</p>
        <div className="w-full max-w-md space-y-4">
          <button onClick={() => startGame('pvp')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/30 hover:border-blue-400/60 hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-base text-blue-300">2-Player Local</p>
                <p className="text-xs text-gray-500">Play with a friend on the same device</p>
              </div>
            </div>
          </button>
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-violet-400" />
              <p className="font-bold text-sm text-violet-300 uppercase tracking-wide">Play vs AI</p>
            </div>
            <div className="space-y-2">
              {AI_DIFFICULTIES.map(d => (
                <div key={d.label} className={`w-full p-3 rounded-xl bg-gradient-to-r ${d.color}/10 border border-white/10 hover:border-white/25 transition-all flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{d.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-white">{d.label}</p>
                      <p className="text-[11px] text-gray-500">Elo {d.elo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => startGame('ai', d, 'w')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors">♔ White</button>
                    <button onClick={() => startGame('ai', d, 'b')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors">♚ Black</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────
  const isGameOver = game.isGameOver();

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#111] text-white p-3 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-[520px] flex items-center gap-2 mb-3">
        <button onClick={() => setMode('menu')} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="flex-1 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 truncate">
          {mode === 'ai' ? `vs AI · ${difficulty.icon} ${difficulty.label}` : '2-Player Chess'}
        </h1>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold shrink-0 transition-all ${
          isGameOver     ? 'bg-red-500/20 border-red-500/30 text-red-300' :
          game.isCheck() ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 animate-pulse' :
          isThinking     ? 'bg-violet-500/20 border-violet-500/30 text-violet-300 animate-pulse' :
                           'bg-white/5 border-white/10 text-gray-300'
        }`}>
          {isThinking ? '🤔 Thinking…' : status}
        </div>
      </div>

      <div className="flex gap-4 items-start flex-col lg:flex-row w-full max-w-[800px]">
        {/* Board */}
        <div className="flex flex-col items-center w-full lg:max-w-[480px]">
          <div className="w-full flex gap-0.5 mb-1 min-h-[20px] items-center">
            <span className="text-[10px] text-gray-600 mr-1">Captured:</span>
            {capturedWhite.map((p, i) => <span key={i} className="text-sm leading-none">{p}</span>)}
          </div>
          <div className="w-full bg-[#1a1a1a] p-2 sm:p-3 rounded-2xl shadow-2xl border border-white/10">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onPieceDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={mode === 'ai' && playerColor === 'b' ? 'black' : 'white'}
              customDarkSquareStyle={{ backgroundColor: '#5b21b6' }}
              customLightSquareStyle={{ backgroundColor: '#ddd6fe' }}
              customSquareStyles={customSquareStyles}
              animationDurationInMs={250}
              arePiecesDraggable={!isGameOver && !(mode === 'ai' && isThinking)}
            />
          </div>
          <div className="w-full flex gap-0.5 mt-1 min-h-[20px] items-center">
            <span className="text-[10px] text-gray-600 mr-1">Captured:</span>
            {capturedBlack.map((p, i) => <span key={i} className="text-sm leading-none">{p}</span>)}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3 w-full lg:w-44 shrink-0">
          <div className="flex flex-wrap lg:flex-col gap-2">
            <button onClick={resetGame} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium border border-white/10 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={undoMove} disabled={!moveHistory.length || isThinking}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-sm font-medium border border-white/10 transition-colors">
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button onClick={getHint} disabled={hintLoading || isGameOver || (mode === 'ai' && isThinking)}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/35 disabled:opacity-30 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-300 transition-colors">
              {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
              AI Hint
            </button>
          </div>

          {(hint || hintLoading) && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-gray-300 leading-relaxed">
              {hintLoading && !hint ? <span className="text-gray-500 italic">Analyzing…</span> : hint}
            </div>
          )}

          {moveHistory.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 flex flex-col overflow-hidden">
              <p className="text-[10px] font-bold text-gray-500 px-3 pt-2 pb-1 uppercase tracking-wider">Moves</p>
              <div ref={moveListRef} className="overflow-y-auto max-h-[200px] px-3 pb-2 space-y-0.5">
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                  <div key={i} className="flex text-xs gap-1">
                    <span className="text-gray-600 w-5 shrink-0">{i + 1}.</span>
                    <span className="text-white w-12 shrink-0">{moveHistory[i * 2]}</span>
                    <span className="text-gray-400">{moveHistory[i * 2 + 1] ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion dialog */}
      {pendingPromotion && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-400" />
              <p className="font-bold text-white">Promote pawn to…</p>
            </div>
            <div className="flex gap-3">
              {(['q', 'r', 'b', 'n'] as PromotionPiece[]).map(p => (
                <button key={p} onClick={() => handlePromotion(p)}
                  className="w-16 h-16 rounded-xl bg-white/5 hover:bg-violet-500/30 border border-white/10 hover:border-violet-400/50 transition-all text-4xl flex items-center justify-center"
                  title={{ q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[p]}
                >
                  {PROMO_SYMBOLS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
