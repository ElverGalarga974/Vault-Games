import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

type Player = 'X' | 'O' | null;

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#111] text-white font-sans">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Tic Tac Toe
        </h1>
        <p className="text-lg text-gray-400">
          {winner 
            ? <span className="text-green-400 font-bold">Winner: {winner}</span>
            : isDraw 
              ? <span className="text-yellow-400 font-bold">It's a Draw!</span>
              : <span>Next player: <span className={xIsNext ? 'text-violet-400 font-bold' : 'text-fuchsia-400 font-bold'}>{xIsNext ? 'X' : 'O'}</span></span>
          }
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/10">
        {board.map((square, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(i)}
            className="w-24 h-24 sm:w-32 sm:h-32 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-5xl sm:text-7xl font-bold shadow-inner border border-white/5 hover:bg-white/5 transition-colors"
          >
            {square && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={square === 'X' ? 'text-violet-500' : 'text-fuchsia-500'}
              >
                {square}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetGame}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-colors border border-white/10"
      >
        <RotateCcw className="w-5 h-5" />
        Restart Game
      </motion.button>
    </div>
  );
}
