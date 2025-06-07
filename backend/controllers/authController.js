const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtil');

async function register(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'パスワードは6文字以上必要です。' });
    }
    const { id, username } = await userModel.createUserWithRandomUsername(password);
    const user = await userModel.getUserById(id);
    const token = generateToken(user);
    res.json({ id, username, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '登録中にエラーが発生しました。' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'ユーザーネームとパスワードが必要です。' });
    }
    const user = await userModel.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'ユーザーが見つかりません。' });

    const valid = await userModel.verifyPassword(user, password);
    if (!valid) return res.status(401).json({ message: 'パスワードが違います。' });

    const token = generateToken(user);
    res.json({ token, id: user.id, username: user.username, is_admin: user.is_admin });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'ログイン中にエラーが発生しました。' });
  }
}

module.exports = { register, login };
