const express = require('express');
const { startGame, hit, stand } = require('../controllers/blackjackController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/start', authMiddleware, startGame);
router.post('/hit', authMiddleware, hit);
router.post('/stand', authMiddleware, stand);

module.exports = router;
