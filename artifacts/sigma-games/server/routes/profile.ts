import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { username, bio, nameColor, profileBanner } = req.body;
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (username !== undefined) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: 'Username must be 3-30 characters' });
      }
      const taken = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, req.userId]);
      if (taken.rowCount! > 0) return res.status(409).json({ error: 'Username already taken' });
      updates.push(`username = $${i++}`); values.push(username);
    }
    if (bio !== undefined) { updates.push(`bio = $${i++}`); values.push(bio); }
    if (nameColor !== undefined) { updates.push(`name_color = $${i++}`); values.push(nameColor); }
    if (profileBanner !== undefined) { updates.push(`profile_banner = $${i++}`); values.push(profileBanner); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    values.push(req.userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, username, email, profile_pic_url, profile_banner, bio, name_color, coins, xp, level, streak, is_admin, is_owner`,
      values
    );
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/picture', requireAuth, upload.single('picture'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded or invalid file type' });
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    fs.unlinkSync(req.file.path);
    if (dataUrl.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Please use a smaller image (under 1.5MB).' });
    }
    const result = await pool.query(
      'UPDATE users SET profile_pic_url = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_pic_url',
      [dataUrl, req.userId]
    );
    return res.json({ profilePicUrl: result.rows[0].profile_pic_url });
  } catch (err) {
    console.error('Picture upload error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.userId]
    );
    return res.json({ preferences: result.rows[0] || {} });
  } catch (err) {
    console.error('Preferences get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  const { language, notificationsEnabled, soundEnabled, musicEnabled, theme, extras } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, language, notifications_enabled, sound_enabled, music_enabled, theme, extras)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         language = COALESCE(EXCLUDED.language, user_preferences.language),
         notifications_enabled = COALESCE(EXCLUDED.notifications_enabled, user_preferences.notifications_enabled),
         sound_enabled = COALESCE(EXCLUDED.sound_enabled, user_preferences.sound_enabled),
         music_enabled = COALESCE(EXCLUDED.music_enabled, user_preferences.music_enabled),
         theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
         extras = COALESCE(EXCLUDED.extras, user_preferences.extras),
         updated_at = NOW()
       RETURNING *`,
      [req.userId, language, notificationsEnabled, soundEnabled, musicEnabled, theme, extras ? JSON.stringify(extras) : null]
    );
    return res.json({ preferences: result.rows[0] });
  } catch (err) {
    console.error('Preferences update error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/game-state', requireAuth, async (req: AuthRequest, res: Response) => {
  const { coins, xp, level, streak, inventory, activeBorder, displayedBadges, displayedItems } = req.body;
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (coins !== undefined) { updates.push(`coins = $${i++}`); values.push(coins); }
    if (xp !== undefined) { updates.push(`xp = $${i++}`); values.push(xp); }
    if (level !== undefined) { updates.push(`level = $${i++}`); values.push(level); }
    if (inventory !== undefined && Array.isArray(inventory)) {
      updates.push(`inventory = $${i++}`);
      values.push(inventory);
    }
    if (activeBorder !== undefined) {
      updates.push(`active_border = $${i++}`);
      values.push(activeBorder);
    }
    if (displayedBadges !== undefined && Array.isArray(displayedBadges)) {
      updates.push(`displayed_badges = $${i++}`);
      values.push(displayedBadges);
    }
    if (displayedItems !== undefined && Array.isArray(displayedItems)) {
      updates.push(`displayed_items = $${i++}`);
      values.push(displayedItems);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    values.push(req.userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
    return res.json({ success: true });
  } catch (err) {
    console.error('Game state sync error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/claim-code', requireAuth, async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Invalid code' });
  const normalizedCode = code.trim().toUpperCase();
  try {
    const userResult = await pool.query('SELECT is_admin, is_owner FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check database-managed redeem codes first
    const codeResult = await pool.query(
      `SELECT rc.* FROM redeem_codes rc
       WHERE UPPER(rc.code) = $1 AND rc.uses < rc.max_uses`,
      [normalizedCode]
    );

    if (codeResult.rowCount && codeResult.rowCount > 0) {
      const rc = codeResult.rows[0];
      const alreadyRedeemed = await pool.query(
        'SELECT id FROM code_redemptions WHERE code_id = $1 AND user_id = $2',
        [rc.id, req.userId]
      );
      if (alreadyRedeemed.rowCount && alreadyRedeemed.rowCount > 0) {
        return res.status(400).json({ error: 'You already redeemed this code' });
      }

      const updates: string[] = [];
      if (rc.coins > 0) updates.push(`coins = coins + ${rc.coins}`);
      if (rc.xp > 0) updates.push(`xp = xp + ${rc.xp}`);
      if (rc.item) {
        updates.push(`inventory = array_append(inventory, '${rc.item}')`);
      }
      const isAdminCode = rc.item === '__grant_admin';
      const isOwnerCode = rc.item === '__grant_owner';
      if (isAdminCode) {
        updates.push('is_admin = true');
      }
      if (isOwnerCode) {
        updates.push('is_owner = true');
        updates.push('is_admin = true');
      }
      if (updates.length > 0) {
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $1`, [req.userId]);
      }

      await pool.query(
        'INSERT INTO code_redemptions (code_id, user_id) VALUES ($1, $2)',
        [rc.id, req.userId]
      );
      await pool.query('UPDATE redeem_codes SET uses = uses + 1 WHERE id = $1', [rc.id]);

      return res.json({
        success: true,
        reward: {
          coins: rc.coins || 0,
          xp: rc.xp || 0,
          item: (rc.item && !rc.item.startsWith('__grant_')) ? rc.item : undefined,
          isAdmin: isAdminCode || isOwnerCode,
          isOwner: isOwnerCode,
        },
        description: rc.description,
      });
    }

    return res.status(400).json({ error: 'Invalid or expired code' });
  } catch (err) {
    console.error('Claim code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/privacy', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT privacy_hide_inventory, privacy_hide_stats, privacy_hide_activity FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/privacy', requireAuth, async (req: AuthRequest, res: Response) => {
  const { hideInventory, hideStats, hideActivity } = req.body;
  try {
    await pool.query(
      `UPDATE users SET
        privacy_hide_inventory = COALESCE($1, privacy_hide_inventory),
        privacy_hide_stats = COALESCE($2, privacy_hide_stats),
        privacy_hide_activity = COALESCE($3, privacy_hide_activity)
       WHERE id = $4`,
      [hideInventory ?? null, hideStats ?? null, hideActivity ?? null, req.userId]
    );
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/heartbeat', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentGame } = req.body;
  try {
    await pool.query(
      `UPDATE users SET last_seen = NOW(), current_game = $1, updated_at = NOW() WHERE id = $2`,
      [currentGame || null, req.userId]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false });
  }
});

export default router;
