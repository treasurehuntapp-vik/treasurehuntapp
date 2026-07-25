const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { KarmaTransaction } = require('../models/KarmaTransaction');
const { User } = require('../models/User');
const router = express.Router();

// ============================================================
// STORICO KARMA
// ============================================================
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const transactions = await KarmaTransaction.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                total: transactions.count,
                limit: parseInt(limit),
                offset: parseInt(offset),
                transactions: transactions.rows
            }
        });

    } catch (error) {
        console.error('Karma history error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dello storico karma'
        });
    }
});

// ============================================================
// CLASSIFICA (Top utenti per karma)
// ============================================================
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 20, city } = req.query;

        const where = {};
        if (city) where.city = city;

        const users = await User.findAll({
            attributes: ['id', 'name', 'karma', 'city', 'treasures_found'],
            where,
            order: [['karma', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero della classifica'
        });
    }
});

module.exports = router;
