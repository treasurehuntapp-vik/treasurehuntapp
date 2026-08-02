import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sequelize } from './src/config/database.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import treasureRoutes from './src/routes/treasures.js';
import userRoutes from './src/routes/users.js';
import karmaRoutes from './src/routes/karma.js';
import reportRoutes from './src/routes/reports.js';
import notificationRoutes from './src/routes/notifications.js';

// Configura __dirname per ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// 🔥 MIDDLEWARE - CON LIMITE AUMENTATO A 50MB
// ============================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servi i file statici dalla cartella "public" (se esiste)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ROUTE PER LA HOME (risponde a / )
// ============================================================
app.get('/', (req, res) => {
    res.send('🎉 Caccia al Tesoro API è online!');
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Caccia al Tesoro API' });
});

// ============================================================
// ROTTA /api CON DOCUMENTAZIONE
// ============================================================
app.get('/api', (req, res) => {
    res.json({
        nome: 'Caccia al Tesoro API',
        versione: '1.0.0',
        status: 'online',
        documentazione: '/api/docs',
        health: '/api/health',
        endpoints: {
            auth: {
                registrazione: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            },
            users: {
                profilo: 'GET /api/users/:id',
                tutti: 'GET /api/users'
            },
            treasures: {
                lista: 'GET /api/treasures',
                crea: 'POST /api/treasures',
                dettaglio: 'GET /api/treasures/:id'
            },
            karma: {
                punteggio: 'GET /api/karma/:userId',
                aggiorna: 'POST /api/karma'
            },
            reports: {
                crea: 'POST /api/reports',
                lista: 'GET /api/reports'
            },
            notifications: {
                lista: 'GET /api/notifications',
                segnaLetta: 'PUT /api/notifications/:id'
            }
        }
    });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/treasures', treasureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/karma', karmaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Errore interno del server'
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
 
        // Sincronizzazione con alter:true per preservare i dati
        await sequelize.sync({ alter: true });
        console.log('✅ Tabelle sincronizzate (dati preservati)');

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
});