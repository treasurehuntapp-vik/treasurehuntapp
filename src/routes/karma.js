 import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

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

export default router;