require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const treasureRoutes = require('./src/routes/treasures');
const userRoutes = require('./src/routes/users');
const karmaRoutes = require('./src/routes/karma');
const reportRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Caccia al Tesoro API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/treasures', treasureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/karma', karmaRoutes);
app.use('/api/reports', reportRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Errore interno del server'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Sincronizza database
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
});
