const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const router = express.Router();

// ============================================================
// REGISTRAZIONE
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validazioni base
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e password sono obbligatori'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La password deve essere di almeno 8 caratteri'
            });
        }

        // Verifica se esiste già
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email già registrata'
            });
        }

        // Crea utente
        const user = new User({
            email,
            name: name || email.split('@')[0],
            phone: phone || null
        });

        await user.hashPassword(password);
        await user.save();

        // Genera token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Rimuovi password_hash dalla risposta
        const userData = user.toJSON();
        delete userData.password_hash;

        res.status(201).json({
            success: true,
            message: 'Utente registrato con successo',
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione'
        });
    }
});

// ============================================================
// LOGIN
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e password sono obbligatori'
            });
        }

        // Trova utente
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email o password non validi'
            });
        }

        // Verifica password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Email o password non validi'
            });
        }

        // Aggiorna ultimo accesso
        user.last_active = new Date();
        await user.save();

        // Genera token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        const userData = user.toJSON();
        delete userData.password_hash;

        res.json({
            success: true,
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il login'
        });
    }
});

// ============================================================
// VERIFICA TOKEN
// ============================================================
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token non fornito'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        const userData = user.toJSON();
        delete userData.password_hash;

        res.json({
            success: true,
            data: { user: userData }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token non valido'
        });
    }
});

module.exports = router;
