import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Trophy, MessageCircle, Wifi, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'friend-request' | 'achievement' | 'dm' | 'friend-online';
  title: string;
  message: string;
  icon: string;
  timestamp: number;
}

export function NotificationToast() {
  const { state } = useGameContext();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevAchievements = useRef<string[]>([]);
  const prevFriendRequests = useRef<Set<string>>(new Set());
  const prevOnlineFriends = useRef<Set<string>>(new Set());
  const prevUnreadDMs = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).slice(2, 8);
    setNotifications(prev => {
      const next = [...prev, { ...notif, id, timestamp: Date.now() }];
      return next.slice(-4);
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      prevAchievements.current = [...(state.unlockedAchievements || [])];
      initialized.current = true;
      return;
    }
    const current = state.unlockedAchievements || [];
    const newOnes = current.filter(a => !prevAchievements.current.includes(a));
    newOnes.forEach(achId => {
      addNotification({
        type: 'achievement',
        title: t('notif.achievement'),
        message: t(`ach.${achId}.title`),
        icon: '🏆',
      });
    });
    prevAchievements.current = [...current];
  }, [state.unlockedAchievements]);

  useEffect(() => {
    if (state.authMode !== 'authenticated') return;

    const poll = async () => {
      try {
        const [friendsRes, dmRes] = await Promise.all([
          fetch('/api/social/friends', { credentials: 'include' }).then(r => r.ok ? r.json() : { friends: [] }),
          fetch('/api/chat/unread', { credentials: 'include' }).then(r => r.ok ? r.json() : { unread: [] }),
        ]);

        const friends = friendsRes.friends || [];
        const pendingRequests = friends.filter((f: any) => f.status === 'pending' && f.direction === 'incoming');
        const onlineFriends = friends.filter((f: any) => f.status === 'accepted' && f.isOnline);
        const unreadDMs = dmRes.unread || [];

        pendingRequests.forEach((req: any) => {
          const key = `fr-${req.friendshipId}`;
          if (!prevFriendRequests.current.has(key)) {
            prevFriendRequests.current.add(key);
            addNotification({
              type: 'friend-request',
              title: req.username,
              message: t('notif.friend-request'),
              icon: '👋',
            });
          }
        });

        onlineFriends.forEach((f: any) => {
          const key = `online-${f.friendId}`;
          if (!prevOnlineFriends.current.has(key)) {
            prevOnlineFriends.current.add(key);
            addNotification({
              type: 'friend-online',
              title: f.username,
              message: t('notif.friend-online'),
              icon: '🟢',
            });
          }
        });
        const currentOnlineIds = new Set(onlineFriends.map((f: any) => `online-${f.friendId}`));
        prevOnlineFriends.current.forEach(key => {
          if (!currentOnlineIds.has(key)) prevOnlineFriends.current.delete(key);
        });

        unreadDMs.forEach((dm: any) => {
          const key = `dm-${dm.sender_id}`;
          if (!prevUnreadDMs.current.has(key)) {
            prevUnreadDMs.current.add(key);
            addNotification({
              type: 'dm',
              title: dm.username || 'Someone',
              message: t('notif.dm'),
              icon: '💬',
            });
          }
        });
        const currentDMIds = new Set(unreadDMs.map((dm: any) => `dm-${dm.sender_id}`));
        prevUnreadDMs.current.forEach(key => {
          if (!currentDMIds.has(key)) prevUnreadDMs.current.delete(key);
        });

      } catch {}
    };

    poll();
    pollInterval.current = setInterval(poll, 15000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [state.authMode]);

  const iconMap = {
    'friend-request': UserPlus,
    'achievement': Trophy,
    'dm': MessageCircle,
    'friend-online': Wifi,
  };

  const colorMap = {
    'friend-request': { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    'achievement': { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    'dm': { bg: 'from-fuchsia-500/20 to-purple-500/20', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400' },
    'friend-online': { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  };

  return (
    <div className="fixed bottom-4 left-4 z-[90] flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(notif => {
          const Icon = iconMap[notif.type];
          const colors = colorMap[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ x: -300, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -300, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto bg-gradient-to-r ${colors.bg} backdrop-blur-xl border ${colors.border} rounded-2xl p-4 shadow-2xl shadow-black/40 flex items-start gap-3 cursor-pointer group`}
              onClick={() => dismiss(notif.id)}
            >
              <div className={`w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center shrink-0 ${colors.text}`}>
                <span className="text-lg">{notif.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{notif.title}</p>
                <p className="text-gray-300 text-xs mt-0.5">{notif.message}</p>
              </div>
              <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
