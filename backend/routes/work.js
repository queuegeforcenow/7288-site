const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/authenticate');

const MIN_REWARD = 200;
const MAX_REWARD = 5000;
const COOLDOWN_HOURS = 1;

router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 最終work時間を確認
    const lastWorkResult = await db.query(
      'SELECT last_work_at FROM users WHERE id = $1',
      [userId]
    );

    const lastWorkAt = lastWorkResult.rows[0].last_work_at;
    const now = new Date();

    if (lastWorkAt) {
      const cooldownUntil = new Date(lastWorkAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
      if (now < cooldownUntil) {
        const minutesLeft = Math.ceil((cooldownUntil - now) / 60000);
        return res.status(429).json({ message: `クールダウン中です。あと ${minutesLeft} 分で再度利用可能です。` });
      }
    }

    // ランダム金額生成
    const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;

    // 残高更新 & 最終work時間更新
    await db.query(
      'UPDATE users SET balance = balance + $1, last_work_at = $2 WHERE id = $3',
      [reward, now, userId]
    );

    res.json({ message: `${reward} 円を獲得しました！`, reward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'エラーが発生しました。' });
  }
});

module.exports = router;
