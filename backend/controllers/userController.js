const userModel = require('../models/userModel');
const { getRankByTotalBet } = require('../utils/rankUtils');
const db = require('../db');

// ユーザーの残高を取得
async function getUserInfo(req, res) {
  try {
    const user = await userModel.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });

    res.json({
      id: user.id,
      username: user.username,
      balance: user.balance,
      total_bet: user.total_bet,
      rank: user.rank,
      is_admin: user.is_admin,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'ユーザー情報取得エラー' });
  }
}

// 残高を変更（ゲーム結果、workなど）
async function updateBalance(req, res) {
  try {
    const { amount } = req.body; // 増減額（プラスもマイナスも可）
    if (typeof amount !== 'number') {
      return res.status(400).json({ message: 'amountが必要です。' });
    }

    const user = await userModel.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });

    let newBalance = Number(user.balance) + amount;
    if (newBalance < 0) {
      return res.status(400).json({ message: '残高が不足しています。' });
    }

    // total_betを増やす場合は昇格チェックも行う
    let newTotalBet = user.total_bet;
    if (amount < 0) {
      // ゲームで掛け金使った場合 total_betに正の値で加算
      newTotalBet += -amount;
    }

    // ランク判定
    const newRankObj = getRankByTotalBet(newTotalBet);
    let newRank = user.rank;
    let bonus = 0;
    if (newRankObj.name !== user.rank) {
      newRank = newRankObj.name;
      bonus = newRankObj.bonus;
      newBalance += bonus; // 昇格ボーナスを残高に加算
    }

    await userModel.updateUserRankAndBalance(user.id, newRank, newBalance, newTotalBet);

    res.json({
      balance: newBalance,
      rank: newRank,
      total_bet: newTotalBet,
      bonus,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '残高更新エラー' });
  }
}

// 管理者がユーザーの残高や削除を行うAPI
async function adminUpdateUser(req, res) {
  try {
    const { userId, balance, deleteUser } = req.body;

    if (!userId) return res.status(400).json({ message: 'userIdが必要です。' });

    if (deleteUser) {
      await db.query('DELETE FROM users WHERE id=$1', [userId]);
      return res.json({ message: 'ユーザー削除完了' });
    }

    if (typeof balance === 'number') {
      await db.query('UPDATE users SET balance=$1 WHERE id=$2', [balance, userId]);
      return res.json({ message: '残高更新完了' });
    }

    res.status(400).json({ message: 'balanceかdeleteUserを指定してください。' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '管理者操作エラー' });
  }
}

// workボタン処理（1時間に1回、200〜5000円をランダム付与）
async function work(req, res) {
  try {
    const user = await userModel.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません' });

    const lastWorkRes = await db.query('SELECT last_work FROM users WHERE id=$1', [user.id]);
    const lastWork = lastWorkRes.rows[0].last_work;

    const now = new Date();
    if (lastWork && (now - new Date(lastWork)) < 1000 * 60 * 60) {
      return res.status(429).json({ message: '1時間に1回のみです。' });
    }

    const gain = Math.floor(Math.random() * (5000 - 200 + 1)) + 200;
    const newBalance = Number(user.balance) + gain;

    await db.query('UPDATE users SET balance=$1, last_work=$2 WHERE id=$3', [newBalance, now, user.id]);

    res.json({ gain, newBalance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'work処理エラー' });
  }
}

module.exports = {
  getUserInfo,
  updateBalance,
  adminUpdateUser,
  work,
};
