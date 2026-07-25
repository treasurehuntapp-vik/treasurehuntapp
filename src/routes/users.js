const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User } = require('../models/User');
const { Treasure } = require('../models/Treasure');
const { KarmaTransaction } = require('../models/KarmaTransaction');
const router = express.Router();

// ============================================================
// PROFILO UTENTE (dati personali)
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

        // Aggiungi progresso livello
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

        // Aggiorna solo i campi forniti
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
        const [treasuresFound, treasuresHidden, reports] = await Promise.all([
            Treasure.count({
                where: {
                    status: 'found',
                    user_id: req.user.id
                }
            }),
            Treasure.count({
                where: {
                    user_id: req.user.id,
                    status: ['active', 'relic', 'found']
                }
            }),
            // Report inviati dall'utente
            // (assumendo che Report esista)
        ]);

        // Karma transactions recenti
        const recentTransactions = await KarmaTransaction.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 20
        });

        const user = req.user;
        const levelProgress = user.getNextLevelProgress();

        res.json({
            success: true,
            data: {
                karma: user.karma,
                treasures_found: user.treasures_found,
                treasures_hidden: user.treasures_hidden,
                streak_days: user.streak_days,
                level: levelProgress,
                recent_transactions: recentTransactions
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

module.exports = router;
