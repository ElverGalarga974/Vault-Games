import React, { useState, useEffect } from 'react';
import { getSudoku } from 'sudoku-gen';
import { RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function Sudoku() {
  const [puzzle, setPuzzle] = useState<string[]>([]);
  const [solution, setSolution] = useState<string[]>([]);
  const [userGrid, setUserGrid] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const initGame = () => {
    const sudoku = getSudoku(difficulty);
    setPuzzle(sudoku.puzzle.split(''));
    setSolution(sudoku.solution.split(''));
    setUserGrid(sudoku.puzzle.split(''));
    setSelectedCell(null);
    setIsComplete(false);
    setIsCorrect(false);
  };

  const handleCellClick = (index: number) => {
    setSelectedCell(index);
  };

  const handleNumberClick = (num: string) => {
    if (selectedCell !== null && puzzle[selectedCell] === '-') {
      const newGrid = [...userGrid];
      newGrid[selectedCell] = num;
      setUserGrid(newGrid);
      checkCompletion(newGrid);
    }
  };

  const handleErase = () => {
    if (selectedCell !== null && puzzle[selectedCell] === '-') {
      const newGrid = [...userGrid];
      newGrid[selectedCell] = '-';
      setUserGrid(newGrid);
    }
  };

  const checkCompletion = (grid: string[]) => {
    if (!grid.includes('-')) {
      setIsComplete(true);
      if (grid.join('') === solution.join('')) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    } else {
      setIsComplete(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell === null) return;
      if (e.key >= '1' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, userGrid]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#111] text-white p-4 sm:p-8 overflow-y-auto">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          Sudoku
        </h1>
        <div className="flex gap-2 justify-center">
          {['easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                difficulty === diff 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative bg-white p-1 rounded-xl shadow-2xl">
          <div className="grid grid-cols-9 gap-px bg-gray-800 border-2 border-gray-800">
            {userGrid.map((cell, i) => {
              const row = Math.floor(i / 9);
              const col = i % 9;
              const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
              
              const isThickRight = col === 2 || col === 5;
              const isThickBottom = row === 2 || row === 5;
              const isOriginal = puzzle[i] !== '-';
              const isSelected = selectedCell === i;
              
              let isPeer = false;
              let isSameNumber = false;

              if (selectedCell !== null) {
                const selectedRow = Math.floor(selectedCell / 9);
                const selectedCol = selectedCell % 9;
                const selectedBox = Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
                
                isPeer = row === selectedRow || col === selectedCol || box === selectedBox;
                isSameNumber = cell !== '-' && userGrid[selectedCell] === cell;
              }

              let bgColor = 'bg-white hover:bg-indigo-50';
              if (isSelected) bgColor = 'bg-indigo-300';
              else if (isSameNumber) bgColor = 'bg-indigo-200';
              else if (isPeer) bgColor = 'bg-indigo-50';

              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className={`
                    w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-2xl font-bold cursor-pointer select-none transition-colors
                    ${isThickRight ? 'border-r-2 border-r-gray-800' : ''}
                    ${isThickBottom ? 'border-b-2 border-b-gray-800' : ''}
                    ${bgColor}
                    ${isOriginal ? 'text-black' : 'text-indigo-600'}
                  `}
                >
                  {cell !== '-' ? cell : ''}
                </div>
              );
            })}
          </div>

          {isComplete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10"
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-4">You Won!</h2>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-4">Keep Trying!</h2>
                </>
              )}
              <button
                onClick={initGame}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-colors"
              >
                Play Again
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[280px]">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-14 bg-[#1a1a1a] hover:bg-white/10 border border-white/10 rounded-xl text-2xl font-bold text-white transition-colors"
              >
                {num}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleErase}
              className="h-12 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold transition-colors"
            >
              Erase
            </button>
            <button
              onClick={initGame}
              className="h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
