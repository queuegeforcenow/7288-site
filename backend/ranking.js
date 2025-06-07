const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken } = require('./middleware/authenticate');

// ランク判定基準（掛け金とボーナス）
const ranks = [
  { name: 'なし', min: 0, bonus: 0 },
  { name: 'ブロンズ', min: 100000, bonus: 4000 },
  { name: 'シルバー', min: 1000000, bonus: 10000 },
  { name: 'ゴールド', min: 5000000, bonus: 50000 },
  { name: 'プラチナ1', min: 10000000, bonus: 100000 },
  { name: 'プラチナ2', min: 20000000, bonus: 200000 },
  { name: 'プラチナ3', min: 30000000, bonus: 300000 },
  { name: 'プラチナ4', min: 50000000, bonus: 500000 },
  { name: 'プラチナ5', min: 70000000, bonus: 700000 },
  { name: 'ダイヤモンド1', min: 100000000, bonus: 1000000 },
  { name: 'ダイヤモンド2', min: 200000000, bonus: 2000000 },
  { name: 'ダイヤモンド3', min: 300000000, bonus: 3000000 },
  { name: 'ダイヤモンド4', min: 400000000, bonus: 4000000 },
  { name: 'ダイヤモンド5', min: 500000000, bonus: 5000000 }
];

// ユーザーのランクを返す関数
function getRank(totalBet) {
  let rank = ranks[0];
  for (const r of ranks) {
    if (totalBet >= r.min) rank = r;
  }
  return rank;
}

// 全ユーザーランキング取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, total_bet, balance FROM users ORDER BY total_bet DESC LIMIT 100');
    const users = result.rows.map(user => {
      const rank = getRank(user.total_bet);
      return {
        id: user.id,
        username: user.username,
        total_bet: user.total_bet,
        balance: user.balance,
        rank: rank.name
      };
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ランク昇格ボーナス付与API
router.post('/rankup-bonus', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const userRes = await pool.query('SELECT total_bet, rank FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'ユーザーが見つかりません' });

    const user = userRes.rows[0];
    const currentRank = ranks.find(r => r.name === user.rank) || ranks[0];
    const newRank = getRank(user.total_bet);

    if (newRank.min > currentRank.min) {
      // ランク昇格ボーナス付与
      await pool.query('UPDATE users SET balance = balance + $1, rank = $2 WHERE id = $3', [newRank.bonus, newRank.name, userId]);
      res.json({ message: `ランク昇格！${newRank.name}になりました。ボーナス${newRank.bonus}円を付与しました。` });
    } else {
      res.json({ message: '昇格ボーナスの対象ではありません。' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

module.exports = router;
