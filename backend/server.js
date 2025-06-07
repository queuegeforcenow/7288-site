const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // ちゃんと環境変数化してください

// DB接続（PostgreSQL）設定は別ファイルと想定
const { pool } = require('./db');

app.use(express.json());

const authRouter = require('./auth');
app.use('/api/auth', authRouter);

const blackjackRouter = require('./blackjack');
app.use('/api/blackjack', blackjackRouter);



// 認証ミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: '認証情報がありません' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'トークンが不正です' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: 'トークンの検証に失敗しました' });
    req.user = user;
    next();
  });
}

// ランキングAPI
app.get('/api/ranking', authenticateToken, async (req, res) => {
  try {
    // total_betの降順で上位100件取得しrankも計算して返す
    const result = await pool.query(`
      SELECT username, total_bet,
      CASE
        WHEN total_bet >= 500000000 THEN 'ダイヤモンド5'
        WHEN total_bet >= 400000000 THEN 'ダイヤモンド4'
        WHEN total_bet >= 300000000 THEN 'ダイヤモンド3'
        WHEN total_bet >= 200000000 THEN 'ダイヤモンド2'
        WHEN total_bet >= 100000000 THEN 'ダイヤモンド1'
        WHEN total_bet >= 70000000 THEN 'プラチナ5'
        WHEN total_bet >= 50000000 THEN 'プラチナ4'
        WHEN total_bet >= 30000000 THEN 'プラチナ3'
        WHEN total_bet >= 20000000 THEN 'プラチナ2'
        WHEN total_bet >= 10000000 THEN 'プラチナ1'
        WHEN total_bet >= 5000000 THEN 'ゴールド'
        WHEN total_bet >= 1000000 THEN 'シルバー'
        WHEN total_bet >= 100000 THEN 'ブロンズ'
        ELSE 'なし'
      END AS rank
      FROM users
      ORDER BY total_bet DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
