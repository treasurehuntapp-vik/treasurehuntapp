const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true
    },
    trust_level: {
        type: DataTypes.ENUM('explorer', 'hunter', 'master', 'legend'),
        defaultValue: 'explorer'
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    spid_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    karma: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    treasures_found: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    treasures_hidden: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_active: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(50),
        defaultValue: 'Italy'
    },
    device_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ban_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Metodo per hashing password
User.prototype.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(password, salt);
};

// Metodo per verificare password
User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Metodo per calcolare il prossimo livello
User.prototype.getNextLevelProgress = function() {
    const levels = {
        explorer: { min: 0, max: 500, label: 'Esploratore' },
        hunter: { min: 500, max: 2000, label: 'Cacciatore' },
        master: { min: 2000, max: 5000, label: 'Maestro' },
        legend: { min: 5000, max: Infinity, label: 'Leggenda' }
    };

    // Determina livello attuale
    let currentLevel = 'explorer';
    for (const [level, data] of Object.entries(levels)) {
        if (this.karma >= data.min) {
            currentLevel = level;
        }
    }

    const current = levels[currentLevel];
    const nextLevel = Object.keys(levels)[Object.keys(levels).indexOf(currentLevel) + 1];
    const next = nextLevel ? levels[nextLevel] : null;

    return {
        current: currentLevel,
        currentLabel: current.label,
        karma: this.karma,
        progress: next ? ((this.karma - current.min) / (next.min - current.min)) * 100 : 100,
        nextLevel: next ? next.label : 'Massimo',
        nextKarmaNeeded: next ? next.min - this.karma : 0
    };
};

module.exports = { User };
