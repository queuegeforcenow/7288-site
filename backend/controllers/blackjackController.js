const { getUserById, updateUserRankAndBalance } = require('../models/userModel');
const { getRankByTotalBet } = require('../utils/rankUtils');

let gameStates = {}; // シンプルにメモリ管理（本番はDB推奨）

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = [
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 },
    { name: 'A', value: 11 },
  ];

  let deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank: rank.name, value: rank.value });
    }
  }
  // シャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  for (const card of hand) {
    value += card.value;
    if (card.rank === 'A') aces++;
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
}

async function startGame(req, res) {
  const userId = req.user.id;
  const bet = parseInt(req.body.bet, 10);
  if (!bet || bet <= 0) {
    return res.status(400).json({ error: 'ベット金額が無効です' });
  }

  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ error: 'ユーザーが見つかりません' });
  if (user.balance < bet) return res.status(400).json({ error: '残高不足です' });

  const deck = createDeck();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  gameStates[userId] = {
    deck,
    playerHand,
    dealerHand,
    bet,
    finished: false,
  };

  res.json({
    playerHand,
    dealerHand: [dealerHand[0], { suit: 'hidden', rank: '?', value: 0 }],
    bet,
  });
}

async function hit(req, res) {
  const userId = req.user.id;
  const state = gameStates[userId];
  if (!state || state.finished) return res.status(400).json({ error: 'ゲームがありません' });

  const card = state.deck.pop();
  state.playerHand.push(card);

  const playerValue = calculateHandValue(state.playerHand);
  if (playerValue > 21) {
    state.finished = true;
    await endGame(userId, false, state.bet);
    return res.json({ playerHand: state.playerHand, dealerHand: state.dealerHand, bust: true, result: '負け' });
  }

  res.json({ playerHand: state.playerHand, dealerHand: [state.dealerHand[0], { suit: 'hidden', rank: '?', value: 0 }] });
}

async function stand(req, res) {
  const userId = req.user.id;
  const state = gameStates[userId];
  if (!state || state.finished) return res.status(400).json({ error: 'ゲームがありません' });

  // ディーラーのターン
  while (calculateHandValue(state.dealerHand) < 17) {
    state.dealerHand.push(state.deck.pop());
  }

  const playerValue = calculateHandValue(state.playerHand);
  const dealerValue = calculateHandValue(state.dealerHand);

  let win = false;
  let draw = false;

  if (dealerValue > 21 || playerValue > dealerValue) {
    win = true;
  } else if (playerValue === dealerValue) {
    draw = true;
  }

  state.finished = true;

  await endGame(userId, win, state.bet, draw);

  res.json({
    playerHand: state.playerHand,
    dealerHand: state.dealerHand,
    result: draw ? '引き分け' : win ? '勝ち' : '負け',
  });
}

async function endGame(userId, win, bet, draw = false) {
  const user = await getUserById(userId);
  let newBalance = user.balance;
  let newTotalBet = user.total_bet + bet;

  if (win) {
    newBalance += bet * 2; // 勝ったら2倍払い戻し
  } else if (draw) {
    newBalance += bet; // 引き分けならベット返却
  }

  // ランク判定
  const rankInfo = getRankByTotalBet(newTotalBet);

  await updateUserRankAndBalance(userId, rankInfo.name, newBalance, newTotalBet);
}

module.exports = { startGame, hit, stand };
