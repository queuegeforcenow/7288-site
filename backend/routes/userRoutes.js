const db = require('../db');

async function getUserById(id) {
  const res = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0];
}

async function getUserByUsername(username) {
  const res = await db.query('SELECT * FROM users WHERE username=$1', [username]);
  return res.rows[0];
}

async function createUser(username, passwordHash, isAdmin = false) {
  const res = await db.query(
    'INSERT INTO users (username, password_hash, is_admin, balance, total_bet, rank) VALUES ($1, $2, $3, 0, 0, $4) RETURNING *',
    [username, passwordHash, isAdmin, 'なし']
  );
  return res.rows[0];
}

async function updateUserRankAndBalance(userId, rank, balance, totalBet) {
  await db.query(
    'UPDATE users SET rank=$1, balance=$2, total_bet=$3 WHERE id=$4',
    [rank, balance, totalBet, userId]
  );
}

module.exports = {
  getUserById,
  getUserByUsername,
  createUser,
  updateUserRankAndBalance,
};
