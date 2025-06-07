const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authenticate');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// ─── 設定 ────────────────────────────────────────────
const BOARD_SIZE = 25;          // 5×5 マス = 25
const MAX_MINES  = 24;          // 1〜24 個
// マルチプライヤー計算用：残セル / 安全セル の逆数を掛け合わせる
// Stake と完全一致ではないが “増えるほど高倍率” の簡易式
function nextMultiplier(currentMult, safeLeft, minesLeft) {
  const probSafe = (safeLeft) / (safeLeft + minesLeft);
  return Number((currentMult / probSafe).toFixed(4));
}

// ─── メモリに簡易セッション保持（本番は Redis 等へ） ─
const sessions = {};  // key: gameId -> { userId, bet, mines, board:[0/1], opened:Set, mult }

function randomBoard(mines) {
  const board = Array(BOARD_SIZE).fill(0);
  let placed = 0;
  while (placed < mines) {
    const idx = Math.floor(Math.random() * BOARD_SIZE);
    if (board[idx] === 0) {
      board[idx] = 1; // 1 が爆弾
      placed++;
    }
  }
  return board;
}

// ─── API ────────────────────────────────────────────

// ゲーム開始
router.post('/start', authMiddleware, async (req, res) => {
  const { bet, mines } = req.body;
  if (!bet || bet <= 0) return res.status(400).json({ message: 'bet 必須' });
  if (!mines || mines < 1 || mines > MAX_MINES)
    return res.status(400).json({ message: 'mines は 1〜24' });

  // 残高チェック
  const user = await db.query('SELECT balance FROM users WHERE id=$1', [req.user.id]);
  if (user.rows[0].balance < bet) return res.status(400).json({ message: '残高不足' });

  // 残高からベット額を引く
  await db.query('UPDATE users SET balance = balance - $1, total_bet = total_bet + $1 WHERE id=$2', [bet, req.user.id]);

  const gameId = uuidv4();
  sessions[gameId] = {
    userId: req.user.id,
    bet,
    mines,
    board: randomBoard(mines),
    opened: new Set(),
    mult: 1
  };

  res.json({ gameId, boardSize: BOARD_SIZE, mines });
});

// マスを開く
router.post('/open', authMiddleware, (req, res) => {
  const { gameId, index } = req.body;
  const sess = sessions[gameId];
  if (!sess || sess.userId !== req.user.id) return res.status(400).json({ message: 'ゲームが無効' });
  if (sess.opened.has(index)) return res.status(400).json({ message: '既に開いたマス' });

  const isMine = sess.board[index] === 1;
  if (isMine) {
    // 負け：ゲーム終了、セッション削除
    delete sessions[gameId];
    return res.json({ result: 'lose', mineIndex: index });
  }

  // セーフ
  sess.opened.add(index);
  const safeLeft  = BOARD_SIZE - sess.mines - sess.opened.size;
  const minesLeft = sess.mines;
  sess.mult = nextMultiplier(sess.mult, safeLeft, minesLeft);

  res.json({
    result: 'safe',
    index,
    nextMultiplier: sess.mult.toFixed(4)
  });
});

// キャッシュアウト
router.post('/cashout', authMiddleware, async (req, res) => {
  const { gameId } = req.body;
  const sess = sessions[gameId];
  if (!sess || sess.userId !== req.user.id) return res.status(400).json({ message: 'ゲームが無効' });

  const payout = Math.floor(sess.bet * sess.mult);
  await db.query('UPDATE users SET balance = balance + $1 WHERE id=$2', [payout, req.user.id]);

  // ログ保存は省略（games_log などへ INSERT 推奨）
  delete sessions[gameId];
  res.json({ result: 'win', payout });
});

module.exports = router;
