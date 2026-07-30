const { Treasure } = require('../models/Treasure');
const { User } = require('../models/User');
const { KarmaTransaction } = require('../models/KarmaTransaction');
const { Report } = require('../models/Report');

// ============================================================
// LISTA TESORI VICINI
// ============================================================
const getNearby = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitudine e longitudine obbligatorie'
            });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        const treasures = await Treasure.findAll({
            where: {
                status: ['active', 'relic'],
                approved: true
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'trust_level']
            }],
            limit: 100
        });

        const results = treasures
            .map(t => {
                const distance = t.getDistanceFrom(latNum, lngNum);
                return {
                    ...t.toJSON(),
                    distance,
                    level: t.is_relic ? 'relic' :
                           t.created_at && (Date.now() - new Date(t.created_at).getTime()) > 14 * 24 * 60 * 60 * 1000
                               ? 'warm' : 'normal'
                };
            })
            .filter(t => t.distance <= parseFloat(radius))
            .sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Nearby error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei tesori'
        });
    }
};

// ============================================================
// DETTAGLIO TESORO
// ============================================================
const getById = async (req, res) => {
    try {
        const treasure = await Treasure.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'trust_level']
            }]
        });

        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Tesoro non trovato'
            });
        }

        res.json({
            success: true,
            data: treasure
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del tesoro'
        });
    }
};

// ============================================================
// CREA TESORO
// ============================================================
const create = async (req, res) => {
    try {
        const { title, clue, category, photo_url, latitude, longitude, address } = req.body;

        // Verifica livello di fiducia
        const user = req.user;
        const allowedToHide = ['hunter', 'master', 'legend'].includes(user.trust_level);

        if (!allowedToHide) {
            return res.status(403).json({
                success: false,
                message: 'Devi essere almeno "Cacciatore" per nascondere un tesoro'
            });
        }

        // Limite tesori attivi
        const activeTreasures = await Treasure.count({
            where: {
                user_id: user.id,
                status: ['active', 'relic']
            }
        });

        const maxTreasures = user.trust_level === 'legend' ? 10 :
                             user.trust_level === 'master' ? 5 : 3;

        if (activeTreasures >= maxTreasures) {
            return res.status(403).json({
                success: false,
                message: `Hai raggiunto il limite di ${maxTreasures} tesori attivi`
            });
        }

        const treasure = await Treasure.create({
            user_id: user.id,
            title,
            clue,
            category: category || 'altro',
            photo_url: photo_url || null,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address: address || null,
            karma_value: 10,
            approved: user.trust_level === 'legend'
        });

        user.treasures_hidden = user.treasures_hidden + 1;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Tesoro creato con successo! In attesa di approvazione.',
            data: treasure
        });

    } catch (error) {
        console.error('Create treasure error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella creazione del tesoro'
        });
    }
};

// ============================================================
// TROVA TESORO
// ============================================================
const findTreasure = async (req, res) => {
    try {
        const treasure = await Treasure.findByPk(req.params.id);
        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Tesoro non trovato'
            });
        }

        if (treasure.status === 'found') {
            return res.status(400).json({
                success: false,
                message: 'Questo tesoro è già stato trovato'
            });
        }

        const { lat, lng } = req.query;
        if (lat && lng) {
            const distance = treasure.getDistanceFrom(parseFloat(lat), parseFloat(lng));
            if (distance > 100) {
                return res.status(400).json({
                    success: false,
                    message: `Sei troppo lontano (${distance}m). Avvicinati a meno di 100m.`
                });
            }
        }

        treasure.status = 'found';
        treasure.found_at = new Date();
        treasure.find_count = treasure.find_count + 1;

        const karmaEarned = treasure.is_relic ? 30 : 10;
        await treasure.save();

        await KarmaTransaction.create({
            user_id: req.user.id,
            amount: karmaEarned,
            reason: 'find_treasure',
            reference_id: treasure.id,
            description: `Tesoro trovato: "${treasure.title}"`
        });

        // Aggiorna karma utente
        const user = req.user;
        user.karma = user.karma + karmaEarned;
        user.treasures_found = user.treasures_found + 1;
        await user.save();

        res.json({
            success: true,
            message: `🎉 Tesoro trovato! +${karmaEarned} Karma`,
            data: { karma_earned: karmaEarned }
        });

    } catch (error) {
        console.error('Find treasure error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la scoperta del tesoro'
        });
    }
};

// ============================================================
// SEGNALA PERICOLO
// ============================================================
const reportTreasure = async (req, res) => {
    try {
        const { reason, description } = req.body;
        const treasure = await Treasure.findByPk(req.params.id);

        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Tesoro non trovato'
            });
        }

        await Report.create({
            treasure_id: treasure.id,
            reporter_id: req.user.id,
            reason: reason || 'altro',
            description: description || null
        });

        treasure.report_count = treasure.report_count + 1;

        if (treasure.report_count >= 2) {
            treasure.status = 'reported';
        }

        await treasure.save();

        res.json({
            success: true,
            message: 'Segnalazione inviata con successo. Un moderatore verificherà.'
        });

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la segnalazione'
        });
    }
};

exports {
    getNearby,
    getById,
    create,
    findTreasure,
    reportTreasure
};
