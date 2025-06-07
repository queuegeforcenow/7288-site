const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authenticate');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// ─── 記録用テーブル（PostgreSQLに手動で作成）────────────
// CREATE TABLE bonus_links (
//   id UUID PRIMARY KEY,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   used_by UUID[] DEFAULT '{}'
// );

const RANK_AMOUNTS = {
  Bronze: 1000,
  Silver: 2000,
  Gold: 5000,
  Platinum: 10000,
  Diamond: 20000
};

// リンク発行（管理者のみ）
router.post('/generate', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  const id = uuidv4();
  await db.query('INSERT INTO bonus_links (id) VALUES ($1)', [id]);
  const url = `${process.env.FRONTEND_URL || 'https://yourapp.com'}/bonus.html?id=${id}`;
  res.json({ message: 'リンク生成成功', url });
});

// 受け取り
router.post('/claim', authMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: 'リンクIDがありません' });

  const result = await db.query('SELECT * FROM bonus_links WHERE id=$1', [id]);
  if (result.rows.length === 0) return res.status(400).json({ message: '無効なリンク' });

  const link = result.rows[0];
  if (link.used_by.includes(req.user.id))
    return res.status(400).json({ message: '既に受け取り済みです' });

  // ランク取得
  const user = await db.query('SELECT rank FROM users WHERE id=$1', [req.user.id]);
  const rank = user.rows[0].rank || 'Bronze';
  const amount = RANK_AMOUNTS[rank] || 1000;

  // 残高追加・使用記録
  await db.query('BEGIN');
  await db.query('UPDATE users SET balance = balance + $1 WHERE id=$2', [amount, req.user.id]);
  await db.query('UPDATE bonus_links SET used_by = array_append(used_by, $1) WHERE id=$2', [req.user.id, id]);
  await db.query('COMMIT');

  res.json({ message: `🎁 ${rank} ランクボーナス ${amount} コイン受取完了` });
});

module.exports = router;
