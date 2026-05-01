import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socialApi, profileApi, chatApi, adminApi, ChatMessage, FriendshipRow, UserProfile } from '../api/client';
import { useGameContext } from '../context/GameContext';
import { Send, Search, UserPlus, Check, X, MessageCircle, Globe, Users, ChevronLeft, UserCheck, Image, Trophy, Flame, Star, Trash2, Shield, Crown, Loader2 } from 'lucide-react';

const SIGMA_BADGE_MAP: Record<string, { name: string; color: string; bg: string; border: string }> = {
  'badge-sigma-beginner': { name: 'Sigma Beginner', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  'badge-sigma-grinder': { name: 'Sigma Grinder', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  'badge-sigma-lord': { name: 'Sigma Lord', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  'badge-sigma-god': { name: 'Sigma God', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  'badge-ego-death': { name: 'Ego Death', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  'badge-triple-ego': { name: 'Triple Ego Death', color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
  'badge-clicker-warrior': { name: 'Clicker Warrior', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  'badge-clicker-legend': { name: 'Clicker Legend', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  'badge-sigma-creator': { name: 'Sigma Creator', color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
};

type SocialTab = 'global' | 'friends' | 'find';

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;

function isImageUrl(text: string): boolean {
  if (text.startsWith('data:image/')) return true;
  try {
    new URL(text);
    return IMAGE_EXTENSIONS.test(text);
  } catch {
    return false;
  }
}

function MessageContent({ text }: { text: string }) {
  if (isImageUrl(text)) {
    return (
      <img
        src={text}
        alt="shared image"
        className="max-w-[220px] max-h-[220px] rounded-xl object-contain border border-white/10 cursor-pointer"
        onClick={() => window.open(text, '_blank')}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return <span>{text}</span>;
}

function OnlineDot({ isOnline }: { isOnline?: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full border border-[#1a1a1a] ${isOnline ? 'bg-emerald-400' : 'bg-gray-600'}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}

function Avatar({ user, size = 'md' }: { user: { username: string; profile_pic_url?: string | null; friend_pic?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  const pic = user.profile_pic_url || user.friend_pic;
  const fallback = (
    <div className={`${sz} rounded-full bg-violet-600/40 items-center justify-center font-bold text-violet-200 flex-shrink-0`} style={{ display: pic ? 'none' : 'flex' }}>
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
  if (pic) return (
    <>
      <img src={pic} alt={user.username} className={`${sz} rounded-full object-cover flex-shrink-0 bg-violet-600/40`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const fb = (e.target as HTMLImageElement).nextElementSibling; if (fb) (fb as HTMLElement).style.display = 'flex'; }} />
      {fallback}
    </>
  );
  return fallback;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function UserProfileModal({ userId, onClose, onStartDM }: { userId: number; onClose: () => void; onStartDM?: (friendId: number) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'self'>('none');
  const [actionLoading, setActionLoading] = useState(false);
  const { currentUser } = useGameContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, friendsData] = await Promise.all([
          socialApi.getProfile(userId),
          socialApi.getFriends(),
        ]);
        setProfile(profileData.user);
        if (currentUser && userId === currentUser.id) {
          setFriendStatus('self');
        } else {
          const match = friendsData.friendships.find((f: any) => f.friend_id === userId);
          setFriendStatus(match ? match.status : 'none');
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUser]);

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await socialApi.sendRequest(userId);
      setFriendStatus('pending');
    } catch {} finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm">Loading profile...</div>
        ) : !profile ? (
          <div className="py-8 text-center text-gray-500 text-sm">Could not load profile.</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profile.profile_pic_url ? (
                <img src={profile.profile_pic_url} alt={profile.username} className="w-16 h-16 rounded-full object-cover border-2 border-violet-500/40"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile.username)}`; }} />
              ) : (
                <div className="w-16 h-16 rounded-full bg-violet-600/40 flex items-center justify-center text-2xl font-bold text-violet-200 border-2 border-violet-500/40">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                <OnlineDot isOnline={profile.isOnline} />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold" style={{ color: profile.name_color || '#fff' }}>
                {profile.username}
              </h3>
              <div className="flex items-center justify-center gap-1 mt-1">
                {profile.is_owner && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium"><Crown className="w-3 h-3 inline mr-0.5" />Owner</span>}
                {profile.is_admin && !profile.is_owner && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium"><Shield className="w-3 h-3 inline mr-0.5" />Admin</span>}
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-400 text-center italic max-w-[250px]">"{profile.bio}"</p>
            )}

            <div className="w-full grid grid-cols-3 gap-3 mt-1">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Level</p>
                <p className="text-white font-bold">{profile.level || 1}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Streak</p>
                <p className="text-white font-bold">{profile.streak || 0}d</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Coins</p>
                <p className="text-white font-bold">{(profile.coins || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
                <Users className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Friends</p>
                <p className="text-white font-bold">{profile.friendCount ?? 0}</p>
              </div>
              {currentUser && profile.id !== currentUser.id && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Mutuals</p>
                  <p className="text-white font-bold">{profile.mutualCount ?? 0}</p>
                </div>
              )}
            </div>

            {(profile.displayed_badges?.length > 0) && (
              <div className="w-full">
                <div className="flex flex-wrap justify-center gap-1.5">
                  {profile.displayed_badges.map((badgeId: string) => {
                    const info = SIGMA_BADGE_MAP[badgeId];
                    return info ? (
                      <span key={badgeId} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bg} ${info.border} ${info.color}`}>
                        {info.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {(profile.displayed_items?.length > 0) && (
              <div className="w-full flex flex-wrap justify-center gap-1.5">
                {profile.displayed_items.map((itemId: string) => (
                  <span key={itemId} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300">
                    {itemId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>
            )}

            {profile.current_game && (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-400 font-medium">🎮 Currently playing</p>
                <p className="text-white text-sm font-bold mt-0.5">{profile.current_game}</p>
              </div>
            )}

            {profile.inventory?.length > 0 && (
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2 font-medium">Inventory ({profile.inventory.length} items)</p>
                <div className="flex flex-wrap gap-1">
                  {profile.inventory.slice(0, 20).map((item: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                      {item.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                  {profile.inventory.length > 20 && <span className="text-[10px] text-gray-600">+{profile.inventory.length - 20} more</span>}
                </div>
              </div>
            )}

            {friendStatus !== 'self' && (
              <div className="w-full flex gap-2 mt-1">
                {friendStatus === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-gray-400 text-sm font-semibold rounded-xl">
                    <UserCheck className="w-4 h-4" />
                    Request Sent
                  </div>
                )}
                {friendStatus === 'accepted' && (
                  <>
                    <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600/20 text-emerald-400 text-sm font-semibold rounded-xl">
                      <UserCheck className="w-4 h-4" />
                      Friends
                    </div>
                    {onStartDM && (
                      <button
                        onClick={() => { onStartDM(userId); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500">
              {profile.isOnline ? '🟢 Online now' : profile.last_seen ? `Last seen ${new Date(profile.last_seen).toLocaleDateString()}` : 'Never seen online'}
            </p>
            <p className="text-[10px] text-gray-600">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function GlobalChat({ myUserId }: { myUserId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, state } = useGameContext();
  const isAdmin = state.isAdmin || state.isOwner;

  const handleDeleteMsg = async (id: number) => {
    try {
      await adminApi.deleteGlobalMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const data = await chatApi.getGlobal();
      setMessages(data.messages);
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const data = await chatApi.sendGlobal(text);
      setMessages(prev => [...prev, data.message]);
    } catch (e: any) {
      if (!msg) setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await chatApi.uploadImage(file);
      const result = await chatApi.sendGlobal(data.dataUrl);
      setMessages(prev => [...prev, result.message]);
    } catch (e: any) {
      console.error('Image upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No messages yet — say hi!
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === myUserId;
            return (
              <div key={msg.id} className={`flex gap-2.5 group/msg ${isMe ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => !isMe && setViewProfileId(msg.user_id)}
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isMe ? 'bg-violet-600/40 text-violet-200' : 'bg-white/10 text-gray-300 hover:bg-white/20 cursor-pointer'} transition-colors mt-4`}
                  title={isMe ? undefined : `View ${msg.username}'s profile`}
                >
                  {(msg.username || '?').charAt(0).toUpperCase()}
                </button>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setViewProfileId(msg.user_id)}
                        className="text-xs font-semibold hover:underline text-left"
                        style={{ color: msg.name_color || '#a78bfa' }}
                      >
                        {msg.username}
                      </button>
                      {msg.is_owner && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                          <Crown className="w-2.5 h-2.5" />OWNER
                        </span>
                      )}
                      {msg.is_admin && !msg.is_owner && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                          <Shield className="w-2.5 h-2.5" />ADMIN
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-end gap-1.5">
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${isMe ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-100 rounded-tl-sm'}`}>
                      <MessageContent text={msg.message} />
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMsg(msg.id)}
                        className="opacity-0 group-hover/msg:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-white/5">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); e.target.value = ''; } }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="p-2.5 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-40"
              title="Upload image"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
            </button>
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Message everyone..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              maxLength={300}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewProfileId && (
          <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DMChat({ friend, myUserId, onBack }: { friend: FriendshipRow; myUserId: number; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await chatApi.getDM(friend.friend_id);
      setMessages(data.messages);
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [friend.friend_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const data = await chatApi.sendDM(friend.friend_id, text);
      setMessages(prev => [...prev, data.message]);
    } catch {
      if (!msg) setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await chatApi.uploadImage(file);
      const result = await chatApi.sendDM(friend.friend_id, data.dataUrl);
      setMessages(prev => [...prev, result.message]);
    } catch (e: any) {
      console.error('Image upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5 flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="relative">
          <Avatar user={{ username: friend.friend_username, friend_pic: friend.friend_pic }} size="sm" />
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineDot isOnline={(friend as any).friend_is_online} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm" style={{ color: friend.friend_color || '#fff' }}>
            {friend.friend_username}
          </span>
          {(friend as any).friend_current_game && (
            <p className="text-xs text-emerald-400 truncate">🎮 {(friend as any).friend_current_game}</p>
          )}
        </div>
        <span className="text-xs text-gray-500">Lv.{friend.friend_level}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet — start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === myUserId;
          return (
            <div key={msg.id} className={`flex gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isMe ? 'bg-violet-600/40 text-violet-200' : 'bg-white/10 text-gray-300'}`}>
                {(msg.sender_username || '?').charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className={`px-3 py-2 rounded-2xl text-sm break-words ${isMe ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-100 rounded-tl-sm'}`}>
                  <MessageContent text={msg.message} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-600">{formatTime(msg.created_at)}</span>
                  {isMe && (
                    <button
                      onClick={async () => {
                        try {
                          await chatApi.deleteDM(msg.id);
                          setMessages(prev => prev.filter(m => m.id !== msg.id));
                        } catch {}
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300 transition-all"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); e.target.value = ''; } }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="p-2.5 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-40"
            title="Upload image"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          </button>
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder={`Message ${friend.friend_username}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            maxLength={500}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendsTab({ myUserId }: { myUserId: number }) {
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [activeDM, setActiveDM] = useState<FriendshipRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewProfileId, setViewProfileId] = useState<number | null>(null);

  const fetch = async () => {
    try {
      const data = await socialApi.getFriends();
      setFriendships(data.friendships);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const accepted = friendships.filter(f => f.status === 'accepted');
  const pendingIncoming = friendships.filter(f => f.status === 'pending' && f.addressee_id === myUserId);
  const pendingSent = friendships.filter(f => f.status === 'pending' && f.requester_id === myUserId);

  const handleRespond = async (id: number, action: 'accept' | 'decline' | 'remove') => {
    try {
      await socialApi.respondToRequest(id, action);
      await fetch();
    } catch {}
  };

  if (activeDM) {
    return (
      <>
        <DMChat friend={activeDM} myUserId={myUserId} onBack={() => setActiveDM(null)} />
        <AnimatePresence>
          {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {pendingIncoming.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Pending Requests ({pendingIncoming.length})
            </h3>
            <div className="space-y-2">
              {pendingIncoming.map(f => (
                <div key={f.friendship_id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <Avatar user={{ username: f.friend_username, friend_pic: f.friend_pic }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: f.friend_color || '#fff' }}>{f.friend_username}</p>
                    <p className="text-xs text-gray-500">Lv.{f.friend_level}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleRespond(f.friendship_id, 'accept')} className="p-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRespond(f.friendship_id, 'decline')} className="p-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingSent.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Sent Requests ({pendingSent.length})
            </h3>
            <div className="space-y-2">
              {pendingSent.map(f => (
                <div key={f.friendship_id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <Avatar user={{ username: f.friend_username, friend_pic: f.friend_pic }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: f.friend_color || '#fff' }}>{f.friend_username}</p>
                    <p className="text-xs text-gray-500">Pending…</p>
                  </div>
                  <button onClick={() => handleRespond(f.friendship_id, 'remove')} className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Friends ({accepted.length})
          </h3>
          {accepted.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No friends yet. Search for people to add!
            </div>
          ) : (
            <div className="space-y-2">
              {accepted.map(f => {
                const isOnline = (f as any).friend_is_online;
                const currentGame = (f as any).friend_current_game;
                return (
                  <div key={f.friendship_id} className="flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-xl p-3 transition-colors group">
                    <div className="relative">
                      <Avatar user={{ username: f.friend_username, friend_pic: f.friend_pic }} />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineDot isOnline={isOnline} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewProfileId(f.friend_id)}
                          className="font-semibold text-sm truncate hover:underline text-left"
                          style={{ color: f.friend_color || '#fff' }}
                        >
                          {f.friend_username}
                        </button>
                      </div>
                      {currentGame ? (
                        <p className="text-xs text-emerald-400 truncate">🎮 {currentGame}</p>
                      ) : (
                        <p className="text-xs text-gray-500">Lv.{f.friend_level} · {isOnline ? 'Online' : 'Offline'}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setActiveDM(f)} className="p-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-400 rounded-lg transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRespond(f.friendship_id, 'remove')} className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}
      </AnimatePresence>
    </>
  );
}

function FindPeopleTab({ myUserId }: { myUserId: number }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [viewProfileId, setViewProfileId] = useState<number | null>(null);

  useEffect(() => {
    socialApi.getFriends().then(d => setFriendships(d.friendships)).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await socialApi.search(query);
        setResults(data.users);
      } catch {} finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const getRelationship = (userId: number) => {
    const f = friendships.find(fr => fr.friend_id === userId);
    if (!f) return null;
    return f;
  };

  const handleAdd = async (userId: number) => {
    try {
      await socialApi.sendRequest(userId);
      setSentIds(prev => new Set([...prev, userId]));
      const data = await socialApi.getFriends();
      setFriendships(data.friendships);
    } catch {}
  };

  return (
    <>
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {searching && (
            <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">No users found for "{query}"</div>
          )}
          {results.map(user => {
            const rel = getRelationship(user.id);
            const alreadySent = sentIds.has(user.id);
            const isAccepted = rel?.status === 'accepted';
            const isPending = rel?.status === 'pending' || alreadySent;
            const isOnline = (user as any).isOnline;
            return (
              <div key={user.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="relative">
                  <Avatar user={user} />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineDot isOnline={isOnline} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setViewProfileId(user.id)}
                    className="font-semibold text-sm truncate hover:underline text-left block"
                    style={{ color: (user as any).name_color || '#fff' }}
                  >
                    {user.username}
                  </button>
                  <p className="text-xs text-gray-500">
                    Lv.{(user as any).level || 1} · {isOnline ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
                {isAccepted ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <UserCheck className="w-4 h-4" />
                    Friends
                  </div>
                ) : isPending ? (
                  <div className="text-xs text-gray-500 font-medium">Pending</div>
                ) : (
                  <button
                    onClick={() => handleAdd(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>
            );
          })}
          {query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Type at least 2 characters to search for players</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewProfileId && <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />}
      </AnimatePresence>
    </>
  );
}

export function SocialPage() {
  const [tab, setTab] = useState<SocialTab>('global');
  const { currentUser, state } = useGameContext();

  if (state.authMode !== 'logged_in' || !currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center">
          <Users className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Social Hub</h2>
        <p className="text-gray-400 max-w-sm">Log in with a registered account to chat, add friends, and message players.</p>
      </motion.div>
    );
  }

  const tabs = [
    { id: 'global' as SocialTab, label: 'Global Chat', icon: Globe },
    { id: 'friends' as SocialTab, label: 'Friends', icon: Users },
    { id: 'find' as SocialTab, label: 'Find People', icon: Search },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      <div className="mb-6">
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">Social Hub</h2>
        <p className="text-gray-400 text-lg">Chat with players and manage your friends.</p>
      </div>

      <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/5 flex flex-col overflow-hidden min-h-0">
        <div className="flex border-b border-white/5 flex-shrink-0">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  active
                    ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {tab === 'global' && (
              <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                <GlobalChat myUserId={currentUser.id} />
              </motion.div>
            )}
            {tab === 'friends' && (
              <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                <FriendsTab myUserId={currentUser.id} />
              </motion.div>
            )}
            {tab === 'find' && (
              <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                <FindPeopleTab myUserId={currentUser.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
