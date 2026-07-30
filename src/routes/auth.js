import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

// ============================================================
// REGISTRAZIONE
// ============================================================
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Tentativo di registrazione:', req.body);
        
        const { email, password, name, phone } = req.body;

        // Validazioni base
        if (!email || !password) {
            console.log('❌ Email o password mancanti');
            return res.status(400).json({
                success: false,
                message: 'Email e password sono obbligatori'
            });
        }

        if (password.length < 8) {
            console.log('❌ Password troppo corta');
            return res.status(400).json({
                success: false,
                message: 'La password deve essere di almeno 8 caratteri'
            });
        }

        // Verifica se esiste già
        console.log('🔍 Controllo utente esistente con email:', email);
        const existingUser = await User.findOne({ where: { email } });
        console.log('🔍 Utente esistente:', existingUser ? 'TROVATO' : 'NON TROVATO');

        if (existingUser) {
            console.log('❌ Email già registrata:', email);
            return res.status(400).json({
                success: false,
                message: 'Email già registrata'
            });
        }

        // Crea utente
        console.log('✅ Creazione nuovo utente...');
        const user = new User({
            email,
            name: name || email.split('@')[0],
            phone: phone || null
        });

        await user.hashPassword(password);
        await user.save();
        console.log('✅ Utente salvato con ID:', user.id);

        // Genera token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        const userData = user.toJSON();
        delete userData.password_hash;

        console.log('✅ Registrazione completata per:', email);
        res.status(201).json({
            success: true,
            message: 'Utente registrato con successo',
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('❌ ERRORE REGISTRAZIONE:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione: ' + error.message
        });
    }
});

// ============================================================
// LOGIN
// ============================================================
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 Tentativo di login:', req.body.email);
        
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('❌ Email o password mancanti');
            return res.status(400).json({
                success: false,
                message: 'Email e password sono obbligatori'
            });
        }

        const user = await User.findOne({ where: { email } });
        console.log('🔍 Utente trovato:', user ? 'SI' : 'NO');

        if (!user) {
            console.log('❌ Utente non trovato:', email);
            return res.status(401).json({
                success: false,
                message: 'Email o password non validi'
            });
        }

        const isValid = await user.comparePassword(password);
        console.log('🔐 Password valida:', isValid ? 'SI' : 'NO');

        if (!isValid) {
            console.log('❌ Password errata per:', email);
            return res.status(401).json({
                success: false,
                message: 'Email o password non validi'
            });
        }

        user.last_active = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        const userData = user.toJSON();
        delete userData.password_hash;

        console.log('✅ Login effettuato per:', email);
        res.json({
            success: true,
            data: {
                user: userData,
                token
            }
        });

    } catch (error) {
        console.error('❌ ERRORE LOGIN:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il login: ' + error.message
        });
    }
});

// ============================================================
// VERIFICA TOKEN
// ============================================================
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('🔍 Verifica token:', token ? 'presente' : 'assente');
        
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

        console.log('✅ Token valido per:', user.email);
        res.json({
            success: true,
            data: { user: userData }
        });

    } catch (error) {
        console.error('❌ ERRORE VERIFICA TOKEN:', error);
        res.status(401).json({
            success: false,
            message: 'Token non valido'
        });
    }
});

export default router;