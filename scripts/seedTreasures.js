import { sequelize } from '../src/config/database.js';
import { Treasure } from '../src/models/Treasure.js';
import { User } from '../src/models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/seedTreasures.json'), 'utf8')
);

async function seedTreasures() {
    try {
        console.log('🌱 Avvio seed tesori starter...');

        let creator = await User.findOne({ where: { trust_level: 'legend' } });
        if (!creator) {
            creator = await User.findOne({ where: { trust_level: 'master' } });
        }
        if (!creator) {
            console.log('❌ Nessun utente Legend o Master trovato.');
            console.log('ℹ️  Crea prima un utente e impostalo come "legend" o "master".');
            return;
        }

        console.log(`👤 Creatore: ${creator.email} (${creator.trust_level})`);

        let totalCreated = 0;

        for (const [city, treasures] of Object.entries(seedData)) {
            console.log(`📍 Città: ${city}`);

            for (const treasure of treasures) {
                const existing = await Treasure.findOne({
                    where: {
                        title: treasure.title,
                        latitude: treasure.latitude,
                        longitude: treasure.longitude
                    }
                });

                if (existing) {
                    console.log(`  ⏭️ Già esistente: ${treasure.title}`);
                    continue;
                }

                await Treasure.create({
                    user_id: creator.id,
                    title: treasure.title,
                    clue: treasure.clue,
                    category: treasure.category,
                    latitude: treasure.latitude,
                    longitude: treasure.longitude,
                    address: treasure.address || treasure.title,
                    status: 'active',
                    approved: true,
                    karma_value: 10,
                    is_starter: true
                });

                console.log(`  ✅ Creato: ${treasure.title}`);
                totalCreated++;
            }
        }

        console.log(`🎉 Seed completato! Creati ${totalCreated} tesori starter.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Errore durante il seed:', error);
        process.exit(1);
    }
}

seedTreasures();