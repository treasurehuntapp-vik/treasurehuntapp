 import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const KarmaTransaction = sequelize.define('KarmaTransaction', {
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
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notZero(value) {
                if (value === 0) {
                    throw new Error('L\'importo non può essere zero');
                }
            }
        }
    },
    reason: {
        type: DataTypes.ENUM('find_treasure', 'hide_treasure', 'report_resolved', 'relic_found', 'daily_streak', 'admin_bonus', 'penalty'),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'karma_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

export { KarmaTransaction };
