import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: '',
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined,
  },
});

router.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at FROM ai_conversations
       WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50`,
      [req.userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('AI conversations list error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
      [req.userId, title || 'New Chat']
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('AI conversation create error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/conversations/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      `DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('AI conversation delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/conversations/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  try {
    await pool.query(
      `UPDATE ai_conversations SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
      [title, req.params.id, req.userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('AI conversation rename error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversations/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const conv = await pool.query(
      `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (conv.rowCount === 0) return res.status(404).json({ error: 'Conversation not found' });

    const result = await pool.query(
      `SELECT id, role, content, created_at FROM ai_messages
       WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('AI messages get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/conversations/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  const { message, imageBase64, imageMimeType } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 10000) {
    return res.status(400).json({ error: 'Message too long (max 10,000 characters)' });
  }

  try {
    const conv = await pool.query(
      `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (conv.rowCount === 0) return res.status(404).json({ error: 'Conversation not found' });

    const dbContent = imageBase64
      ? `${message.trim()}\n[User attached an image]`
      : message.trim();

    await pool.query(
      `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
      [req.params.id, dbContent]
    );

    const history = await pool.query(
      `SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.id]
    );
    history.rows.reverse();

    const chatMessages = history.rows.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If user attached an image, replace last user message with multimodal parts
    if (imageBase64 && imageMimeType && chatMessages.length > 0) {
      const last = chatMessages[chatMessages.length - 1];
      if (last.role === 'user') {
        const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        last.parts = [
          { text: message.trim() || 'What is in this image?' },
          { inlineData: { mimeType: imageMimeType, data: rawBase64 } },
        ] as any;
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullResponse = '';

    try {
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: chatMessages,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: `You are Vault AI, the built-in assistant for Vault Games (vaultgames.site) — a free online gaming platform.

ABOUT THE PLATFORM:
- Games available: Action (Venge.io, Ev.io, Geometry Dash, Surviv.io, Bad Time Simulator, Bloons Tower Defense), Clicker (Sigma Clicker, Epstein Clicker, Doge Miner 2), Puzzle (Wordle Infinite, 2048, Tetris, Block Blast, Hextris), Sports (Basket Random, Soccer Random, 8 Ball Pool, Rocketgoal.io), IO Games (Paper.io 2, Territorial.io), and more. Native built-in games include Chess, Sudoku, Snake, Tic-Tac-Toe, 2048, and Sigma Clicker.
- Users earn XP, coins, and level up by playing games. They can customize profiles, add friends, and chat globally.
- There is a ranked system with seasons and sigma ratings.
- Users can redeem codes for coins and XP.
- The platform has a shop with cosmetic items and profile borders.

YOUR ROLE:
- Help users with game tips, strategies, and walkthroughs for any game on the platform.
- For Chess: explain openings, suggest moves, and teach strategy.
- For Sudoku: explain solving techniques (naked singles, hidden pairs, X-wing, etc).
- Help with anything outside games too — homework, coding, writing, math, science, or casual chat.
- If asked about the platform itself (how XP works, how to level up, how ranked works), explain it clearly.
- Be friendly, concise, and use markdown formatting when it improves clarity.
- Keep responses focused — don't pad answers unnecessarily.`,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } catch (aiErr: any) {
      console.error('Gemini stream error:', aiErr);
      if (!fullResponse) {
        fullResponse = 'Sorry, I encountered an error processing your request. Please try again.';
        res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
      }
    }

    await pool.query(
      `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [req.params.id, fullResponse]
    );

    await pool.query(
      `UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    if (history.rows.length <= 1) {
      const titleSnippet = message.trim().substring(0, 60);
      await pool.query(
        `UPDATE ai_conversations SET title = $1 WHERE id = $2 AND title = 'New Chat'`,
        [titleSnippet, req.params.id]
      );
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('AI message send error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.end();
  }
});

router.post('/conversations/:id/image', requireAuth, async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt too long (max 4,000 characters)' });
  }

  try {
    const conv = await pool.query(
      `SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (conv.rowCount === 0) return res.status(404).json({ error: 'Conversation not found' });

    await pool.query(
      `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
      [req.params.id, prompt.trim()]
    );

    const result = await ai.models.generateImages({
      model: 'gemini-2.5-flash-image',
      prompt: prompt.trim(),
      config: {
        numberOfImages: 1,
      },
    });

    const generated = result.generatedImages?.[0];
    const imageBytes = generated?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error('No image generated');
    }

    const mimeType = generated.image.mimeType || 'image/png';
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedMimes.includes(mimeType)) {
      return res.status(502).json({ error: 'Unsupported image type returned' });
    }
    const MAX_IMAGE_BASE64_BYTES = 8 * 1024 * 1024;
    if (imageBytes.length > MAX_IMAGE_BASE64_BYTES) {
      return res.status(502).json({ error: 'Generated image too large' });
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBytes)) {
      return res.status(502).json({ error: 'Invalid image data returned' });
    }
    const imageUrl = `data:${mimeType};base64,${imageBytes}`;
    const assistantText = `![Generated image](${imageUrl})`;

    await pool.query(
      `INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [req.params.id, assistantText]
    );

    await pool.query(
      `UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    return res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('AI image generation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Chess hint ──────────────────────────────────────────────────────────────
router.post('/chess-hint', requireAuth, async (req: AuthRequest, res: Response) => {
  const { fen, moveHistory } = req.body;
  if (!fen || typeof fen !== 'string') return res.status(400).json({ error: 'FEN required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const historyStr = Array.isArray(moveHistory) && moveHistory.length > 0
      ? `Move history (SAN): ${moveHistory.join(', ')}`
      : 'This is the starting position or early game.';

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `You are a chess coach. Analyze this position and give a clear, concise hint for the best move. Explain WHY it's good in 2-3 sentences. Don't give multiple options — just the single best move.\n\nFEN: ${fen}\n${historyStr}` }],
      }],
      config: { maxOutputTokens: 300 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ content: 'Could not analyze position. Try again.' })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// ── Daily challenge ──────────────────────────────────────────────────────────
const DAILY_CHALLENGES = [
  { type: 'score', gameId: 'snake', title: 'Snake Sprint', description: 'Score at least 10 points in Snake today.', icon: '🐍' },
  { type: 'score', gameId: '2048', title: '2048 Grind', description: 'Reach the 512 tile in 2048.', icon: '🔢' },
  { type: 'score', gameId: 'neon-clicker', title: 'Click Rush', description: 'Reach 1,000 Sigma Points in the Sigma Clicker.', icon: '👆' },
  { type: 'play', gameId: 'chess', title: 'Chess Match', description: 'Win a game of Chess against the AI on Medium or Hard.', icon: '♟️' },
  { type: 'play', gameId: 'sudoku', title: 'Sudoku Solve', description: 'Complete a Medium or Hard Sudoku puzzle.', icon: '🧩' },
  { type: 'play', gameId: 'wordle', title: 'Wordle Win', description: 'Solve today\'s Wordle in 4 guesses or fewer.', icon: '🟩' },
  { type: 'play', gameId: 'tetris', title: 'Tetris Blitz', description: 'Clear at least 5 lines in a single Tetris game.', icon: '🧱' },
  { type: 'play', gameId: 'paper-io-2', title: 'Territory King', description: 'Capture more than 30% of the map in Paper.io 2.', icon: '🗺️' },
  { type: 'play', gameId: 'tictactoe', title: 'Tic-Tac-Toe Champ', description: 'Win 3 games of Tic-Tac-Toe in a row.', icon: '❌' },
  { type: 'play', gameId: 'hextris', title: 'Hextris Hustle', description: 'Survive for at least 60 seconds in Hextris.', icon: '🔷' },
  { type: 'score', gameId: '2048', title: 'Tile Master', description: 'Reach the 1024 tile in 2048.', icon: '🏆' },
  { type: 'play', gameId: 'geometry-dash', title: 'Geometry Dash', description: 'Complete any level in Geometry Dash without quitting.', icon: '📐' },
  { type: 'play', gameId: 'surviv-io', title: 'Battle Royale', description: 'Survive into the top 10 in Surviv.io.', icon: '🎯' },
  { type: 'play', gameId: '8-ball-pool', title: 'Pool Shark', description: 'Win a game of 8 Ball Pool.', icon: '🎱' },
];

router.get('/daily-challenge', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const challenge = DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return res.json({ challenge: { ...challenge, date: dateStr } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Game recommendations ─────────────────────────────────────────────────────
const ALL_GAMES = [
  'Venge.io','Ev.io','Geometry Dash','Surviv.io','Bad Time Simulator','Bloons Tower Defense',
  'Sigma Clicker','Epstein Clicker','Doge Miner 2',
  'Wordle Infinite','2048','Tetris','Block Blast','Hextris','Draw Climber','Stack Rush',
  'Basket Random','Soccer Random','8 Ball Pool','Rocketgoal.io',
  'Paper.io 2','Territorial.io',
  'Chess','Sudoku','Snake','Tic-Tac-Toe',
];

router.get('/recommendations', requireAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const progressResult = await pool.query(
      `SELECT game_id, playtime_seconds FROM game_progress WHERE user_id = $1 ORDER BY playtime_seconds DESC LIMIT 10`,
      [req.userId]
    );

    const played = progressResult.rows;
    const playedStr = played.length > 0
      ? played.map((r: any) => `${r.game_id} (${Math.round(r.playtime_seconds / 60)} min)`).join(', ')
      : 'No games played yet';

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `A Vault Games player has played: ${playedStr}.\n\nAll available games: ${ALL_GAMES.join(', ')}.\n\nRecommend 3 games they haven't tried yet (or haven't played much) that match their tastes. For each, give the game name in bold and 1 sentence explaining why they'd enjoy it based on what they've played. Be enthusiastic and brief.` }],
      }],
      config: { maxOutputTokens: 400 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ content: 'Could not load recommendations. Try again.' })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;

