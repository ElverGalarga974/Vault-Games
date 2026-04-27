import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { RotateCcw, Users, Bot, ChevronLeft, Lightbulb, Loader2 } from 'lucide-react';
import { aiChatApi } from '../api/client';

type GameMode = 'menu' | 'pvp' | 'ai';
type AIDifficulty = { label: string; elo: string; depth: number; randomness: number; icon: string; color: string };

const AI_DIFFICULTIES: AIDifficulty[] = [
  { label: 'Beginner', elo: '~400', depth: 1, randomness: 0.7, icon: '🟢', color: 'from-green-500 to-emerald-500' },
  { label: 'Easy', elo: '~800', depth: 2, randomness: 0.4, icon: '🟡', color: 'from-yellow-500 to-amber-500' },
  { label: 'Medium', elo: '~1200', depth: 3, randomness: 0.15, icon: '🟠', color: 'from-orange-500 to-red-500' },
  { label: 'Hard', elo: '~1600', depth: 3, randomness: 0.05, icon: '🔴', color: 'from-red-500 to-rose-600' },
  { label: 'Expert', elo: '~2000', depth: 4, randomness: 0.02, icon: '💀', color: 'from-purple-500 to-violet-600' },
];

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const PST_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const PST_QUEEN = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const PST_KING_MID = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const PST: Record<string, number[]> = {
  p: PST_PAWN,
  n: PST_KNIGHT,
  b: PST_BISHOP,
  r: PST_ROOK,
  q: PST_QUEEN,
  k: PST_KING_MID,
};

function squareToIndex(sq: string): number {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1]);
  return rank * 8 + file;
}

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
      const pieceVal = PIECE_VALUES[piece.type] || 0;
      const pstVal = PST[piece.type]?.[piece.color === 'w' ? idx : mirrorIdx] || 0;
      score += piece.color === 'w' ? (pieceVal + pstVal) : -(pieceVal + pstVal);
    }
  }

  const mobility = game.moves().length;
  score += game.turn() === 'w' ? mobility * 2 : -mobility * 2;

  return score;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, isMax: boolean): number {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);

  const moves = game.moves();
  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIMove(game: Chess, difficulty: AIDifficulty): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  if (Math.random() < difficulty.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const isBlack = game.turn() === 'b';
  let bestMove = moves[0];
  let bestScore = isBlack ? Infinity : -Infinity;

  for (const move of moves) {
    game.move(move);
    const score = minimax(game, difficulty.depth - 1, -Infinity, Infinity, !isBlack);
    game.undo();

    if (isBlack ? score < bestScore : score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function ChessGame() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AI_DIFFICULTIES[1]);
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState('');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isThinking, setIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getHint = async () => {
    if (hintLoading || game.isGameOver()) return;
    setHintLoading(true);
    setHint('');
    try {
      let text = '';
      for await (const chunk of aiChatApi.chessHintStream(game.fen(), moveHistory)) {
        text += chunk;
        setHint(text);
      }
    } catch {
      setHint('Could not get a hint right now. Try again!');
    }
    setHintLoading(false);
  };

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      setStatus(`Checkmate! ${winner} wins!`);
    } else if (g.isDraw()) {
      setStatus('Draw!');
    } else if (g.isStalemate()) {
      setStatus('Stalemate!');
    } else {
      const turn = g.turn() === 'w' ? 'White' : 'Black';
      const check = g.isCheck() ? ' (Check!)' : '';
      if (mode === 'ai') {
        setStatus(g.turn() === playerColor ? `Your turn${check}` : `AI thinking...${check}`);
      } else {
        setStatus(`${turn} to move${check}`);
      }
    }
  }, [mode, playerColor]);

  useEffect(() => {
    updateStatus(game);
  }, [game, updateStatus]);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  const trackCapture = useCallback((g: Chess, move: any) => {
    if (move.captured) {
      const pieceMap: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
      const symbol = pieceMap[move.captured] || '?';
      if (move.color === 'w') {
        setCapturedBlack(prev => [...prev, symbol]);
      } else {
        setCapturedWhite(prev => [...prev, symbol]);
      }
    }
  }, []);

  const makeAIMove = useCallback((g: Chess) => {
    if (g.isGameOver() || g.turn() === playerColor) return;
    setIsThinking(true);
    aiTimeoutRef.current = setTimeout(() => {
      const aiMove = getAIMove(g, difficulty);
      if (aiMove) {
        const result = g.move(aiMove);
        if (result) {
          trackCapture(g, result);
          setMoveHistory(prev => [...prev, result.san]);
        }
        setGame(new Chess(g.fen()));
      }
      setIsThinking(false);
    }, 300 + Math.random() * 500);
  }, [playerColor, difficulty, trackCapture]);

  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false;
    if (mode === 'ai' && game.turn() !== playerColor) return false;
    if (isThinking) return false;

    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!result) return false;
      trackCapture(gameCopy, result);
      setMoveHistory(prev => [...prev, result.san]);
      setGame(gameCopy);
      if (mode === 'ai' && !gameCopy.isGameOver()) {
        setTimeout(() => makeAIMove(gameCopy), 100);
      }
      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    const g = new Chess();
    setGame(g);
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setIsThinking(false);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (mode === 'ai' && playerColor === 'b') {
      setTimeout(() => makeAIMove(g), 500);
    }
  }

  function startGame(m: GameMode, diff?: AIDifficulty, color?: 'w' | 'b') {
    setMode(m);
    if (diff) setDifficulty(diff);
    if (color) setPlayerColor(color);
    const g = new Chess();
    setGame(g);
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setIsThinking(false);
    if (m === 'ai' && color === 'b') {
      setTimeout(() => {
        const aiMove = getAIMove(g, diff || difficulty);
        if (aiMove) {
          const result = g.move(aiMove);
          if (result) setMoveHistory([result.san]);
          setGame(new Chess(g.fen()));
        }
      }, 500);
    }
  }

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#111] text-white p-4 sm:p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Chess</h1>
        <p className="text-gray-400 mb-8">Choose your game mode</p>

        <div className="w-full max-w-md space-y-4">
          <button onClick={() => startGame('pvp')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-400/60 transition-all hover:scale-[1.02] group">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div className="text-left">
                <p className="font-bold text-lg text-blue-300">2-Player Local</p>
                <p className="text-sm text-gray-400">Play with a friend on the same device</p>
              </div>
            </div>
          </button>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-purple-400" />
              <p className="font-bold text-purple-300">Play vs AI</p>
            </div>
            <div className="space-y-2">
              {AI_DIFFICULTIES.map(d => (
                <button key={d.label} onClick={() => startGame('ai', d, 'w')}
                  className={`w-full p-3 rounded-xl bg-gradient-to-r ${d.color}/10 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{d.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-white">{d.label}</p>
                      <p className="text-xs text-gray-500">Elo {d.elo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); startGame('ai', d, 'w'); }}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors">♔ White</button>
                    <button onClick={(e) => { e.stopPropagation(); startGame('ai', d, 'b'); }}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors">♚ Black</button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#111] text-white p-4 sm:p-8 overflow-y-auto">
      <div className="mb-4 text-center">
        <div className="flex items-center gap-2 justify-center mb-1">
          <button onClick={() => setMode('menu')} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            {mode === 'ai' ? `vs AI ${difficulty.icon} ${difficulty.label}` : '2-Player Chess'}
          </h1>
        </div>
        <div className={`inline-block px-4 py-1.5 rounded-full border shadow-lg ${
          game.isCheckmate() ? 'bg-red-500/20 border-red-500/30' :
          game.isCheck() ? 'bg-yellow-500/20 border-yellow-500/30' :
          'bg-white/10 border-white/5'
        }`}>
          <p className={`text-sm font-bold ${
            game.isCheckmate() ? 'text-red-400' :
            isThinking ? 'text-purple-300 animate-pulse' :
            'text-white'
          }`}>
            {status}
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-start flex-col sm:flex-row">
        <div className="w-full max-w-[440px]">
          {capturedWhite.length > 0 && (
            <div className="flex gap-0.5 mb-1 h-5 items-center">
              <span className="text-[10px] text-gray-500 mr-1">♔</span>
              {capturedWhite.map((p, i) => <span key={i} className="text-sm text-gray-400">{p}</span>)}
            </div>
          )}
          <div className="bg-[#1a1a1a] p-2 sm:p-4 rounded-2xl shadow-2xl border border-white/10">
            <Chessboard
              options={{
                position: game.fen(),
                onPieceDrop: onDrop,
                boardOrientation: mode === 'ai' && playerColor === 'b' ? 'black' : 'white',
                darkSquareStyle: { backgroundColor: '#7c3aed' },
                lightSquareStyle: { backgroundColor: '#ddd6fe' },
                animationDurationInMs: 300,
              }}
            />
          </div>
          {capturedBlack.length > 0 && (
            <div className="flex gap-0.5 mt-1 h-5 items-center">
              <span className="text-[10px] text-gray-500 mr-1">♚</span>
              {capturedBlack.map((p, i) => <span key={i} className="text-sm text-gray-400">{p}</span>)}
            </div>
          )}
        </div>

        {moveHistory.length > 0 && (
          <div className="w-full sm:w-48 bg-white/5 rounded-xl border border-white/10 p-3 max-h-[400px] overflow-y-auto">
            <p className="text-xs font-bold text-gray-400 mb-2">Moves</p>
            <div className="space-y-0.5">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                <div key={i} className="flex text-xs">
                  <span className="text-gray-600 w-6">{i + 1}.</span>
                  <span className="text-white w-14">{moveHistory[i * 2]}</span>
                  <span className="text-gray-400">{moveHistory[i * 2 + 1] || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 flex-wrap">
        <button onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-colors border border-white/10 text-sm">
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button onClick={() => setMode('menu')}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-colors border border-white/10 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Menu
        </button>
        <button
          onClick={getHint}
          disabled={hintLoading || game.isGameOver()}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600/30 hover:bg-violet-600/50 disabled:opacity-40 rounded-full font-semibold transition-colors border border-violet-500/30 text-sm text-violet-300"
        >
          {hintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
          AI Hint
        </button>
      </div>

      {(hint || hintLoading) && (
        <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-gray-300 max-w-md">
          {hintLoading && !hint ? (
            <span className="text-gray-500 italic">Analyzing position...</span>
          ) : hint}
        </div>
      )}
    </div>
  );
}

