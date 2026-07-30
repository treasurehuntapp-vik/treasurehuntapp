import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// ============================================================
// LISTA NOTIFICHE
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 50, offset = 0, unread_only = false } = req.query;

        const where = { user_id: req.user.id };
        if (unread_only === 'true') {
            where.read = false;
        }

        const notifications = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                total: notifications.count,
                limit: parseInt(limit),
                offset: parseInt(offset),
                notifications: notifications.rows
            }
        });

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle notifiche'
        });
    }
});

// ============================================================
// SEGNA NOTIFICA COME LETTA
// ============================================================
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notifica non trovata'
            });
        }

        if (notification.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per modificare questa notifica'
            });
        }

        notification.read = true;
        notification.read_at = new Date();
        await notification.save();

        res.json({
            success: true,
            message: 'Notifica segnata come letta',
            data: notification
        });

    } catch (error) {
        console.error('Read notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento della notifica'
        });
    }
});

// ============================================================
// SEGNA TUTTE COME LETTE
// ============================================================
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.update(
            { read: true, read_at: new Date() },
            { where: { user_id: req.user.id, read: false } }
        );

        res.json({
            success: true,
            message: 'Tutte le notifiche segnate come lette'
        });

    } catch (error) {
        console.error('Read all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento delle notifiche'
        });
    }
});

// ============================================================
// CONTEGGIO NOTIFICHE NON LETTE
// ============================================================
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                user_id: req.user.id,
                read: false
            }
        });

        res.json({
            success: true,
            data: { unread_count: count }
        });

    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel conteggio delle notifiche'
        });
    }
});

// ============================================================
// ELIMINA NOTIFICA
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notifica non trovata'
            });
        }

        if (notification.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per eliminare questa notifica'
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: 'Notifica eliminata con successo'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'eliminazione della notifica'
        });
    }
});

export default router;