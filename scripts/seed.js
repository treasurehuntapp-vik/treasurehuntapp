// ============================================================
// SCRIPT DI POPOLAMENTO DATABASE (SEED)
// Esegui con: node scripts/seed.js
// ============================================================

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models/User');
const { Treasure } = require('../src/models/Treasure');

const seedUsers = [
    {
        email: 'marco@test.com',
        name: 'Marco C.',
        phone: '+39 123 456 7890',
        trust_level: 'hunter',
        karma: 1240,
        treasures_found: 7,
        treasures_hidden: 3,
        verified: true,
        city: 'Ivrea'
    },
    {
        email: 'elena@test.com',
        name: 'Elena R.',
        phone: '+39 987 654 3210',
        trust_level: 'master',
        karma: 3500,
        treasures_found: 25,
        treasures_hidden: 12,
        verified: true,
        spid_verified: true,
        city: 'Ivrea'
    },
    {
        email: 'luca@test.com',
        name: 'Luca B.',
        phone: '+39 456 789 1234',
        trust_level: 'explorer',
        karma: 150,
        treasures_found: 2,
        treasures_hidden: 0,
        verified: false,
        city: 'Torino'
    }
];

const seedTreasures = [
    {
        title: 'Il Quaderno Perduto',
        clue: '"Dove l\'acqua cantava e ora la pietra tace, cerca il tuo premio e trova la pace."',
        category: 'libro',
        latitude: 45.4675,
        longitude: 7.8828,
        address: 'Piazza Ottinetti, Ivrea',
        karma_value: 10,
        approved: true,
        status: 'active'
    },
    {
        title: 'Il Dado della Fortuna',
        clue: '"Tra i tavoli di legno e il profumo di caffè, un numero ti aspetta, se lo cercherai."',
        category: 'giocattolo',
        latitude: 45.4662,
        longitude: 7.8855,
        address: 'Corso Massimo d\'Azeglio 53, Ivrea',
        karma_value: 10,
        approved: true,
        status: 'active'
    },
    {
        title: 'L\'Orsetto Viaggiatore',
        clue: '"Sul muretto di un ponte, tra le nuvole e il sole, un amico ti aspetta."',
        category: 'giocattolo',
        latitude: 45.4688,
        longitude: 7.8848,
        address: 'Piazza Castello, Ivrea',
        karma_value: 10,
        approved: true,
        status: 'active'
    },
    {
        title: 'La Mappa del Tempo',
        clue: '"Tra i mattoni scarlatti dove il sole tramonta, c\'è un segreto che aspetta chi lo racconta."',
        category: 'souvenir',
        latitude: 45.4682,
        longitude: 7.8855,
        address: 'Via Jervis 1, Ivrea',
        karma_value: 20,
        approved: true,
        status: 'active'
    },
    {
        title: 'Il Diario di un Esploratore',
        clue: '"Nel cuore del bosco, dove il vento non arriva, un tesoro leggendario aspetta. Non toccato da 30 giorni."',
        category: 'libro',
        latitude: 45.4635,
        longitude: 7.8828,
        address: 'Parco della Polveriera, Ivrea',
        karma_value: 30,
        approved: true,
        status: 'relic',
        is_relic: true
    }
];

const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connesso');

        // Sincronizza tutti i modelli
        await sequelize.sync({ force: true });
        console.log('✅ Tabelle create');

        // Crea utenti
        const users = [];
        for (const userData of seedUsers) {
            const user = new User(userData);
            await user.hashPassword('password123');
            await user.save();
            users.push(user);
            console.log(`✅ Utente creato: ${user.email}`);
        }

        // Crea tesori (associa al primo utente)
        for (const treasureData of seedTreasures) {
            await Treasure.create({
                ...treasureData,
                user_id: users[0].id
            });
            console.log(`✅ Tesoro creato: ${treasureData.title}`);
        }

        console.log('\n🎉 Database popolato con successo!');
        console.log('\n📝 Credenziali utenti:');
        console.log('   Marco: marco@test.com / password123 (Hunter)');
        console.log('   Elena: elena@test.com / password123 (Master)');
        console.log('   Luca: luca@test.com / password123 (Explorer)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Errore durante il seeding:', error);
        process.exit(1);
    }
};

seedDatabase();
