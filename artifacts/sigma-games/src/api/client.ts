const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('vault_token');
}

export function setToken(token: string) {
  localStorage.setItem('vault_token', token);
}

export function removeToken() {
  localStorage.removeItem('vault_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, form, true),
};

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_pic_url: string | null;
  profile_banner: string | null;
  bio: string;
  name_color: string;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  is_admin: boolean;
  is_owner: boolean;
  is_banned?: boolean;
  is_muted?: boolean;
  created_at: string;
  last_seen?: string;
  language?: string;
  notifications_enabled?: boolean;
  sound_enabled?: boolean;
  music_enabled?: boolean;
  theme?: string;
  extras?: Record<string, unknown>;
  inventory?: string[];
  active_border?: string;
  displayed_badges?: string[];
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),

  login: (emailOrUsername: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { emailOrUsername, password }),

  logout: () => api.post<{ success: boolean }>('/auth/logout'),

  me: () => api.get<{ user: UserProfile }>('/auth/me'),

  resetPassword: (email: string, username: string, newPassword: string) =>
    api.post<{ success: boolean }>('/auth/reset-password', { email, username, newPassword }),
};

export const profileApi = {
  update: (data: { username?: string; bio?: string; nameColor?: string; profileBanner?: string }) =>
    api.put<{ user: UserProfile }>('/profile', data),

  uploadPicture: (file: File) => {
    const form = new FormData();
    form.append('picture', file);
    return api.postForm<{ profilePicUrl: string }>('/profile/picture', form);
  },

  getPreferences: () => api.get<{ preferences: Record<string, unknown> }>('/profile/preferences'),

  updatePreferences: (prefs: Record<string, unknown>) =>
    api.put<{ preferences: Record<string, unknown> }>('/profile/preferences', prefs),

  claimCode: (code: string) =>
    api.post<{ success: boolean; role?: string; coinsAdded?: number; levelSet?: number }>('/profile/claim-code', { code }),
  syncGameState: (data: { coins?: number; xp?: number; level?: number; streak?: number; inventory?: string[]; activeBorder?: string }) =>
    api.put<{ success: boolean }>('/profile/game-state', data),

  heartbeat: (currentGame?: string | null) =>
    api.put<{ success: boolean }>('/profile/heartbeat', { currentGame: currentGame || null }),
  getPrivacy: () => api.get<{ privacy_hide_inventory: boolean; privacy_hide_stats: boolean; privacy_hide_activity: boolean }>('/profile/privacy'),
  updatePrivacy: (data: { hideInventory?: boolean; hideStats?: boolean; hideActivity?: boolean }) =>
    api.put<{ success: boolean }>('/profile/privacy', data),
};

export const socialApi = {
  search: (q: string) => api.get<{ users: UserProfile[] }>(`/social/search?q=${encodeURIComponent(q)}`),
  getFriends: () => api.get<{ friendships: FriendshipRow[] }>('/social/friends'),
  sendRequest: (addresseeId: number) => api.post<{ friendship: FriendshipRow }>('/social/request', { addresseeId }),
  respondToRequest: (id: number, action: 'accept' | 'decline' | 'remove') =>
    api.put<{ friendship?: FriendshipRow; success?: boolean }>(`/social/request/${id}`, { action }),
  getProfile: (userId: number) => api.get<{ user: any }>(`/social/profile/${userId}`),
};

export const chatApi = {
  getGlobal: () => api.get<{ messages: ChatMessage[] }>('/chat/global'),
  sendGlobal: (message: string) => api.post<{ message: ChatMessage }>('/chat/global', { message }),
  getDM: (friendId: number) => api.get<{ messages: ChatMessage[] }>(`/chat/dm/${friendId}`),
  sendDM: (friendId: number, message: string) => api.post<{ message: ChatMessage }>(`/chat/dm/${friendId}`, { message }),
  getUnread: () => api.get<{ unread: { sender_id: number; count: number }[] }>('/chat/unread'),
  deleteDM: (messageId: number) => api.delete<{ success: boolean }>(`/chat/dm/${messageId}`),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.postForm<{ dataUrl: string }>('/chat/image', form);
  },
};

export interface ChatMessage {
  id: number;
  user_id?: number;
  sender_id?: number;
  receiver_id?: number;
  username?: string;
  sender_username?: string;
  name_color?: string;
  sender_color?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  is_admin?: boolean;
  is_owner?: boolean;
}

export interface FriendshipRow {
  friendship_id: number;
  status: 'pending' | 'accepted' | 'declined';
  requester_id: number;
  addressee_id: number;
  friend_id: number;
  friend_username: string;
  friend_pic: string | null;
  friend_color: string;
  friend_level: number;
}

export interface RedeemCode {
  id: number;
  code: string;
  description: string;
  coins: number;
  xp: number;
  item: string | null;
  max_uses: number;
  uses: number;
  creator_username?: string;
  created_at: string;
}

export const adminApi = {
  getUsers: (q?: string) =>
    api.get<{ users: UserProfile[] }>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  banUser: (id: number) => api.post<{ success: boolean }>(`/admin/ban/${id}`),
  unbanUser: (id: number) => api.post<{ success: boolean }>(`/admin/unban/${id}`),
  muteUser: (id: number) => api.post<{ success: boolean }>(`/admin/mute/${id}`),
  unmuteUser: (id: number) => api.post<{ success: boolean }>(`/admin/unmute/${id}`),
  addCoins: (id: number, amount: number) => api.post<{ success: boolean }>(`/admin/coins/${id}`, { amount }),
  setLevel: (id: number, level: number) => api.post<{ success: boolean }>(`/admin/level/${id}`, { level }),
  setRole: (id: number, role: 'admin' | 'owner' | 'none') => api.post<{ success: boolean }>(`/admin/role/${id}`, { role }),
  addXp: (id: number, amount: number) => api.post<{ success: boolean }>(`/admin/xp/${id}`, { amount }),
  addInventoryItem: (id: number, item: string) => api.post<{ success: boolean }>(`/admin/inventory/${id}`, { item }),
  removeInventoryItem: (id: number, item: string) => api.post<{ success: boolean }>(`/admin/remove-inventory/${id}`, { item }),
  setBorder: (id: number, border: string) => api.post<{ success: boolean }>(`/admin/set-border/${id}`, { border }),
  setStreak: (id: number, streak: number) => api.post<{ success: boolean }>(`/admin/streak/${id}`, { streak }),
  setNameColor: (id: number, color: string) => api.post<{ success: boolean }>(`/admin/name-color/${id}`, { color }),
  setDisplayedBadges: (id: number, badges: string[]) => api.post<{ success: boolean }>(`/admin/displayed-badges/${id}`, { badges }),
  getGlobalMessages: () => api.get<{ messages: any[] }>('/admin/messages/global'),
  deleteGlobalMessage: (id: number) => api.delete<{ success: boolean }>(`/admin/message/global/${id}`),
  getCodes: () => api.get<{ codes: RedeemCode[] }>('/admin/codes'),
  createCode: (data: { code: string; description?: string; coins?: number; xp?: number; item?: string; maxUses?: number }) =>
    api.post<{ code: RedeemCode }>('/admin/codes', data),
  deleteCode: (id: number) => api.delete<{ success: boolean }>(`/admin/codes/${id}`),
  grantBadge: (id: number, badge: string) => api.post<{ success: boolean }>(`/admin/badge/${id}`, { badge }),
  revokeBadge: (id: number, badge: string) => api.post<{ success: boolean }>(`/admin/revoke-badge/${id}`, { badge }),
  getBadgeHolders: (badge: string) => api.get<{ users: UserProfile[] }>(`/admin/badge-holders?badge=${encodeURIComponent(badge)}`),
  getAllConversations: () => api.get<{ conversations: any[] }>('/admin/all-conversations'),
  getConversation: (user1: number, user2: number) => api.get<{ messages: any[] }>(`/admin/conversation/${user1}/${user2}`),
  getGameProgress: (userId: number, gameId: string) => api.get<{ progress: any; playtime_seconds?: number }>(`/admin/game-progress/${userId}/${gameId}`),
  updateGameProgress: (userId: number, gameId: string, updates: Record<string, any>) =>
    api.put<{ success: boolean; progress: any }>(`/admin/game-progress/${userId}/${gameId}`, { updates }),
  resetRanked: (id: number, gameId: string) => api.post<{ success: boolean }>(`/admin/reset-ranked/${id}`, { gameId }),
  getRankedInfo: (userId: number, gameId: string) => api.get<{ ranked: any }>(`/admin/ranked-info/${userId}/${gameId}`),
  setUserField: (id: number, field: string, value: any) => api.post<{ success: boolean }>(`/admin/set-user-field/${id}`, { field, value }),
  deleteUser: (id: number) => api.delete<{ success: boolean }>(`/admin/delete-user/${id}`),
  getTraffic: () => api.get<any>('/admin/traffic'),
  broadcast: (message: string) => api.post<{ success: boolean }>('/admin/broadcast', { message }),
  runSQL: (query: string) => api.post<{ rows: any[]; rowCount: number; command: string; duration: number; truncated: boolean }>('/admin/sql', { query }),
  getServerStats: () => api.get<any>('/admin/server-stats'),
  forceLogout: (id: number) => api.post<{ success: boolean; sessionsCleared: number }>(`/admin/force-logout/${id}`),
  massAction: (action: string, userIds: number[], value?: any) => api.post<{ success: boolean; affected: number }>('/admin/mass-action', { action, userIds, value }),
  getMaintenance: () => api.get<{ maintenance: boolean }>('/admin/maintenance'),
  setMaintenance: (enabled: boolean) => api.post<{ success: boolean; maintenance: boolean }>('/admin/maintenance', { enabled }),
  clearAllChat: () => api.post<{ success: boolean; deleted: number }>('/admin/clear-chat', {}),
};

export interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const aiChatApi = {
  getConversations: () => api.get<AIConversation[]>('/ai-chat/conversations'),
  createConversation: (title?: string) => api.post<AIConversation>('/ai-chat/conversations', { title }),
  deleteConversation: (id: number) => api.delete<{ success: boolean }>(`/ai-chat/conversations/${id}`),
  renameConversation: (id: number, title: string) => request<{ success: boolean }>('PATCH', `/ai-chat/conversations/${id}`, { title }),
  getMessages: (conversationId: number) => api.get<AIMessage[]>(`/ai-chat/conversations/${conversationId}/messages`),
  sendImage: (conversationId: number, prompt: string) =>
    api.post<{ success: boolean; imageUrl: string }>(`/ai-chat/conversations/${conversationId}/image`, { prompt }),
  getDailyChallenge: () => api.get<{ challenge: { type: string; gameId: string; title: string; description: string; icon: string; date: string } }>('/ai-chat/daily-challenge'),
  sendMessageStream: async function* (conversationId: number, message: string, imageBase64?: string, imageMimeType?: string) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/ai-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, imageBase64, imageMimeType }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) return;
            if (data.content) yield data.content;
          } catch {}
        }
      }
    }
  },
  chessHintStream: async function* (fen: string, moveHistory: string[]) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/ai-chat/chess-hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fen, moveHistory }),
    });
    if (!res.ok) throw new Error('Failed to get hint');
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) return;
            if (data.content) yield data.content;
          } catch {}
        }
      }
    }
  },
  recommendationsStream: async function* () {
    const token = getToken();
    const res = await fetch(`${API_BASE}/ai-chat/recommendations`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error('Failed to get recommendations');
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) return;
            if (data.content) yield data.content;
          } catch {}
        }
      }
    }
  },
};

export const progressApi = {
  getFriendsLeaderboard: (gameId: string) =>
    api.get<any[]>(`/progress/friends-leaderboard/${gameId}`),
  get: (gameId: string) =>
    api.get<{ progress: Record<string, unknown> | null; playtime_seconds?: number }>(`/progress/${gameId}`),

  save: (gameId: string, progress: Record<string, unknown>, playtimeSeconds?: number) =>
    api.put(`/progress/${gameId}`, { progress, playtimeSeconds }),

  getAll: () =>
    api.get<{ games: Array<{ game_id: string; progress: Record<string, unknown>; playtime_seconds: number; updated_at: string }> }>('/progress'),
};
