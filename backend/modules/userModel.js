const db = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

async function createUserWithRandomUsername(password) {
  const username = generateRandomUsername();
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  await db.query(
    `INSERT INTO users (id, username, password_hash, balance, total_bet, rank, is_admin)
     VALUES ($1, $2, $3, 0, 0, 'なし', false)`,
    [id, username, password_hash]
  );
  return { id, username };
}

async function getUserByUsername(username) {
  const res = await db.query('SELECT * FROM users WHERE username=$1', [username]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0];
}

async function updateUserRankAndBalance(id, rank, balance, total_bet) {
  await db.query(
    'UPDATE users SET rank=$1, balance=$2, total_bet=$3 WHERE id=$4',
    [rank, balance, total_bet, id]
  );
}

async function verifyPassword(user, password) {
  return await bcrypt.compare(password, user.password_hash);
}

function generateRandomUsername() {
  // ランダムな8文字英数字を生成
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let str = '';
  for (let i = 0; i < 8; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

module.exports = {
  createUserWithRandomUsername,
  getUserByUsername,
  getUserById,
  updateUserRankAndBalance,
  verifyPassword,
};
