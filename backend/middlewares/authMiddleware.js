const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '認証ヘッダーがありません。' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'トークンがありません。' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // id, username, is_admin
    next();
  } catch (e) {
    return res.status(401).json({ message: 'トークンが無効です。' });
  }
}

function adminOnlyMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: '管理者権限が必要です。' });
  }
  next();
}

module.exports = { authMiddleware, adminOnlyMiddleware };
