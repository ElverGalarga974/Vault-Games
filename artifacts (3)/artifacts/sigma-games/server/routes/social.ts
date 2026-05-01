import { Router, Response } from 'express';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

router.get('/profile/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, username, profile_pic_url, profile_banner, bio, name_color, level, xp, coins, streak, is_admin, is_owner,
              last_seen, current_game, created_at, displayed_badges, displayed_items, inventory, active_border,
              privacy_hide_inventory, privacy_hide_stats, privacy_hide_activity
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    const isOnline = lastSeen ? (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000 : false;
    const isSelf = Number(id) === req.userId;
    const viewerIsAdmin = await (async () => {
      const r = await pool.query('SELECT is_admin, is_owner FROM users WHERE id = $1', [req.userId]);
      return r.rows[0]?.is_admin || r.rows[0]?.is_owner;
    })();
    const friendCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM friendships
       WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
      [id]
    );
    const friendCount = parseInt(friendCountResult.rows[0].count, 10);

    let mutualCount = 0;
    if (!isSelf) {
      const mutualResult = await pool.query(
        `SELECT COUNT(*) as count FROM (
          SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END as fid
          FROM friendships WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'
        ) a
        JOIN (
          SELECT CASE WHEN requester_id = $2 THEN addressee_id ELSE requester_id END as fid
          FROM friendships WHERE (requester_id = $2 OR addressee_id = $2) AND status = 'accepted'
        ) b ON a.fid = b.fid`,
        [id, req.userId]
      );
      mutualCount = parseInt(mutualResult.rows[0].count, 10);
    }

    const resp: any = { ...user, isOnline, friendCount, mutualCount };
    if (!isSelf && !viewerIsAdmin) {
      if (user.privacy_hide_inventory) {
        resp.inventory = [];
        resp.displayed_items = [];
      }
      if (user.privacy_hide_stats) {
        resp.coins = 0;
        resp.xp = 0;
        resp.streak = 0;
      }
      if (user.privacy_hide_activity) {
        resp.current_game = null;
        resp.last_seen = null;
        resp.isOnline = false;
      }
    }
    delete resp.privacy_hide_inventory;
    delete resp.privacy_hide_stats;
    delete resp.privacy_hide_activity;
    return res.json({ user: resp });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', requireAuth, async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) return res.json({ users: [] });
  try {
    const result = await pool.query(
      `SELECT id, username, profile_pic_url, name_color, level, last_seen, current_game
       FROM users
       WHERE username ILIKE $1 AND id != $2
       LIMIT 20`,
      [`%${q}%`, req.userId]
    );
    const users = result.rows.map(u => {
      const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
      const isOnline = lastSeen ? (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000 : false;
      return { ...u, isOnline };
    });
    return res.json({ users });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/friends', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         f.id as friendship_id,
         f.status,
         f.requester_id,
         f.addressee_id,
         CASE WHEN f.requester_id = $1 THEN u2.id ELSE u1.id END as friend_id,
         CASE WHEN f.requester_id = $1 THEN u2.username ELSE u1.username END as friend_username,
         CASE WHEN f.requester_id = $1 THEN u2.profile_pic_url ELSE u1.profile_pic_url END as friend_pic,
         CASE WHEN f.requester_id = $1 THEN u2.name_color ELSE u1.name_color END as friend_color,
         CASE WHEN f.requester_id = $1 THEN u2.level ELSE u1.level END as friend_level,
         CASE WHEN f.requester_id = $1 THEN u2.last_seen ELSE u1.last_seen END as friend_last_seen,
         CASE WHEN f.requester_id = $1 THEN u2.current_game ELSE u1.current_game END as friend_current_game
       FROM friendships f
       JOIN users u1 ON u1.id = f.requester_id
       JOIN users u2 ON u2.id = f.addressee_id
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
       ORDER BY f.updated_at DESC`,
      [req.userId]
    );
    const friendships = result.rows.map(f => {
      const lastSeen = f.friend_last_seen ? new Date(f.friend_last_seen) : null;
      const isOnline = lastSeen ? (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000 : false;
      return { ...f, friend_is_online: isOnline };
    });
    return res.json({ friendships });
  } catch (err) {
    console.error('Friends list error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/request', requireAuth, async (req: AuthRequest, res: Response) => {
  const addresseeId = parseInt(req.body.addresseeId, 10);
  if (isNaN(addresseeId) || addresseeId === req.userId) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [addresseeId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const existing = await pool.query(
      `SELECT id, status FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
      [req.userId, addresseeId]
    );
    if (existing.rowCount! > 0) {
      return res.status(409).json({ error: 'Friend request already exists', status: existing.rows[0].status });
    }
    const result = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [req.userId, addresseeId]
    );
    return res.status(201).json({ friendship: result.rows[0] });
  } catch (err) {
    console.error('Friend request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/request/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;
  if (!['accept', 'decline', 'remove'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  try {
    if (action === 'remove' || action === 'decline') {
      await pool.query(
        `DELETE FROM friendships
         WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
        [id, req.userId]
      );
      return res.json({ success: true });
    }
    const result = await pool.query(
      `UPDATE friendships SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 AND addressee_id = $2
       RETURNING *`,
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    return res.json({ friendship: result.rows[0] });
  } catch (err) {
    console.error('Friend action error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
