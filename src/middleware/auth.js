const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const authMiddleware = async (req, res, next) => {
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

        if (user.is_banned) {
            return res.status(403).json({
                success: false,
                message: 'Account bannato: ' + user.ban_reason
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token non valido'
        });
    }
};

module.exports = { authMiddleware };
