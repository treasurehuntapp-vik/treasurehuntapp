import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { Treasure } from '../models/Treasure.js';
import { User } from '../models/User.js';
// 🔥 NUOVI IMPORT PER I TESORI STARTER AUTOMATICI
import { getCityLandmarks, getCityFromCoordinates } from '../utils/osm.js';
import { generateClue, generateTitle } from '../utils/clueGenerator.js';

const router = express.Router();

// ============================================================
// LISTA TESORI VICINI
// ============================================================
router.get('/nearby', authMiddleware, async (req, res) => {
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
            limit: 100
        });

        const results = treasures
            .map(t => {
                const distance = t.getDistanceFrom(latNum, lngNum);
                const level = t.getLevel();
                return {
                    ...t.toJSON(),
                    distance,
                    level: level,
                    karma_bonus: level === 'relic' ? 30 : level === 'warm' ? 20 : 10
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
});

// ============================================================
// RESET TESORI SEGNALATI (temporaneo, solo per test)
// ============================================================
router.get('/reported/reset', authMiddleware, async (req, res) => {
    try {
        const [count] = await Treasure.update(
            { status: 'active', report_count: 0 },
            { where: { status: 'reported' } }
        );

        res.json({
            success: true,
            message: `${count} tesori ripristinati come attivi`
        });

    } catch (error) {
        console.error('❌ Errore reset segnalati:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
// LISTA TESORI SEGNALATI (per moderazione)
// ============================================================
router.get('/reported/list', authMiddleware, async (req, res) => {
    try {
        const reportedTreasures = await Treasure.findAll({
            where: {
                status: 'reported'
            },
            order: [['updated_at', 'DESC']]
        });

        res.json({
            success: true,
            count: reportedTreasures.length,
            data: reportedTreasures
        });

    } catch (error) {
        console.error('❌ Errore lista segnalati:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei tesori segnalati'
        });
    }
});

// ============================================================
// DETTAGLIO TESORO
// ============================================================
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const treasure = await Treasure.findByPk(req.params.id);

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
});

// ============================================================
// CREA TESORO
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('========================================');
        console.log('📦 RICEVUTA RICHIESTA CREAZIONE TESORO');
        console.log('========================================');
       
        const user = req.user;
        console.log('👤 Utente email:', user ? user.email : 'NON AUTENTICATO');
        console.log('📊 trust_level:', user ? user.trust_level : 'N/A');
        console.log('📊 treasures_found:', user ? user.treasures_found : 'N/A');
        console.log('📊 karma:', user ? user.karma : 'N/A');

        const { title, clue, category, photo_url, latitude, longitude, address } = req.body;
        console.log('📝 Titolo:', title);
        console.log('📝 Indizio:', clue);
        console.log('📝 Categoria:', category);

        // ============================================================
        // VERIFICA LIVELLO DI FIDUCIA
        // ============================================================
        const allowedToHide = ['hunter', 'master', 'legend'].includes(user.trust_level);
        console.log('✅ allowedToHide:', allowedToHide);

        if (!allowedToHide) {
            console.log('❌ UTENTE NON AUTORIZZATO! trust_level:', user.trust_level);
            return res.status(403).json({
                success: false,
                message: `Devi essere almeno "Cacciatore" per nascondere un tesoro. Attuale: ${user.trust_level}, tesori trovati: ${user.treasures_found}/5`,
                required: 5,
                current: user.treasures_found
            });
        }

        // ============================================================
        // CONTROLLO TESORI ATTIVI
        // ============================================================
        const activeTreasures = await Treasure.count({
            where: {
                user_id: user.id,
                status: ['active', 'relic']
            }
        });
        console.log('📊 Tesori attivi:', activeTreasures);

        const maxTreasures = user.trust_level === 'legend' ? 10 :
                             user.trust_level === 'master' ? 5 : 3;
        console.log('📊 Max tesori consentiti:', maxTreasures);

        if (activeTreasures >= maxTreasures) {
            console.log('❌ LIMITE RAGGIUNTO!');
            return res.status(403).json({
                success: false,
                message: `Hai raggiunto il limite di ${maxTreasures} tesori attivi.`,
                active: activeTreasures,
                max: maxTreasures
            });
        }

        // ============================================================
        // CREA IL TESORO
        // ============================================================
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

        // Aggiorna contatore utente
        user.treasures_hidden = (user.treasures_hidden || 0) + 1;
        await user.save();

        console.log('✅ TESORO CREATO CON SUCCESSO! ID:', treasure.id);
        console.log('========================================\n');

        res.status(201).json({
            success: true,
            message: 'Tesoro creato con successo! In attesa di approvazione.',
            data: treasure
        });

    } catch (error) {
        console.error('❌ ERRORE CREAZIONE TESORO:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la creazione del tesoro',
            error: error.message
        });
    }
});

// ============================================================
// SEGNALA TESORO COME TROVATO
// ============================================================
router.post('/:id/find', authMiddleware, async (req, res) => {
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
        treasure.found_by = req.user.id;
        treasure.find_count = treasure.find_count + 1;

        const karmaEarned = treasure.karma_value || 10;
        await treasure.save();

        const user = req.user;
        user.karma = (user.karma || 0) + karmaEarned;
        user.treasures_found = (user.treasures_found || 0) + 1;
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
});

// ============================================================
// SEGNALA PERICOLO
// ============================================================
router.post('/:id/report', authMiddleware, async (req, res) => {
    try {
        const { reason, description } = req.body;
        const treasure = await Treasure.findByPk(req.params.id);

        if (!treasure) {
            return res.status(404).json({
                success: false,
                message: 'Tesoro non trovato'
            });
        }

        treasure.report_count = (treasure.report_count || 0) + 1;

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
});

// ============================================================
// 🆕 GENERA TESORI STARTER PER UNA NUOVA CITTÀ
// ============================================================
router.get('/starter/generate', authMiddleware, async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitudine e longitudine obbligatorie'
            });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        // 1. Ottieni il nome della città
        const city = await getCityFromCoordinates(latNum, lngNum);
        console.log(`📍 Generazione tesori starter per: ${city}`);

        // 2. Controlla se esistono già tesori starter per questa città
        const existingStarters = await Treasure.count({
            where: {
                is_starter: true,
                address: city
            }
        });

        if (existingStarters > 0) {
            console.log(`ℹ️  Già presenti ${existingStarters} tesori starter per ${city}`);
            const starters = await Treasure.findAll({
                where: {
                    is_starter: true,
                    address: city
                }
            });
            return res.json({
                success: true,
                message: `Tesori starter già presenti (${existingStarters})`,
                data: starters
            });
        }

        // 3. Ottieni i luoghi iconici da OpenStreetMap
        const landmarks = await getCityLandmarks(latNum, lngNum);
       
        if (landmarks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nessun luogo iconico trovato per questa città'
            });
        }

        // 4. Genera i tesori starter
        const createdTreasures = [];
        const user = req.user;

        // Prendi massimo 5 luoghi
        const selectedLandmarks = landmarks.slice(0, 5);

        for (const landmark of selectedLandmarks) {
            // 🔥 FIX: Migliora il nome del landmark se è un placeholder
            let landmarkName = landmark.name || '';
           
            // Se il nome è un placeholder o vuoto, generane uno migliore
            if (!landmarkName ||
                landmarkName.includes('Punto di Interesse') ||
                landmarkName === 'default' ||
                landmarkName.length < 3) {
               
                const typeNames = {
                    'castle': 'Castello Antico',
                    'park': 'Parco della Città',
                    'museum': 'Museo Civico',
                    'tourism': 'Attrazione Locale',
                    'place_of_worship': 'Chiesa Storica',
                    'default': 'Tesoro Nascosto'
                };
               
                const typeName = typeNames[landmark.type] || 'Tesoro Nascosto';
                const cityName = city || 'della tua città';
                landmarkName = `${typeName} di ${cityName}`;
               
                // Aggiungi un numero per differenziare
                const index = selectedLandmarks.indexOf(landmark) + 1;
                if (selectedLandmarks.length > 1) {
                    landmarkName = `${landmarkName} (${index})`;
                }
            }
           
            // Usa il nome migliorato
            const improvedLandmark = {
                ...landmark,
                name: landmarkName
            };

            const title = generateTitle(improvedLandmark);
            const clue = generateClue(improvedLandmark);

            const treasure = await Treasure.create({
                user_id: user.id,
                title: title,
                clue: clue,
                category: landmark.category || 'altro',
                latitude: landmark.lat,
                longitude: landmark.lon,
                address: city,
                status: 'active',
                approved: true,
                karma_value: 10,
                is_starter: true
            });

            createdTreasures.push(treasure);
            console.log(`  ✅ Creato: ${title} (${landmark.type || 'generico'})`);
        }

        console.log(`🎉 Creati ${createdTreasures.length} tesori starter per ${city}`);

        res.json({
            success: true,
            message: `Creati ${createdTreasures.length} tesori starter per ${city}`,
            data: createdTreasures
        });

    } catch (error) {
        console.error('❌ Errore generazione starter:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la generazione dei tesori starter'
        });
    }
});

export default router;