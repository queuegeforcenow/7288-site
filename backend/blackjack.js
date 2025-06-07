const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { authenticateToken } = require('./middleware/authenticate'); // 認証ミドルウェア

// カードのデッキ作成
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// カードの点数計算
function calculatePoints(cards) {
  let points = 0;
  let aceCount = 0;
  for (const card of cards) {
    if (['J','Q','K'].includes(card.rank)) {
      points += 10;
    } else if (card.rank === 'A') {
      aceCount++;
      points += 11;
    } else {
      points += parseInt(card.rank);
    }
  }
  // Aの調整
  while (points > 21 && aceCount > 0) {
    points -= 10;
    aceCount--;
  }
  return points;
}

// ゲーム開始 API
router.post('/start', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const betAmount = req.body.bet;
  if (!betAmount || betAmount <= 0) return res.status(400).json({ error: '賭け金が必要です' });

  try {
    // ユーザーの残高確認
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    if (userResult.rows[0].balance < betAmount) return res.status(400).json({ error: '残高不足です' });

    // 残高減らす
    await pool.query('UPDATE users SET balance = balance - $1, total_bet = total_bet + $1 WHERE id = $2', [betAmount, userId]);

    // 新しいゲームセッションを作る（実際はDB保存が望ましいが今回は簡略）
    const deck = createDeck();
    // シャッフル
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const playerCards = [deck.pop(), deck.pop()];
    const dealerCards = [deck.pop(), deck.pop()];

    // DBにゲーム状態を保存（省略、トークンなどで管理可能）

    res.json({
      bet: betAmount,
      playerCards,
      dealerCards: [dealerCards[0], { suit: '?', rank: '?' }],
      deckCount: deck.length,
      playerPoints: calculatePoints(playerCards)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ヒット API
router.post('/hit', authenticateToken, async (req, res) => {
  // 省略：ゲーム状態をDBから取得し、カードを1枚引き点数計算、結果返す処理
  res.status(501).json({ error: '未実装' });
});

// スタンド API
router.post('/stand', authenticateToken, async (req, res) => {
  // 省略：ディーラーのカード処理、勝敗判定、残高更新など
  res.status(501).json({ error: '未実装' });
});

module.exports = router;
