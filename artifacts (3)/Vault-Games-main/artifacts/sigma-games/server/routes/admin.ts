import { Router, Response } from 'express';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

async function requireAdmin(req: AuthRequest, res: Response, next: any) {
  try {
    const result = await pool.query('SELECT is_admin, is_owner FROM users WHERE id = $1', [req.userId]);
    const row = result.rows[0];
    if (!row || (!row.is_admin && !row.is_owner)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    (req as any).isOwner = row.is_owner;
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/users', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  try {
    let query = `SELECT id, username, email, level, coins, xp, streak, is_admin, is_owner, is_banned, is_muted, created_at, last_seen, inventory, active_border, name_color, displayed_badges FROM users`;
    const params: any[] = [];
    if (q) {
      query += ` WHERE username ILIKE $1 OR email ILIKE $1`;
      params.push(`%${q}%`);
    }
    query += ` ORDER BY created_at DESC LIMIT 200`;
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ban/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (Number(id) === req.userId) return res.status(400).json({ error: 'Cannot ban yourself' });
  try {
    const target = await pool.query('SELECT is_owner FROM users WHERE id = $1', [id]);
    if (target.rows[0]?.is_owner && !(req as any).isOwner) {
      return res.status(403).json({ error: 'Cannot ban an owner' });
    }
    await pool.query('UPDATE users SET is_banned = true WHERE id = $1', [id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/unban/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET is_banned = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/mute/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (Number(id) === req.userId) return res.status(400).json({ error: 'Cannot mute yourself' });
  try {
    const target = await pool.query('SELECT is_owner FROM users WHERE id = $1', [id]);
    if (target.rows[0]?.is_owner && !(req as any).isOwner) {
      return res.status(403).json({ error: 'Cannot mute an owner' });
    }
    await pool.query('UPDATE users SET is_muted = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/unmute/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET is_muted = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/coins/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Invalid amount' });
  try {
    await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [Number(amount), id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/level/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { level } = req.body;
  if (!level || isNaN(Number(level)) || Number(level) < 1) return res.status(400).json({ error: 'Invalid level' });
  try {
    await pool.query('UPDATE users SET level = $1 WHERE id = $2', [Number(level), id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/role/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  if (Number(id) === req.userId) return res.status(400).json({ error: 'Cannot change your own role' });
  const { role } = req.body;
  if (!['admin', 'owner', 'none'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    await pool.query(
      'UPDATE users SET is_admin = $1, is_owner = $2 WHERE id = $3',
      [role === 'admin' || role === 'owner', role === 'owner', id]
    );
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/xp/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Invalid amount' });
  try {
    await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [Number(amount), id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/inventory/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item } = req.body;
  if (!item || typeof item !== 'string') return res.status(400).json({ error: 'Invalid item' });
  try {
    await pool.query(
      'UPDATE users SET inventory = array_append(inventory, $1) WHERE id = $2 AND NOT ($1 = ANY(inventory))',
      [item, id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/remove-inventory/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item } = req.body;
  if (!item || typeof item !== 'string') return res.status(400).json({ error: 'Invalid item' });
  try {
    await pool.query(
      'UPDATE users SET inventory = array_remove(inventory, $1) WHERE id = $2',
      [item, id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/set-border/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { border } = req.body;
  if (!border || typeof border !== 'string') return res.status(400).json({ error: 'Invalid border' });
  try {
    await pool.query('UPDATE users SET active_border = $1 WHERE id = $2', [border, id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/streak/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { streak } = req.body;
  if (streak === undefined || isNaN(Number(streak)) || Number(streak) < 0) return res.status(400).json({ error: 'Invalid streak' });
  try {
    await pool.query('UPDATE users SET streak = $1 WHERE id = $2', [Number(streak), id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/name-color/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { color } = req.body;
  if (!color || typeof color !== 'string') return res.status(400).json({ error: 'Invalid color' });
  try {
    await pool.query('UPDATE users SET name_color = $1 WHERE id = $2', [color, id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/displayed-badges/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  const { badges } = req.body;
  if (!Array.isArray(badges)) return res.status(400).json({ error: 'Invalid badges array' });
  try {
    await pool.query('UPDATE users SET displayed_badges = $1 WHERE id = $2', [badges, id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/messages/global', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.message as content, g.username, g.created_at, g.user_id, u.is_admin, u.is_owner
       FROM global_chat g
       LEFT JOIN users u ON u.id = g.user_id
       ORDER BY g.created_at DESC LIMIT 100`
    );
    res.json({ messages: result.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/message/global/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM global_chat WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Redeem code management
router.get('/codes', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT rc.*, u.username as creator_username
       FROM redeem_codes rc
       LEFT JOIN users u ON u.id = rc.created_by
       ORDER BY rc.created_at DESC`
    );
    res.json({ codes: result.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/codes', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { code, description, coins, xp, item, maxUses } = req.body;
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'Code is required' });
  }
  if ((item === '__grant_admin' || item === '__grant_owner') && !(req as any).isOwner) {
    return res.status(403).json({ error: 'Only owners can create role-granting codes' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO redeem_codes (code, description, coins, xp, item, max_uses, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        code.trim().toUpperCase(),
        description || '',
        Number(coins) || 0,
        Number(xp) || 0,
        item || null,
        Number(maxUses) || 1,
        req.userId,
      ]
    );
    res.json({ code: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/codes/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM redeem_codes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all-conversations', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  try {
    const result = await pool.query(
      `SELECT
         LEAST(dm.sender_id, dm.receiver_id) as user1_id,
         GREATEST(dm.sender_id, dm.receiver_id) as user2_id,
         u1.username as user1_name,
         u2.username as user2_name,
         COUNT(*) as message_count,
         MAX(dm.created_at) as last_message_at
       FROM direct_messages dm
       JOIN users u1 ON u1.id = LEAST(dm.sender_id, dm.receiver_id)
       JOIN users u2 ON u2.id = GREATEST(dm.sender_id, dm.receiver_id)
       GROUP BY LEAST(dm.sender_id, dm.receiver_id), GREATEST(dm.sender_id, dm.receiver_id), u1.username, u2.username
       ORDER BY MAX(dm.created_at) DESC
       LIMIT 100`
    );
    res.json({ conversations: result.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversation/:user1/:user2', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { user1, user2 } = req.params;
  try {
    const result = await pool.query(
      `SELECT dm.*, u.username as sender_username, u.name_color as sender_color
       FROM direct_messages dm
       JOIN users u ON u.id = dm.sender_id
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
          OR (dm.sender_id = $2 AND dm.receiver_id = $1)
       ORDER BY dm.created_at ASC
       LIMIT 200`,
      [user1, user2]
    );
    res.json({ messages: result.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/game-progress/:userId/:gameId', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { userId, gameId } = req.params;
  try {
    const result = await pool.query(
      'SELECT progress, playtime_seconds, updated_at FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );
    if (result.rowCount === 0) return res.json({ progress: null });
    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/game-progress/:userId/:gameId', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { userId, gameId } = req.params;
  const { updates } = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) return res.status(400).json({ error: 'Invalid updates' });
  const ALLOWED_KEYS = new Set([
    'sigmas', 'lifetimeSigmas', 'rebirths', 'totalClicks', 'sigmasSinceRebirth',
    'ownedClick', 'ownedIdle', 'prestigeUpgrades', 'synergyLevels',
    'unlockedCosmetics', 'equippedTitle', 'equippedBorder', 'equippedBadges',
    'rawClicks', 'focusGameWins', 'totalPuzzlesSolved', 'brainFogTriggers',
    'orbsCollected', 'lifetimeHoursPlayed', 'puzzleMultipliers', 'globalMultLevel',
    'auraMultiplier',
  ]);
  for (const key of Object.keys(updates)) {
    if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: `Invalid key: ${key}` });
  }
  for (const numKey of ['sigmas', 'lifetimeSigmas', 'rebirths', 'totalClicks', 'sigmasSinceRebirth', 'rawClicks', 'focusGameWins', 'totalPuzzlesSolved', 'brainFogTriggers', 'orbsCollected', 'lifetimeHoursPlayed', 'globalMultLevel', 'auraMultiplier']) {
    if (numKey in updates && (typeof updates[numKey] !== 'number' || !Number.isFinite(updates[numKey]) || updates[numKey] < 0)) {
      return res.status(400).json({ error: `${numKey} must be a non-negative number` });
    }
  }
  try {
    const existing = await pool.query(
      'SELECT progress FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );
    let merged;
    if (existing.rowCount === 0) {
      merged = { ...updates };
      await pool.query(
        'INSERT INTO game_progress (user_id, game_id, progress, playtime_seconds) VALUES ($1, $2, $3, 0)',
        [userId, gameId, JSON.stringify(merged)]
      );
    } else {
      const currentProgress = existing.rows[0].progress || {};
      merged = { ...currentProgress, ...updates };
      await pool.query(
        'UPDATE game_progress SET progress = $1, updated_at = NOW() WHERE user_id = $2 AND game_id = $3',
        [JSON.stringify(merged), userId, gameId]
      );
    }
    return res.json({ success: true, progress: merged });
  } catch (err) {
    console.error('Admin game progress update error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/badge/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { badge } = req.body;
  if (!badge || typeof badge !== 'string') return res.status(400).json({ error: 'Invalid badge' });
  if (badge === 'badge-sigma-creator' && !(req as any).isOwner) {
    return res.status(403).json({ error: 'Only owners can grant the Sigma Creator badge' });
  }
  try {
    const userCheck = await pool.query('SELECT id, COALESCE(displayed_badges, \'{}\') as displayed_badges, COALESCE(inventory, \'{}\') as inventory FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userCheck.rows[0];
    if (user.displayed_badges.includes(badge) || user.inventory.includes(badge)) {
      return res.status(409).json({ error: 'User already has this badge' });
    }
    await pool.query(
      `UPDATE users SET displayed_badges = array_append(COALESCE(displayed_badges, '{}'), $1), inventory = array_append(COALESCE(inventory, '{}'), $1) WHERE id = $2`,
      [badge, id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/revoke-badge/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { badge } = req.body;
  if (!badge || typeof badge !== 'string') return res.status(400).json({ error: 'Invalid badge' });
  try {
    await pool.query(
      'UPDATE users SET displayed_badges = array_remove(displayed_badges, $1), inventory = array_remove(inventory, $1) WHERE id = $2',
      [badge, id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/badge-holders', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { badge } = req.query;
  if (!badge || typeof badge !== 'string') return res.status(400).json({ error: 'Badge ID required' });
  try {
    const result = await pool.query(
      `SELECT id, username, email, level, coins, xp, streak, is_admin, is_owner, is_banned, is_muted, created_at, last_seen, inventory, active_border, name_color, displayed_badges
       FROM users WHERE $1 = ANY(COALESCE(displayed_badges, '{}')) OR $1 = ANY(COALESCE(inventory, '{}'))
       ORDER BY username ASC LIMIT 100`,
      [badge]
    );
    res.json({ users: result.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-ranked/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId required' });
  try {
    const progress = await pool.query(
      `SELECT COALESCE((gp.progress->>'lifetimeSigmas')::numeric, 0) as total,
              COALESCE((gp.progress->>'rebirths')::integer, 0) as total_rebirths
       FROM game_progress gp WHERE gp.user_id = $1 AND gp.game_id = $2`,
      [id, gameId]
    );
    const currentSigmas = Number(progress.rows[0]?.total || 0);
    const currentRebirths = Number(progress.rows[0]?.total_rebirths || 0);
    const season = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await pool.query('DELETE FROM ranked_seasons WHERE user_id = $1 AND game_id = $2 AND season = $3', [id, gameId, season]);
    await pool.query(
      `INSERT INTO ranked_seasons (user_id, game_id, season, baseline_sigmas, baseline_rebirths, season_sigmas, season_rebirths, peak_rank)
       VALUES ($1, $2, $3, $4, $5, 0, 0, 'Bronze')`,
      [id, gameId, season, currentSigmas, currentRebirths]
    );
    res.json({ success: true, baseline: { sigmas: currentSigmas, rebirths: currentRebirths } });
  } catch (err) {
    console.error('Reset ranked error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/ranked-info/:userId/:gameId', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { userId, gameId } = req.params;
  const season = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  try {
    const result = await pool.query(
      'SELECT * FROM ranked_seasons WHERE user_id = $1 AND game_id = $2 AND season = $3',
      [userId, gameId, season]
    );
    res.json({ ranked: result.rows[0] || null });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/set-user-field/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  const { field, value } = req.body;
  const ALLOWED_FIELDS: Record<string, string> = {
    username: 'VARCHAR', email: 'VARCHAR', bio: 'TEXT', coins: 'INTEGER', xp: 'INTEGER',
    level: 'INTEGER', streak: 'INTEGER', name_color: 'VARCHAR', profile_pic_url: 'TEXT',
    profile_banner: 'TEXT', active_border: 'VARCHAR',
  };
  if (!field || !(field in ALLOWED_FIELDS)) return res.status(400).json({ error: `Invalid field: ${field}` });
  try {
    await pool.query(`UPDATE users SET ${field} = $1 WHERE id = $2`, [value, id]);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Value already exists (unique constraint)' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/delete-user/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  if (Number(id) === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/traffic', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  try {
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const online = await pool.query(
      `SELECT id, username, level, last_seen, name_color, profile_pic_url FROM users WHERE last_seen > $1 ORDER BY last_seen DESC`,
      [onlineThreshold]
    );
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayActive = await pool.query('SELECT COUNT(*) as count FROM users WHERE last_seen > $1', [todayStart]);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekActive = await pool.query('SELECT COUNT(*) as count FROM users WHERE last_seen > $1', [weekStart]);
    const newToday = await pool.query('SELECT COUNT(*) as count FROM users WHERE created_at > $1', [todayStart]);
    const newWeek = await pool.query('SELECT COUNT(*) as count FROM users WHERE created_at > $1', [weekStart]);
    res.json({
      onlineUsers: online.rows,
      onlineCount: online.rows.length,
      totalUsers: parseInt(totalUsers.rows[0].count),
      todayActive: parseInt(todayActive.rows[0].count),
      weekActive: parseInt(weekActive.rows[0].count),
      newToday: parseInt(newToday.rows[0].count),
      newWeek: parseInt(newWeek.rows[0].count),
    });
  } catch (err) {
    console.error('Traffic error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/broadcast', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message required' });
  }
  try {
    await pool.query(
      `INSERT INTO global_chat (user_id, username, name_color, message, content, created_at) VALUES (0, 'SYSTEM', '#ff4444', $1, $1, NOW())`,
      [message.trim()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/sql', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { query: sql } = req.body;
  if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'Query required' });
  try {
    const start = Date.now();
    const result = await pool.query(sql);
    const duration = Date.now() - start;
    res.json({
      rows: result.rows?.slice(0, 200) || [],
      rowCount: result.rowCount,
      command: result.command,
      duration,
      truncated: (result.rows?.length || 0) > 200,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/server-stats', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  try {
    const [
      totalCoins, totalXP, avgLevel, maxLevel,
      totalMessages, totalDMs, totalProgress,
      totalSessions, bannedCount, mutedCount, adminCount,
      dbSize, tableStats
    ] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(coins), 0) as total FROM users'),
      pool.query('SELECT COALESCE(SUM(xp), 0) as total FROM users'),
      pool.query('SELECT COALESCE(AVG(level), 0) as avg, COALESCE(MAX(level), 0) as max FROM users'),
      pool.query('SELECT COALESCE(MAX(level), 0) as max FROM users'),
      pool.query('SELECT COUNT(*) as count FROM global_chat'),
      pool.query('SELECT COUNT(*) as count FROM direct_messages'),
      pool.query('SELECT COUNT(*) as count FROM game_progress'),
      pool.query('SELECT COUNT(*) as count FROM sessions'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_banned = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_muted = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true OR is_owner = true'),
      pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
      pool.query(`SELECT relname as table_name, n_live_tup as row_count FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20`),
    ]);
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    res.json({
      economy: {
        totalCoins: parseInt(totalCoins.rows[0].total),
        totalXP: parseInt(totalXP.rows[0].total),
        avgLevel: parseFloat(parseFloat(avgLevel.rows[0].avg).toFixed(1)),
        maxLevel: parseInt(avgLevel.rows[0].max),
      },
      counts: {
        globalMessages: parseInt(totalMessages.rows[0].count),
        directMessages: parseInt(totalDMs.rows[0].count),
        gameProgressEntries: parseInt(totalProgress.rows[0].count),
        activeSessions: parseInt(totalSessions.rows[0].count),
        bannedUsers: parseInt(bannedCount.rows[0].count),
        mutedUsers: parseInt(mutedCount.rows[0].count),
        staffCount: parseInt(adminCount.rows[0].count),
      },
      server: {
        uptime: Math.floor(uptime),
        memoryMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        size: dbSize.rows[0].size,
        tables: tableStats.rows,
      },
    });
  } catch (err) {
    console.error('Server stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/force-logout/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    res.json({ success: true, sessionsCleared: result.rowCount });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/mass-action', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  const { action, userIds, value } = req.body;
  if (!action || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'action and userIds required' });
  }
  if (userIds.length > 100) return res.status(400).json({ error: 'Max 100 users per batch' });
  try {
    let affected = 0;
    const placeholders = userIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    switch (action) {
      case 'ban':
        const banResult = await pool.query(`UPDATE users SET is_banned = true WHERE id IN (${placeholders}) AND is_owner = false`, userIds);
        affected = banResult.rowCount || 0;
        break;
      case 'unban':
        const unbanResult = await pool.query(`UPDATE users SET is_banned = false WHERE id IN (${placeholders})`, userIds);
        affected = unbanResult.rowCount || 0;
        break;
      case 'mute':
        const muteResult = await pool.query(`UPDATE users SET is_muted = true WHERE id IN (${placeholders}) AND is_owner = false`, userIds);
        affected = muteResult.rowCount || 0;
        break;
      case 'unmute':
        const unmuteResult = await pool.query(`UPDATE users SET is_muted = false WHERE id IN (${placeholders})`, userIds);
        affected = unmuteResult.rowCount || 0;
        break;
      case 'addCoins':
        const coinResult = await pool.query(`UPDATE users SET coins = coins + $${userIds.length + 1} WHERE id IN (${placeholders})`, [...userIds, value || 0]);
        affected = coinResult.rowCount || 0;
        break;
      case 'addXP':
        const xpResult = await pool.query(`UPDATE users SET xp = xp + $${userIds.length + 1} WHERE id IN (${placeholders})`, [...userIds, value || 0]);
        affected = xpResult.rowCount || 0;
        break;
      case 'setLevel':
        const lvlResult = await pool.query(`UPDATE users SET level = $${userIds.length + 1} WHERE id IN (${placeholders})`, [...userIds, value || 1]);
        affected = lvlResult.rowCount || 0;
        break;
      case 'wipeProgress':
        const wipeResult = await pool.query(`DELETE FROM game_progress WHERE user_id IN (${placeholders})`, userIds);
        affected = wipeResult.rowCount || 0;
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
    res.json({ success: true, affected });
  } catch (err: any) {
    console.error('Mass action error:', err);
    res.status(500).json({ error: err.message });
  }
});

let maintenanceMode = false;
router.get('/maintenance', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  res.json({ maintenance: maintenanceMode });
});
router.post('/maintenance', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  maintenanceMode = !!req.body.enabled;
  res.json({ success: true, maintenance: maintenanceMode });
});

router.post('/clear-chat', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (!(req as any).isOwner) return res.status(403).json({ error: 'Owner only' });
  try {
    const result = await pool.query('DELETE FROM global_chat');
    res.json({ success: true, deleted: result.rowCount });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export { maintenanceMode };
export default router;
