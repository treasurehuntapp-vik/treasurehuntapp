const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Treasure = sequelize.define('Treasure', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    clue: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    photo_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'found', 'reported', 'removed', 'relic'),
        defaultValue: 'active'
    },
    found_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    becomes_relic_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_relic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    karma_value: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    approved_by: {
        type: DataTypes.UUID,
        allowNull: true
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    find_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    report_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'treasures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Metodo per calcolare la distanza da una posizione
Treasure.prototype.getDistanceFrom = function(lat, lng) {
    const R = 6371e3;
    const φ1 = this.latitude * Math.PI / 180;
    const φ2 = lat * Math.PI / 180;
    const Δφ = (lat - this.latitude) * Math.PI / 180;
    const Δλ = (lng - this.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

// Metodo per determinare se è una Reliquia
Treasure.prototype.checkRelicStatus = function() {
    if (this.status !== 'active') return false;
    if (!this.created_at) return false;
    
    const daysOld = (Date.now() - new Date(this.created_at).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysOld >= 30 && !this.is_relic) {
        this.is_relic = true;
        this.status = 'relic';
        this.karma_value = 30; // Karma x3
        return true;
    }
    return false;
};

module.exports = { Treasure };
