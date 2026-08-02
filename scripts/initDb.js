import { sequelize } from '../src/config/database.js';

console.log('🔄 Connessione al database...');

try {
    await sequelize.authenticate();
    console.log('✅ Database connesso');
    
    // 🔥 MODIFICATO: alter: true invece di force: true
    console.log('🔄 Sincronizzazione tabelle...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelle sincronizzate (dati preservati)');
    
    process.exit(0);
} catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
}