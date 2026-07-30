 import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { Report } from '../models/Report.js';
import { Treasure } from '../models/Treasure.js';

const router = express.Router();

// ============================================================
// LISTA SEGNALAZIONI (solo per admin)
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (!['master', 'legend'].includes(req.user.trust_level)) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per visualizzare le segnalazioni'
            });
        }

        const reports = await Report.findAll({
            where: { status: 'pending' },
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: reports
        });

    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle segnalazioni'
        });
    }
});

// ============================================================
// REVISIONE SEGNALAZIONE (solo admin)
// ============================================================
router.patch('/:id/review', authMiddleware, async (req, res) => {
    try {
        const { status, admin_notes } = req.body;

        if (!['master', 'legend'].includes(req.user.trust_level)) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per revisionare le segnalazioni'
            });
        }

        const report = await Report.findByPk(req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Segnalazione non trovata'
            });
        }

        report.status = status || report.status;
        report.admin_notes = admin_notes || report.admin_notes;
        report.reviewed_at = new Date();
        report.reviewed_by = req.user.id;

        await report.save();

        if (status === 'action_taken') {
            const treasure = await Treasure.findByPk(report.treasure_id);
            if (treasure) {
                treasure.status = 'removed';
                await treasure.save();
            }
        }

        res.json({
            success: true,
            message: 'Segnalazione revisionata con successo',
            data: report
        });

    } catch (error) {
        console.error('Review report error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella revisione della segnalazione'
        });
    }
});

export default router;
