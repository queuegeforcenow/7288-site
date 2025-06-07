const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function generateToken(user) {
  // 管理者かどうかもトークンに含める
  const payload = {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
