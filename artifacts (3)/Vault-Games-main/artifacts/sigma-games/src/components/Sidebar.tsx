import { useCallback } from 'react';
import { Gamepad2, Swords, Puzzle, Trophy, Users, MonitorPlay, Box, MousePointerClick, Store, Target, User, Map, Library, Settings, LogIn, LogOut, Car, Sparkles, Smile, MessageCircle, Backpack, Bot } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useGameContext } from '../context/GameContext';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onGoHome: () => void;
  onOpenAuthModal: () => void;
}

const MAIN_VIEWS = [
  { id: 'games', nameKey: 'nav.games', icon: MonitorPlay, color: 'text-violet-400', bg: 'bg-violet-600/20' },
  { id: 'roadmap', nameKey: 'nav.roadmap', icon: Map, color: 'text-blue-400', bg: 'bg-blue-600/20' },
  { id: 'quests', nameKey: 'nav.quests', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
  { id: 'achievements', nameKey: 'nav.achievements', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
  { id: 'store', nameKey: 'nav.store', icon: Store, color: 'text-fuchsia-400', bg: 'bg-fuchsia-600/20' },
  { id: 'inventory', nameKey: 'nav.inventory', icon: Backpack, color: 'text-amber-400', bg: 'bg-amber-600/20' },
  { id: 'profile', nameKey: 'nav.profile', icon: User, color: 'text-blue-400', bg: 'bg-blue-600/20' },
  { id: 'social', nameKey: 'nav.social', icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-600/20' },
  { id: 'ai-chat', nameKey: 'nav.aichat', icon: Bot, color: 'text-violet-400', bg: 'bg-violet-600/20' },
  { id: 'settings', nameKey: 'nav.settings', icon: Settings, color: 'text-gray-400', bg: 'bg-gray-600/20' },
] as const;

const CATEGORIES = [
  { nameKey: 'cat.all', icon: MonitorPlay, value: '' },
  { nameKey: 'cat.action', icon: Swords, value: 'Action' },
  { nameKey: 'cat.sandbox', icon: Box, value: 'Sandbox' },
  { nameKey: 'cat.clicker', icon: MousePointerClick, value: 'Clicker' },
  { nameKey: 'cat.puzzle', icon: Puzzle, value: 'Puzzle' },
  { nameKey: 'cat.sports', icon: Trophy, value: 'Sports' },
  { nameKey: 'cat.io', icon: Users, value: 'IO Games' },
  { nameKey: 'cat.racing', icon: Car, value: 'Racing' },
  { nameKey: 'cat.asmr', icon: Sparkles, value: 'ASMR' },
  { nameKey: 'cat.fun', icon: Smile, value: 'Fun' },
  { nameKey: 'cat.classics', icon: Library, value: 'Classics' },
];

export function Sidebar({ currentView, onSelectView, selectedCategory, onSelectCategory, onGoHome, onOpenAuthModal }: SidebarProps) {
  const { t } = useLanguage();
  const { state, logout } = useGameContext();
  const handleLogoClick = useCallback(() => {
    onGoHome();
  }, [onGoHome]);

  return (
    <aside className="w-64 bg-[#1a1a1a] h-screen sticky top-0 flex flex-col border-r border-white/5">
      <button onClick={handleLogoClick} className="p-6 flex items-center gap-3 hover:bg-white/5 transition-colors text-left w-full">
        <div className="bg-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Vault</h1>
      </button>
      
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            {t('nav.menu')}
          </div>
          <div className="space-y-1">
            {MAIN_VIEWS.map((view) => {
              const Icon = view.icon;
              const isSelected = currentView === view.id;
              
              const navButton = (
                <button
                  key={view.id}
                  onClick={() => onSelectView(view.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? `${view.bg} ${view.color} font-medium` 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? view.color : 'text-gray-500'}`} />
                  {t(view.nameKey)}
                </button>
              );

              if (view.id === 'profile') {
                const loginButton = (
                  <button
                    key="login"
                    onClick={onOpenAuthModal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-600/20 mt-1"
                  >
                    <LogIn className="w-5 h-5 text-white" />
                    Login / Sign Up
                  </button>
                );

                if (state.authMode === 'none') return loginButton;
                if (state.authMode === 'guest') {
                  return (
                    <div key="profile-group">
                      {navButton}
                      {loginButton}
                    </div>
                  );
                }
              }

              return navButton;
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            {t('nav.categories')}
          </div>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = currentView === 'games' && selectedCategory === cat.value;
              
              return (
                <button
                  key={cat.nameKey}
                  onClick={() => {
                    onSelectView('games');
                    onSelectCategory(cat.value);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? 'bg-white/10 text-white font-medium' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                  {t(cat.nameKey)}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-white/5 space-y-3">
        {state.authMode !== 'none' && (
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        )}
        <div className="bg-white/5 rounded-xl p-3 text-sm text-gray-400">
          <p className="font-medium text-white mb-1">{t('footer.title')}</p>
          <p className="text-xs mb-3">{t('footer.desc')}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <button onClick={() => onSelectView('about')} className="text-gray-500 hover:text-violet-400 transition-colors">About</button>
            <button onClick={() => onSelectView('privacy')} className="text-gray-500 hover:text-violet-400 transition-colors">Privacy Policy</button>
            <button onClick={() => onSelectView('terms')} className="text-gray-500 hover:text-violet-400 transition-colors">Terms of Service</button>
            <a href="mailto:contact@vaultgames.site" className="text-gray-500 hover:text-violet-400 transition-colors">Feedback</a>
          </div>
        </div>
      </div>
    </aside>
  );
}
