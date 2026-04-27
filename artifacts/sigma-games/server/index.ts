import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import progressRoutes from './routes/progress.js';
import socialRoutes from './routes/social.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import aiChatRoutes from './routes/ai-chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = http.createServer();
const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? (parseInt(process.env.PORT || '5000', 10)) : 3001;

async function runMigrations() {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(30) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_pic_url TEXT,
      profile_banner TEXT,
      bio TEXT DEFAULT '',
      name_color VARCHAR(20) DEFAULT '#ffffff',
      coins INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 1,
      is_admin BOOLEAN DEFAULT false,
      is_owner BOOLEAN DEFAULT false,
      last_seen TIMESTAMPTZ,
      current_game TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      language VARCHAR(10) DEFAULT 'en',
      notifications_enabled BOOLEAN DEFAULT true,
      sound_enabled BOOLEAN DEFAULT true,
      music_enabled BOOLEAN DEFAULT true,
      theme VARCHAR(20) DEFAULT 'dark',
      extras JSONB DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(10) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(requester_id, addressee_id)
    )`,
    `CREATE TABLE IF NOT EXISTS global_chat (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS direct_messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS game_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_id VARCHAR(50) NOT NULL,
      progress JSONB DEFAULT '{}',
      playtime_seconds INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, game_id)
    )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS inventory TEXT[] DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS active_border TEXT DEFAULT 'default'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ`,
    `ALTER TABLE global_chat ADD COLUMN IF NOT EXISTS message TEXT`,
    `ALTER TABLE global_chat ADD COLUMN IF NOT EXISTS username VARCHAR(30)`,
    `ALTER TABLE global_chat ADD COLUMN IF NOT EXISTS name_color VARCHAR(20)`,
    `ALTER TABLE global_chat ALTER COLUMN content DROP NOT NULL`,
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS message TEXT`,
    `ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`,
    `ALTER TABLE direct_messages ALTER COLUMN content DROP NOT NULL`,
    `ALTER TABLE direct_messages ALTER COLUMN read DROP NOT NULL`,
    `ALTER TABLE friendships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `DELETE FROM friendships WHERE status = 'declined'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS displayed_badges TEXT[] DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS displayed_items TEXT[] DEFAULT '{}'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_hide_inventory BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_hide_stats BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_hide_activity BOOLEAN DEFAULT false`,
    `UPDATE global_chat SET message = content WHERE message IS NULL AND content IS NOT NULL`,
    `UPDATE direct_messages SET message = content WHERE message IS NULL AND content IS NOT NULL`,
    `UPDATE direct_messages SET is_read = read WHERE is_read IS NULL AND read IS NOT NULL`,
    // Redeem codes system
    `CREATE TABLE IF NOT EXISTS redeem_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      coins INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      item TEXT DEFAULT NULL,
      max_uses INTEGER DEFAULT 1,
      uses INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS code_redemptions (
      id SERIAL PRIMARY KEY,
      code_id INTEGER REFERENCES redeem_codes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      redeemed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(code_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS ranked_seasons (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_id VARCHAR(50) NOT NULL,
      season VARCHAR(20) NOT NULL,
      baseline_sigmas NUMERIC DEFAULT 0,
      season_sigmas NUMERIC DEFAULT 0,
      peak_rank VARCHAR(30) DEFAULT 'Bronze',
      final_position INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, game_id, season)
    )`,
    `ALTER TABLE ranked_seasons ADD COLUMN IF NOT EXISTS baseline_sigmas NUMERIC DEFAULT 0`,
    `ALTER TABLE ranked_seasons ADD COLUMN IF NOT EXISTS season_rebirths INTEGER DEFAULT 0`,
    `ALTER TABLE ranked_seasons ADD COLUMN IF NOT EXISTS baseline_rebirths INTEGER DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS ai_conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT DEFAULT 'New Chat',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS ai_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC)`,
  ];

  const promoteFirstOwner = `
    UPDATE users SET is_admin = true, is_owner = true
    WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
    AND NOT EXISTS (SELECT 1 FROM users WHERE is_owner = true)
  `;
  migrations.push(promoteFirstOwner);


  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      console.error('Migration warning:', err.message);
    }
  }
  console.log('DB migrations complete');
}

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

import { maintenanceMode } from './routes/admin.js';
app.use((req, res, next) => {
  if (maintenanceMode && !req.path.startsWith('/api/admin') && !req.path.startsWith('/api/auth')) {
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({ error: 'Site is under maintenance. Please try again later.' });
    }
  }
  next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const gamesPath = isProd
  ? path.join(__dirname, '..', 'public', 'games')
  : path.join(process.cwd(), 'public', 'games');
app.use('/games', express.static(gamesPath));


app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-chat', aiChatRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const serveStatic = process.env.SERVE_STATIC !== 'false';
if (isProd && serveStatic) {
  const distPath = path.join(__dirname, '..', 'public');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

httpServer.on('request', (req, res) => {
  app(req, res);
});

runMigrations().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}).catch(err => {
  console.error('Failed to run migrations:', err);
  process.exit(1);
});
