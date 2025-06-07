const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken, requireAdmin } = require('./middleware/authenticate');

// ユーザー削除
router.delete('/delete/:userId', authenticateToken, requireAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'ユーザー削除完了' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '削除エラー' });
  }
});

// 残高変更
router.post('/update-balance', authenticateToken, requireAdmin, async (req, res) => {
  const { userId, amount } = req.body;

  try {
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);
    res.json({ message: `ユーザー残高を${amount > 0 ? '加算' : '減算'}しました。` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '残高操作エラー' });
  }
});
