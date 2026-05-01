import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype));
  },
});

router.post('/image', requireAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No image or invalid file type' });
  try {
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    if (dataUrl.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max ~2MB)' });
    }
    return res.json({ dataUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/global', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT gc.id, gc.user_id, gc.username, gc.name_color, gc.message, gc.created_at,
              u.is_admin, u.is_owner
       FROM global_chat gc
       LEFT JOIN users u ON u.id = gc.user_id
       ORDER BY gc.created_at DESC
       LIMIT 100`
    );
    return res.json({ messages: result.rows.reverse() });
  } catch (err) {
    console.error('Global chat get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/global', requireAuth, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const isImage = message.startsWith('data:image/');
  if (!isImage && message.trim().length > 300) {
    return res.status(400).json({ error: 'Message too long (max 300 chars)' });
  }
  if (isImage && message.length > 3 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large' });
  }
  try {
    const userResult = await pool.query(
      'SELECT username, name_color, is_muted, is_banned FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const { username, name_color, is_muted, is_banned } = userResult.rows[0];
    if (is_banned) return res.status(403).json({ error: 'Your account has been banned.' });
    if (is_muted) return res.status(403).json({ error: 'You are muted and cannot send messages.' });
    const result = await pool.query(
      `INSERT INTO global_chat (user_id, username, name_color, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, username, name_color, message.trim()]
    );
    const oldMessages = await pool.query(
      `DELETE FROM global_chat WHERE id NOT IN (
        SELECT id FROM global_chat ORDER BY created_at DESC LIMIT 200
      )`
    );
    return res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('Global chat post error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dm/:friendId', requireAuth, async (req: AuthRequest, res: Response) => {
  const friendId = parseInt(req.params.friendId as string, 10);
  if (isNaN(friendId)) return res.status(400).json({ error: 'Invalid friend ID' });
  try {
    const friendCheck = await pool.query(
      `SELECT id FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
      [req.userId, friendId]
    );
    if (friendCheck.rowCount === 0) {
      return res.status(403).json({ error: 'You must be friends to view messages' });
    }
    await pool.query(
      `UPDATE direct_messages SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2`,
      [friendId, req.userId]
    );
    const result = await pool.query(
      `SELECT dm.*, u.username as sender_username, u.name_color as sender_color
       FROM direct_messages dm
       JOIN users u ON u.id = dm.sender_id
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
          OR (dm.sender_id = $2 AND dm.receiver_id = $1)
       ORDER BY dm.created_at ASC
       LIMIT 100`,
      [req.userId, friendId]
    );
    return res.json({ messages: result.rows });
  } catch (err) {
    console.error('DM get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/dm/:friendId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { friendId } = req.params;
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const isImage = message.startsWith('data:image/');
  if (!isImage && message.trim().length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 chars)' });
  }
  if (isImage && message.length > 3 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large' });
  }
  try {
    const friendCheck = await pool.query(
      `SELECT id FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
      [req.userId, friendId]
    );
    if (friendCheck.rowCount === 0) {
      return res.status(403).json({ error: 'You must be friends to send messages' });
    }
    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, friendId, message.trim()]
    );
    const msgRow = result.rows[0];
    const userRes = await pool.query('SELECT username, name_color FROM users WHERE id = $1', [req.userId]);
    return res.status(201).json({
      message: {
        ...msgRow,
        sender_username: userRes.rows[0].username,
        sender_color: userRes.rows[0].name_color,
      }
    });
  } catch (err) {
    console.error('DM post error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/dm/:messageId', requireAuth, async (req: AuthRequest, res: Response) => {
  const messageId = parseInt(req.params.messageId as string, 10);
  if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid message ID' });
  try {
    const result = await pool.query(
      'DELETE FROM direct_messages WHERE id = $1 AND sender_id = $2 RETURNING id',
      [messageId, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Message not found or not yours' });
    return res.json({ success: true });
  } catch (err) {
    console.error('DM delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unread', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT sender_id, COUNT(*) as count
       FROM direct_messages
       WHERE receiver_id = $1 AND is_read = false
       GROUP BY sender_id`,
      [req.userId]
    );
    return res.json({ unread: result.rows });
  } catch (err) {
    console.error('Unread error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
