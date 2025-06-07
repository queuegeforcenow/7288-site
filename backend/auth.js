const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // 環境変数に切り出し推奨
const crypto = require('crypto');

// ユーザーネーム生成（ランダム英数字8文字）
function generateUsername() {
  return crypto.randomBytes(4).toString('hex');
}

// 新規ユーザー登録
router.post('/register', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上必要です' });
  }
  const username = generateUsername();
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, total_bet, balance) VALUES ($1, $2, 0, 0) RETURNING id, username',
      [username, hashed]
    );
    res.json({ userId: result.rows[0].id, username: result.rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登録エラー' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'ユーザーネームとパスワードが必要です' });

  try {
    const result = await pool.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'ユーザーが存在しません' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'パスワードが違います' });

    const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ログインエラー' });
  }
});

module.exports = router;
