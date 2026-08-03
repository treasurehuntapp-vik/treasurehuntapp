 import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Treasure } from '../models/Treasure.js';

const router = express.Router();

// ============================================================
// PROFILO UTENTE
// ============================================================
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        const userData = user.toJSON();
        delete userData.password_hash;

        const levelProgress = user.getNextLevelProgress();

        res.json({
            success: true,
            data: {
                ...userData,
                levelProgress
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del profilo'
        });
    }
});

// ============================================================
// AGGIORNA PROFILO
// ============================================================
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, bio, city, avatar_url } = req.body;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        if (name) user.name = name;
        if (bio) user.bio = bio;
        if (city) user.city = city;
        if (avatar_url) user.avatar_url = avatar_url;

        await user.save();

        const userData = user.toJSON();
        delete userData.password_hash;

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo',
            data: userData
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del profilo'
        });
    }
});

// ============================================================
// STATISTICHE UTENTE
// ============================================================
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const levelProgress = user.getNextLevelProgress();

        res.json({
            success: true,
            data: {
                karma: user.karma,
                treasures_found: user.treasures_found,
                treasures_hidden: user.treasures_hidden,
                streak_days: user.streak_days,
                level: levelProgress
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche'
        });
    }
});

// ============================================================
// OTTIENI CRONOLOGIA TESORI DELL'UTENTE
// ============================================================
router.get('/treasure-history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Tesori trovati dall'utente
        const foundTreasures = await Treasure.findAll({
            where: {
                found_by: userId,
                status: 'found'
            },
            attributes: ['id', 'title', 'clue', 'created_at', 'status'],
            order: [['found_at', 'DESC']],
            limit: 20
        });

        // Tesori nascosti dall'utente
        const hiddenTreasures = await Treasure.findAll({
            where: {
                user_id: userId,
                status: ['active', 'relic']
            },
            attributes: ['id', 'title', 'clue', 'created_at', 'status'],
            order: [['created_at', 'DESC']],
            limit: 20
        });

        // Combina e ordina per data (più recente prima)
        const allTreasures = [...foundTreasures, ...hiddenTreasures]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 20);

        res.json({
            success: true,
            data: allTreasures
        });

    } catch (error) {
        console.error('❌ Errore cronologia tesori:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero della cronologia'
        });
    }
});

export default router;
