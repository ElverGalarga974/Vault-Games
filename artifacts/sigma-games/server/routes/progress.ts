import { Router, Response } from 'express';
import pool from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

const RANK_TIERS = [
  { name: 'Bronze', minSigmas: 0, color: '#CD7F32' },
  { name: 'Silver', minSigmas: 500_000, color: '#C0C0C0' },
  { name: 'Gold', minSigmas: 25_000_000, color: '#FFD700' },
  { name: 'Platinum', minSigmas: 1_000_000_000, color: '#00CED1' },
  { name: 'Diamond', minSigmas: 100_000_000_000, color: '#B9F2FF' },
  { name: 'Master', minSigmas: 10_000_000_000_000, color: '#9B59B6' },
  { name: 'Grandmaster', minSigmas: 1_000_000_000_000_000, color: '#E74C3C' },
];

function getCurrentSeason(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getRankFromSigmas(sigmas: number): string {
  let rank = 'Bronze';
  for (const tier of RANK_TIERS) {
    if (sigmas >= tier.minSigmas) rank = tier.name;
  }
  return rank;
}

function getSeasonEndDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

router.get('/leaderboard/:gameId', async (req: any, res: Response) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id as user_id, u.username, u.name_color, u.profile_pic_url, u.active_border, u.level, gp.progress, gp.playtime_seconds
       FROM game_progress gp
       JOIN users u ON u.id = gp.user_id
       WHERE gp.game_id = $1
       ORDER BY COALESCE((gp.progress->>'lifetimeSigmas')::numeric, 0) DESC
       LIMIT 50`,
      [gameId]
    );
    const entries = result.rows.map(r => ({
      userId: r.user_id,
      username: r.username,
      nameColor: r.name_color || null,
      profilePic: r.profile_pic_url || null,
      activeBorder: r.active_border || null,
      level: r.level || 1,
      lifetimeSigmas: r.progress?.lifetimeSigmas || 0,
      rebirths: r.progress?.rebirths || 0,
      equippedTitle: r.progress?.equippedTitle || null,
      equippedBorder: r.progress?.equippedBorder || null,
      equippedBadges: r.progress?.equippedBadges || [],
    }));
    return res.json(entries);
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.json([]);
  }
});

router.get('/friends-leaderboard/:gameId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id as user_id, u.username, u.name_color, u.profile_pic_url, u.active_border, u.level, gp.progress, gp.playtime_seconds
       FROM game_progress gp
       JOIN users u ON u.id = gp.user_id
       WHERE gp.game_id = $1
         AND (u.id = $2 OR u.id IN (
           SELECT CASE WHEN f.requester_id = $2 THEN f.addressee_id ELSE f.requester_id END
           FROM friendships f
           WHERE f.status = 'accepted' AND (f.requester_id = $2 OR f.addressee_id = $2)
         ))
       ORDER BY COALESCE((gp.progress->>'lifetimeSigmas')::numeric, 0) DESC
       LIMIT 50`,
      [gameId, req.userId]
    );
    const entries = result.rows.map(r => ({
      userId: r.user_id,
      username: r.username,
      nameColor: r.name_color || null,
      profilePic: r.profile_pic_url || null,
      activeBorder: r.active_border || null,
      level: r.level || 1,
      lifetimeSigmas: r.progress?.lifetimeSigmas || 0,
      rebirths: r.progress?.rebirths || 0,
      equippedTitle: r.progress?.equippedTitle || null,
      equippedBorder: r.progress?.equippedBorder || null,
      equippedBadges: r.progress?.equippedBadges || [],
      isMe: r.user_id === req.userId,
    }));
    return res.json(entries);
  } catch (err) {
    console.error('Friends leaderboard error:', err);
    return res.json([]);
  }
});

router.get('/:gameId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query(
      'SELECT progress, playtime_seconds, updated_at FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [req.userId, gameId]
    );
    if (result.rowCount === 0) {
      return res.json({ progress: null });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Progress get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:gameId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  const { progress, playtimeSeconds } = req.body;
  if (!progress) return res.status(400).json({ error: 'Progress data is required' });
  try {
    const result = await pool.query(
      `INSERT INTO game_progress (user_id, game_id, progress, playtime_seconds)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         progress = EXCLUDED.progress,
         playtime_seconds = EXCLUDED.playtime_seconds,
         updated_at = NOW()
       RETURNING *`,
      [req.userId, gameId, JSON.stringify(progress), playtimeSeconds || 0]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Progress save error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/ranked/:gameId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  const season = getCurrentSeason();
  try {
    const seasonRow = await pool.query(
      `SELECT season_sigmas, season_rebirths, peak_rank FROM ranked_seasons WHERE user_id = $1 AND game_id = $2 AND season = $3`,
      [req.userId, gameId, season]
    );

    const seasonSigmas = seasonRow.rows[0] ? Number(seasonRow.rows[0].season_sigmas) : 0;
    const seasonRebirths = seasonRow.rows[0] ? Number(seasonRow.rows[0].season_rebirths || 0) : 0;
    const currentRank = getRankFromSigmas(seasonSigmas);

    const posResult = await pool.query(
      `SELECT COUNT(*) + 1 as position FROM ranked_seasons
       WHERE game_id = $1 AND season = $2 AND season_sigmas > $3`,
      [gameId, season, seasonSigmas]
    );
    const position = parseInt(posResult.rows[0]?.position || '0');

    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM ranked_seasons WHERE game_id = $1 AND season = $2 AND season_sigmas > 0`,
      [gameId, season]
    );
    const totalPlayers = parseInt(totalResult.rows[0]?.total || '0');

    const isLegend = position <= 3 && seasonSigmas > 0 && totalPlayers >= 3;
    const finalRank = isLegend ? 'Legend' : currentRank;

    const nextTier = RANK_TIERS.find(t => t.minSigmas > seasonSigmas);
    const currentTier = [...RANK_TIERS].reverse().find(t => seasonSigmas >= t.minSigmas);
    const progressToNext = nextTier && currentTier
      ? Math.min(1, (seasonSigmas - currentTier.minSigmas) / (nextTier.minSigmas - currentTier.minSigmas))
      : 1;

    const topResult = await pool.query(
      `SELECT rs.season_sigmas, rs.season_rebirths, rs.peak_rank, u.username, u.name_color, u.profile_pic_url, u.active_border, u.level
       FROM ranked_seasons rs
       JOIN users u ON u.id = rs.user_id
       WHERE rs.game_id = $1 AND rs.season = $2 AND rs.season_sigmas > 0
       ORDER BY rs.season_sigmas DESC
       LIMIT 50`,
      [gameId, season]
    );
    const leaderboard = topResult.rows.map((r: any, i: number) => {
      const s = Number(r.season_sigmas);
      const rb = Number(r.season_rebirths || 0);
      const isTop3 = i < 3 && topResult.rows.length >= 3;
      return {
        username: r.username,
        nameColor: r.name_color,
        profilePic: r.profile_pic_url,
        activeBorder: r.active_border,
        level: r.level || 1,
        seasonSigmas: s,
        seasonRebirths: rb,
        rank: isTop3 ? 'Legend' : getRankFromSigmas(s),
        position: i + 1,
      };
    });

    const seasonEnd = getSeasonEndDate();

    const historyResult = await pool.query(
      `SELECT season, season_sigmas, season_rebirths, peak_rank, final_position FROM ranked_seasons
       WHERE user_id = $1 AND game_id = $2 AND season != $3
       ORDER BY season DESC LIMIT 6`,
      [req.userId, gameId, season]
    );

    return res.json({
      season,
      seasonEnd: seasonEnd.toISOString(),
      rank: finalRank,
      seasonSigmas,
      seasonRebirths,
      position: seasonSigmas > 0 ? position : null,
      totalPlayers,
      progressToNext,
      nextTier: nextTier ? { name: nextTier.name, minSigmas: nextTier.minSigmas } : null,
      currentTier: currentTier ? { name: currentTier.name, minSigmas: currentTier.minSigmas } : null,
      tiers: RANK_TIERS,
      leaderboard,
      history: historyResult.rows.map((r: any) => ({
        season: r.season,
        sigmas: Number(r.season_sigmas),
        rebirths: Number(r.season_rebirths || 0),
        rank: r.peak_rank,
        position: r.final_position,
      })),
    });
  } catch (err) {
    console.error('Ranked error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ranked/:gameId/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  const { lifetimeSigmas: clientSigmas, rebirths: clientRebirths } = req.body;
  if (typeof clientSigmas !== 'number' || clientSigmas < 0) return res.status(400).json({ error: 'lifetimeSigmas required' });
  const totalRebirths = typeof clientRebirths === 'number' ? Math.max(0, clientRebirths) : 0;

  const savedProgress = await pool.query(
    `SELECT COALESCE((gp.progress->>'lifetimeSigmas')::numeric, 0) as saved,
            COALESCE((gp.progress->>'rebirths')::integer, 0) as saved_rebirths
     FROM game_progress gp WHERE gp.user_id = $1 AND gp.game_id = $2`,
    [req.userId, gameId]
  );
  const savedTotal = Number(savedProgress.rows[0]?.saved || 0);
  const maxAllowed = Math.max(savedTotal * 10, savedTotal + 5_000_000_000);
  const lifetimeSigmas = Math.min(clientSigmas, maxAllowed);

  const season = getCurrentSeason();
  try {
    const existing = await pool.query(
      `SELECT baseline_sigmas, baseline_rebirths, season_sigmas, season_rebirths, peak_rank FROM ranked_seasons WHERE user_id = $1 AND game_id = $2 AND season = $3`,
      [req.userId, gameId, season]
    );

    let seasonSigmas: number;
    let seasonRebirths: number;

    if (existing.rows.length === 0) {
      const prevProgress = await pool.query(
        `SELECT COALESCE((gp.progress->>'lifetimeSigmas')::numeric, 0) as total,
                COALESCE((gp.progress->>'rebirths')::integer, 0) as total_rebirths
         FROM game_progress gp WHERE gp.user_id = $1 AND gp.game_id = $2`,
        [req.userId, gameId]
      );
      const baseline = Number(prevProgress.rows[0]?.total || 0);
      const baselineRebirths = Number(prevProgress.rows[0]?.total_rebirths || 0);
      seasonSigmas = Math.max(0, lifetimeSigmas - baseline);
      seasonRebirths = Math.max(0, totalRebirths - baselineRebirths);
      const rank = getRankFromSigmas(seasonSigmas);
      await pool.query(
        `INSERT INTO ranked_seasons (user_id, game_id, season, baseline_sigmas, baseline_rebirths, season_sigmas, season_rebirths, peak_rank)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.userId, gameId, season, baseline, baselineRebirths, seasonSigmas, seasonRebirths, rank]
      );
    } else {
      const baseline = Number(existing.rows[0].baseline_sigmas);
      const baselineRebirths = Number(existing.rows[0].baseline_rebirths || 0);
      seasonSigmas = Math.max(0, lifetimeSigmas - baseline);
      seasonRebirths = Math.max(0, totalRebirths - baselineRebirths);
      const rank = getRankFromSigmas(seasonSigmas);
      const rankIndex = RANK_TIERS.findIndex(t => t.name === rank);
      const peakIndex = RANK_TIERS.findIndex(t => t.name === existing.rows[0].peak_rank);
      const newPeak = rankIndex >= peakIndex ? rank : existing.rows[0].peak_rank;
      await pool.query(
        `UPDATE ranked_seasons SET season_sigmas = $1, season_rebirths = $2, peak_rank = $3, updated_at = NOW()
         WHERE user_id = $4 AND game_id = $5 AND season = $6`,
        [seasonSigmas, seasonRebirths, newPeak, req.userId, gameId, season]
      );
    }

    return res.json({ ok: true, seasonSigmas, seasonRebirths });
  } catch (err) {
    console.error('Ranked sync error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT game_id, progress, playtime_seconds, updated_at FROM game_progress WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    return res.json({ games: result.rows });
  } catch (err) {
    console.error('All progress get error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
