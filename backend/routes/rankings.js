const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/authenticate');

// 全ユーザーのランキング取得（トップ100）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT username, total_bet_amount, total_wins, total_losses, rank
       FROM users
       ORDER BY total_bet_amount DESC
       LIMIT 100`
    );

    // 勝率計算
    const rankings = result.rows.map(user => {
      const totalGames = user.total_wins + user.total_losses;
      const winRate = totalGames > 0 ? ((user.total_wins / totalGames) * 100).toFixed(2) : '0.00';
      return {
        username: user.username,
        total_bet_amount: user.total_bet_amount,
        total_wins: user.total_wins,
        total_losses: user.total_losses,
        rank: user.rank,
        win_rate: winRate
      };
    });

    res.json({ rankings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ランキング取得失敗' });
  }
});

module.exports = router;
