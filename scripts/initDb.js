import { sequelize } from '../src/config/database.js';
import '../src/models/User.js';
import '../src/models/Treasure.js';
import '../src/models/Report.js';
import '../src/models/Notification.js';
import '../src/models/KarmaTransaction.js';

async function initDatabase() {
    try {
        console.log('🔄 Connessione al database...');
        await sequelize.authenticate();
        console.log('✅ Database connesso');

        console.log('🔄 Creazione tabelle (force: true)...');
        await sequelize.sync({ force: true });
        console.log('✅ Tabelle create con successo!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

initDatabase();
console.log('✅ Forzato deploy su Render');