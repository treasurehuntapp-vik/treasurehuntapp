import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Treasure } from '../models/Treasure.js';
import { Op } from 'sequelize';

// ============================================================
// CREA UNA NOTIFICA
// ============================================================
export async function createNotification(userId, type, title, body, data = null) {
    try {
        const notification = await Notification.create({
            user_id: userId,
            type,
            title,
            body,
            data,
            delivered: false
        });
        return notification;
    } catch (error) {
        console.error('❌ Errore creazione notifica:', error);
        return null;
    }
}

// ============================================================
// NOTIFICA: TESORO DIVENTATO CALDO
// ============================================================
export async function notifyTreasureWarm(treasure) {
    const user = await User.findByPk(treasure.user_id);
    if (!user) return;

    const title = '🔥 Il tuo tesoro è diventato "Caldo"!';
    const body = `Il tesoro "${treasure.title}" è attivo da 14 giorni! Ora vale Karma x2. Qualcuno lo troverà?`;
    const data = { treasure_id: treasure.id, type: 'warm' };

    await createNotification(user.id, 'treasure_warm', title, body, data);
    
    await notifyNearbyUsers(treasure, '🔥 Tesoro "Caldo" nelle vicinanze!', 
        `Un tesoro "${treasure.title}" è diventato "Caldo" e vale Karma x2!`, 'nearby_treasure', 5000);
}

// ============================================================
// NOTIFICA: TESORO DIVENTATO RELIQUIA
// ============================================================
export async function notifyTreasureRelic(treasure) {
    const user = await User.findByPk(treasure.user_id);
    if (!user) return;

    const title = '⚡ Il tuo tesoro è diventato una RELIQUIA!';
    const body = `Il tesoro "${treasure.title}" è attivo da 30 giorni! Ora vale Karma x3. È una leggenda!`;
    const data = { treasure_id: treasure.id, type: 'relic' };

    await createNotification(user.id, 'treasure_relic', title, body, data);
    
    await notifyNearbyUsers(treasure, '⚡ RELIQUIA nelle vicinanze!', 
        `Una Reliquia "${treasure.title}" aspetta di essere trovata! Karma x3!`, 'nearby_treasure', 10000);
}

// ============================================================
// NOTIFICA: TESORO TROVATO
// ============================================================
export async function notifyTreasureFound(treasure, finder) {
    // Notifica al proprietario
    const owner = await User.findByPk(treasure.user_id);
    if (owner && owner.id !== finder.id) {
        const title = '🎉 Il tuo tesoro è stato trovato!';
        const body = `${finder.name || 'Un utente'} ha trovato "${treasure.title}"! Hai guadagnato +5 Karma.`;
        const data = { treasure_id: treasure.id, finder_id: finder.id };
        await createNotification(owner.id, 'treasure_found', title, body, data);
    }

    // Notifica al cercatore
    const title = '🎉 Hai trovato un tesoro!';
    const body = `Hai trovato "${treasure.title}" e guadagnato +${treasure.karma_value || 10} Karma!`;
    const data = { treasure_id: treasure.id, karma: treasure.karma_value || 10 };
    await createNotification(finder.id, 'treasure_found', title, body, data);
}

// ============================================================
// NOTIFICA: NUOVO TESORO NELLE VICINANZE
// ============================================================
export async function notifyNearbyUsers(treasure, title, body, type = 'nearby_treasure', radius = 5000) {
    // Per ora, notifica tutti gli utenti (semplificato)
    // In futuro, filtra per distanza usando le coordinate
    const users = await User.findAll({
        where: {
            id: { [Op.ne]: treasure.user_id },
            is_banned: false
        },
        limit: 20
    });

    for (const user of users) {
        await createNotification(user.id, type, title, body, { treasure_id: treasure.id });
    }
}

// ============================================================
// CALCOLA DISTANZA (utile per futuro)
// ============================================================
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}