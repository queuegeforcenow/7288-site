const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken, requireAdmin } = require('./middleware/authenticate');
const crypto = require('crypto');

// ランクとボーナス
const rankBonuses = {
  'ブロンズ': 1000,
  'シルバー': 3000,
  'ゴールド': 7000,
  'プラチナ1': 15000,
  'プラチナ2': 30000,
  'プラチナ3': 50000,
  'プラチナ4': 70000,
  'プラチナ5': 100000,
  'ダイヤモンド1': 150000,
  'ダイヤモンド2': 200000,
  'ダイヤモンド3': 300000,
  'ダイヤモンド4': 400000,
  'ダイヤモンド5': 500000
};

// 管理者がリンク発行
router.post('/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const code = crypto.randomBytes(16).toString('hex');
    await pool.query(
      'INSERT INTO vip_links (code, created_at) VALUES ($1, NOW())',
      [code]
    );
    res.json({ link: `/api/vip/claim/${code}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'リンク生成エラー' });
  }
});

// ユーザーがボーナスリンク踏んだとき
router.get('/claim/:code', authenticateToken, async (req, res) => {
  const { code } = req.params;
  const userId = req.user.userId;

  try {
    const linkRes = await pool.query(
      'SELECT * FROM vip_links WHERE code = $1',
      [code]
    );

    if (linkRes.rows.length === 0) return res.status(404).json({ error: '無効なリンク' });

    const link = linkRes.rows[0];

    const alreadyClaimed = await pool.query(
      'SELECT * FROM vip_claims WHERE user_id = $1 AND link_id = $2',
      [userId, link.id]
    );
    if (alreadyClaimed.rows.length > 0) return res.status(400).json({ error: '既に受け取り済み' });

    const userRes = await pool.query('SELECT rank FROM users WHERE id = $1', [userId]);
    const userRank = userRes.rows[0].rank;
    const bonus = rankBonuses[userRank] || 0;

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [bonus, userId]);
    await pool.query('INSERT INTO vip_claims (user_id, link_id, claimed_at) VALUES ($1, $2, NOW())', [userId, link.id]);
    await pool.query('COMMIT');

    res.json({ message: `${bonus}円のVIPボーナスを受け取りました！` });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: '受け取りエラー' });
  }
});

module.exports = router;
