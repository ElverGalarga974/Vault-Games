import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, requireAuth, AuthRequest } from '../auth.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );
    if (existing.rowCount! > 0) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(countResult.rows[0].count) === 0;
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_admin, is_owner)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, profile_pic_url, profile_banner, bio, name_color, coins, xp, level, streak, is_admin, is_owner, created_at, inventory, active_border`,
      [username, email.toLowerCase(), passwordHash, isFirstUser, isFirstUser]
    );
    const user = result.rows[0];
    await pool.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1)',
      [user.id]
    );
    const token = signToken(user.id, user.username);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );
    return res.status(201).json({ token, user });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }
  try {
    const result = await pool.query(
      `SELECT id, username, email, password_hash, profile_pic_url, profile_banner, bio, name_color, coins, xp, level, streak, last_login_date, is_admin, is_owner, is_banned, is_muted, inventory, active_border
       FROM users WHERE email = $1 OR LOWER(username) = $1`,
      [emailOrUsername.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastLogin = user.last_login_date
      ? (user.last_login_date instanceof Date ? user.last_login_date.toISOString().split('T')[0] : String(user.last_login_date))
      : null;
    let newStreak = user.streak;
    let newInventory = user.inventory || [];
    if (lastLogin === yesterday) {
      newStreak = user.streak + 1;
    } else if (lastLogin !== today) {
      if (Array.isArray(newInventory) && newInventory.includes('streak-freeze')) {
        newInventory = [...newInventory];
        newInventory.splice(newInventory.indexOf('streak-freeze'), 1);
      } else {
        newStreak = 1;
      }
    }
    await pool.query(
      'UPDATE users SET streak = $1, last_login_date = $2, inventory = $3, updated_at = NOW() WHERE id = $4',
      [newStreak, today, newInventory, user.id]
    );
    user.streak = newStreak;
    user.inventory = newInventory;
    delete user.password_hash;
    const token = signToken(user.id, user.username);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );
    return res.json({ token, user });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.slice(7);
  await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  return res.json({ success: true });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.profile_pic_url, u.profile_banner, u.bio, u.name_color,
              u.coins, u.xp, u.level, u.streak, u.last_login_date, u.is_admin, u.is_owner, u.created_at, u.inventory, u.active_border,
              p.language, p.notifications_enabled, p.sound_enabled, p.music_enabled, p.theme, p.extras
       FROM users u
       LEFT JOIN user_preferences p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.last_login_date
      ? (user.last_login_date instanceof Date ? user.last_login_date.toISOString().split('T')[0] : String(user.last_login_date))
      : null;
    if (lastLogin !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = user.streak;
      let newInventory = user.inventory || [];
      if (lastLogin === yesterday) {
        newStreak = user.streak + 1;
      } else if (lastLogin && lastLogin < yesterday) {
        if (Array.isArray(newInventory) && newInventory.includes('streak-freeze')) {
          newInventory = [...newInventory];
          newInventory.splice(newInventory.indexOf('streak-freeze'), 1);
        } else {
          newStreak = 1;
        }
      }
      await pool.query(
        'UPDATE users SET streak = $1, last_login_date = $2, inventory = $3, updated_at = NOW() WHERE id = $4',
        [newStreak, today, newInventory, user.id]
      );
      user.streak = newStreak;
      user.inventory = newInventory;
    }
    delete user.last_login_date;
    return res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Vault Games <noreply@vaultgames.site>';

// ── Forgot password — send reset email ──────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  try {
    const result = await pool.query('SELECT id, username FROM users WHERE email = $1', [email.toLowerCase()]);
    // Always return success to prevent email enumeration
    if (result.rowCount === 0) return res.json({ success: true });

    const user = result.rows[0];
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resetUrl = `https://vaultgames.site/?reset=${token}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email.toLowerCase(),
      subject: 'Reset your Vault Games password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:12px;">
          <h1 style="font-size:24px;margin-bottom:8px;">🔐 Reset your password</h1>
          <p style="color:#aaa;margin-bottom:24px;">Hey ${user.username}, click the button below to reset your Vault Games password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
          <p style="color:#555;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email. Your password won't change.</p>
          <p style="color:#555;font-size:12px;">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset password with token ────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const result = await pool.query(
      `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }
    const { id: tokenId, user_id } = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [user_id]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
