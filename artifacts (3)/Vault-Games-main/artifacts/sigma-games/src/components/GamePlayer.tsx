import { X, Maximize, ExternalLink, Loader2 } from 'lucide-react';
import { Game } from '../data/games';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { TicTacToe } from '../games/TicTacToe';
import { Game2048 } from '../games/Game2048';
import { NeonClicker } from '../games/NeonClicker';
import { ChessGame } from '../games/ChessGame';
import { Sudoku } from '../games/Sudoku';
import { SnakeGame } from '../games/SnakeGame';

interface GamePlayerProps {
  game: Game;
  onClose: () => void;
}

export function GamePlayer({ game, onClose }: GamePlayerProps) {
  const { t } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const isNative = game.embedUrl.startsWith('native:');
  const nativeGameName = isNative ? game.embedUrl.split(':')[1] : null;

  const renderNativeGame = () => {
    switch (nativeGameName) {
      case 'TicTacToe': return <TicTacToe />;
      case 'Game2048': return <Game2048 />;
      case 'NeonClicker': return <NeonClicker />;
      case 'ChessGame': return <ChessGame />;
      case 'Sudoku': return <Sudoku />;
      case 'SnakeGame': return <SnakeGame />;
      default: return <div className="text-white">{t('games.none')}</div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="w-full max-w-6xl h-full max-h-[90vh] bg-[#1a1a1a] rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.2)] border border-white/10 flex flex-col overflow-hidden"
      >
        
        <div className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">{game.title}</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-900/30 px-2.5 py-1 rounded-md border border-violet-500/20">
              {t(`cat.${game.category.toLowerCase().replace(' ', '')}`)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isNative && (
              <>
                <a
                  href={game.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title={t('player.open')}
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title={t('player.fullscreen')}
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title={t('player.close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {isNative ? (
            renderNativeGame()
          ) : (
            <>
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10"
                  >
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                    <p className="text-gray-400 font-medium animate-pulse">{t('games.loading').replace('{title}', game.title)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <iframe
                ref={iframeRef}
                src={game.embedUrl}
                className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                allow="fullscreen; autoplay; encrypted-media; accelerometer; gyroscope; magnetometer; storage-access"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation allow-pointer-lock"
                title={game.title}
                onLoad={() => setIsLoading(false)}
              />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
