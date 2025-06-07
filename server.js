const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { register, login } = require('./controllers/authController');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/register', register);
app.post('/api/login', login);

// ヘルスチェック
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

// ここにゲームや管理者機能のルートを追加予定

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
