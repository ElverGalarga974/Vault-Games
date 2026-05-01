import { motion, AnimatePresence } from 'motion/react';
import { Flame, X, ShieldAlert, Coins } from 'lucide-react';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export function StreakPopup() {
  const { state, resolveStreakLoss, clearStreakIncrease } = useGameContext();
  const { t } = useLanguage();

  const isVisible = state.showStreakIncrease || state.pendingStreakLoss !== null;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {state.showStreakIncrease ? (
            <div className="text-center">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-500/20 to-transparent pointer-events-none" />
              
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                  <Flame className="w-12 h-12 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-2">Streak Increased!</h2>
              <p className="text-gray-400 mb-6">
                You're on a <span className="text-orange-400 font-bold">{state.streak} day</span> streak! Keep it up to earn bigger rewards.
              </p>

              <button
                onClick={clearStreakIncrease}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
              >
                Awesome!
              </button>
            </div>
          ) : state.pendingStreakLoss ? (
            <div className="text-center">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-500/20 to-transparent pointer-events-none" />
              
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="relative bg-gradient-to-br from-red-500 to-rose-600 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-red-500/50">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-2">Streak Lost!</h2>
              <p className="text-gray-400 mb-6">
                Oh no! You missed a day and lost your <span className="text-orange-400 font-bold">{state.pendingStreakLoss.oldStreak} day</span> streak.
              </p>

              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <p className="text-sm text-gray-300 mb-3">Restore your streak for:</p>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
                  <Coins className="w-6 h-6" />
                  {state.pendingStreakLoss.cost}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => resolveStreakLoss(true)}
                  disabled={state.coins < state.pendingStreakLoss.cost}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    state.coins >= state.pendingStreakLoss.cost
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                  Restore Streak
                </button>
                <button
                  onClick={() => resolveStreakLoss(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-bold transition-colors"
                >
                  Let it go
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
