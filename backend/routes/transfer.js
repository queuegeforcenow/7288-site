const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/authenticate');

router.post('/', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  const { toUsername, amount } = req.body;

  if (!toUsername || !amount || amount <= 0) {
    return res.status(400).json({ message: '受取ユーザーネームと正しい金額が必要です。' });
  }

  try {
    await db.query('BEGIN');

    // 送信者残高チェック
    const senderResult = await db.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [senderId]);
    if (senderResult.rows.length === 0) throw new Error('送信者が見つかりません。');
    const senderBalance = senderResult.rows[0].balance;

    if (senderBalance < amount) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: '残高不足です。' });
    }

    // 受信者ID取得
    const receiverResult = await db.query('SELECT id, balance FROM users WHERE username = $1 FOR UPDATE', [toUsername]);
    if (receiverResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: '受取ユーザーが存在しません。' });
    }
    const receiver = receiverResult.rows[0];

    // 残高更新
    await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, senderId]);
    await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, receiver.id]);

    await db.query('COMMIT');

    res.json({ message: `送金成功: ${toUsername} に ${amount} 円送りました。` });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: '送金処理中にエラーが発生しました。' });
  }
});

module.exports = router;
