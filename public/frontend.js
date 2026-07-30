// ============================================================
// FRONTEND - Connessione al Backend
// ============================================================

// Configurazione
const API_URL = 'http://192.168.1.98:5000/api';
let currentToken = null;
let currentUser = null;

// ============================================================
// 1. REGISTRAZIONE
// ============================================================
async function registerUser(email, password, name) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name })
        });

        const data = await response.json();

        if (data.success) {
            currentToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showToast('✅ Registrazione completata!');
            return true;
        } else {
            showToast('❌ ' + data.message);
            return false;
        }
    } catch (error) {
        showToast('❌ Errore di connessione al server');
        console.error('Errore registrazione:', error);
        return false;
    }
}

// ============================================================
// 2. LOGIN
// ============================================================
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showToast('✅ Login effettuato!');
            return true;
        } else {
            showToast('❌ ' + data.message);
            return false;
        }
    } catch (error) {
        showToast('❌ Errore di connessione al server');
        console.error('Errore login:', error);
        return false;
    }
}

// ============================================================
// 3. OTTIENI PROFILO UTENTE
// ============================================================
async function getUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            showToast('❌ ' + data.message);
            return null;
        }
    } catch (error) {
        console.error('Errore profilo:', error);
        return null;
    }
}

// ============================================================
// 4. OTTIENI TESORI VICINI
// ============================================================
async function getNearbyTreasures(lat, lng, radius = 5000) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return [];
    }

    try {
        const response = await fetch(
            `${API_URL}/treasures/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            showToast('❌ ' + data.message);
            return [];
        }
    } catch (error) {
        console.error('Errore tesori:', error);
        return [];
    }
}

// ============================================================
// 5. CREA UN TESORO
// ============================================================
async function createTreasure(title, clue, category, latitude, longitude, address) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/treasures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                clue,
                category,
                latitude,
                longitude,
                address
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('✅ Tesoro creato con successo!');
            return true;
        } else {
            showToast('❌ ' + data.message);
            return false;
        }
    } catch (error) {
        showToast('❌ Errore di connessione al server');
        console.error('Errore creazione tesoro:', error);
        return false;
    }
}

// ============================================================
// 6. SEGNALA TESORO TROVATO
// ============================================================
async function findTreasure(treasureId, lat, lng) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return false;
    }

    try {
        const response = await fetch(
            `${API_URL}/treasures/${treasureId}/find?lat=${lat}&lng=${lng}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            showToast('🎉 ' + data.message);
            return true;
        } else {
            showToast('❌ ' + data.message);
            return false;
        }
    } catch (error) {
        showToast('❌ Errore di connessione al server');
        console.error('Errore:', error);
        return false;
    }
}

// ============================================================
// 7. SEGNALA PERICOLO
// ============================================================
async function reportTreasure(treasureId, reason, description) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/treasures/${treasureId}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason, description })
        });

        const data = await response.json();

        if (data.success) {
            showToast('✅ ' + data.message);
            return true;
        } else {
            showToast('❌ ' + data.message);
            return false;
        }
    } catch (error) {
        showToast('❌ Errore di connessione al server');
        console.error('Errore:', error);
        return false;
    }
}

// ============================================================
// 8. OTTIENI CLASSIFICA
// ============================================================
async function getLeaderboard(limit = 20, city = null) {
    try {
        let url = `${API_URL}/karma/leaderboard?limit=${limit}`;
        if (city) url += `&city=${city}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Errore classifica:', error);
        return [];
    }
}

// ============================================================
// 9. OTTIENI STORICO KARMA
// ============================================================
async function getKarmaHistory(limit = 20, offset = 0) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('❌ Devi essere loggato');
        return null;
    }

    try {
        const response = await fetch(
            `${API_URL}/karma/history?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Errore storico karma:', error);
        return null;
    }
}

// ============================================================
// 10. TOAST NOTIFICATION (helper)
// ============================================================
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.log('📢 ' + message);
        return;
    }
    document.getElementById('toast-msg').textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// 11. LOGOUT
// ============================================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    showToast('👋 Logout effettuato');
    location.reload();
}

// ============================================================
// 12. FUNZIONI DI AUTH PER IL FRONTEND
// ============================================================

function showAuthMessage(msg, isError) {
    const el = document.getElementById('auth-message');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#ff1744' : '#39ff14';
    setTimeout(() => { el.textContent = ''; }, 4000);
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) {
        showAuthMessage('⚠️ Inserisci email e password', true);
        return;
    }
    const result = await loginUser(email, password);
    if (result) {
        showAuthMessage('✅ Login effettuato!');
        updateUIForLoggedInUser();
        updateProfileUI();
    } else {
        showAuthMessage('❌ Login fallito. Controlla le credenziali.', true);
    }
}

async function handleRegister() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value.trim() || email.split('@')[0];
    if (!email || !password) {
        showAuthMessage('⚠️ Inserisci email e password', true);
        return;
    }
    if (password.length < 8) {
        showAuthMessage('⚠️ La password deve essere di almeno 8 caratteri', true);
        return;
    }
    const result = await registerUser(email, password, name);
    if (result) {
        showAuthMessage('✅ Registrazione completata!');
        updateUIForLoggedInUser();
        updateProfileUI();
    } else {
        showAuthMessage('❌ Registrazione fallita. Email già in uso?', true);
    }
}

function handleLogout() {
    logout();
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-status').style.display = 'none';
    document.getElementById('logout-section').style.display = 'none';
    showAuthMessage('👋 Logout effettuato');
}

function updateUIForLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('user-status').style.display = 'block';
        document.getElementById('user-name').textContent = user.name || user.email;
        document.getElementById('logout-section').style.display = 'block';
    } else {
        document.getElementById('logout-section').style.display = 'none';
    }
}

async function updateProfileUI() {
    try {
        const profile = await getUserProfile();
        if (profile) {
            document.getElementById('profile-name').textContent = profile.name || profile.email;
            const levelLabel = profile.trust_level === 'legend' ? 'Leggenda' :
                profile.trust_level === 'master' ? 'Maestro' :
                profile.trust_level === 'hunter' ? 'Cacciatore' : 'Esploratore';
            document.getElementById('profile-level').textContent =
                `🟢 ${levelLabel} · Livello ${Math.floor((profile.karma || 0) / 100) + 1}`;
            document.getElementById('profile-found').textContent = profile.treasures_found || 0;
            document.getElementById('profile-karma').textContent = profile.karma || 0;
            document.getElementById('profile-streak').textContent = profile.streak_days || 0;
            const progress = profile.levelProgress || {};
            document.getElementById('profile-progress-text').textContent =
                `${profile.karma || 0} / ${progress.nextKarmaNeeded + profile.karma || 500} Karma`;
            document.getElementById('profile-progress-bar').style.width =
                `${Math.min(progress.progress || 0, 100)}%`;
            document.getElementById('level-badge').textContent = `🟢 ${levelLabel}`;
        }
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
    }
}

// ============================================================
// 13. NOTIFICHE
// ============================================================

async function getNotifications(limit = 50, offset = 0, unreadOnly = false) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ Utente non loggato');
        return null;
    }

    try {
        const url = `${API_URL}/notifications?limit=${limit}&offset=${offset}&unread_only=${unreadOnly}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            console.error('❌ Errore notifiche:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore getNotifications:', error);
        return null;
    }
}

async function markNotificationRead(notificationId) {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('❌ Errore markNotificationRead:', error);
        return false;
    }
}

async function markAllNotificationsRead() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('❌ Errore markAllNotificationsRead:', error);
        return false;
    }
}

async function getUnreadCount() {
    const token = localStorage.getItem('token');
    if (!token) return 0;

    try {
        const response = await fetch(`${API_URL}/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
            return data.data.unread_count;
        }
        return 0;
    } catch (error) {
        console.error('❌ Errore getUnreadCount:', error);
        return 0;
    }
}

// ============================================================
// 14. SISTEMA AUDIO
// ============================================================

const AudioSystem = {
    sounds: {},
    background: null,
    isMuted: false,
    isMusicPlaying: false,
    isInitialized: false,

    init() {
        if (this.isInitialized) return;

        this.sounds = {
            treasureFound: new Audio('/audio/treasurefound.mp3'),
            clueOpen: new Audio('/audio/clueopen.mp3'),
            radarBeep: new Audio('/audio/radarbeep.mp3'),
            relicAlert: new Audio('/audio/relicAlert.mp3')
        };

        this.background = new Audio('/audio/background.mp3');
        this.background.loop = true;
        this.background.volume = 0.25;

        this.isInitialized = true;
        console.log('🔊 Sistema audio inizializzato');
    },

    play(soundName) {
        if (this.isMuted) return;
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    },

    playBackground() {
        if (this.isMuted || this.isMusicPlaying || !this.background) return;
        this.background.play().then(() => {
            this.isMusicPlaying = true;
            console.log('🎵 Musica avviata');
        }).catch(() => {});
    },

    stopBackground() {
        if (this.background) {
            this.background.pause();
            this.background.currentTime = 0;
            this.isMusicPlaying = false;
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackground();
            const btn = document.getElementById('audio-toggle');
            if (btn) btn.textContent = '🔇';
        } else {
            this.playBackground();
            const btn = document.getElementById('audio-toggle');
            if (btn) btn.textContent = '🔊';
        }
        return this.isMuted;
    }
};

// ============================================================
// ESPORTA FUNZIONI (per uso globale)
// ============================================================
window.registerUser = registerUser;
window.loginUser = loginUser;
window.getUserProfile = getUserProfile;
window.getNearbyTreasures = getNearbyTreasures;
window.createTreasure = createTreasure;
window.findTreasure = findTreasure;
window.reportTreasure = reportTreasure;
window.getLeaderboard = getLeaderboard;
window.getKarmaHistory = getKarmaHistory;
window.logout = logout;
window.showToast = showToast;

// Auth UI
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.showAuthMessage = showAuthMessage;
window.updateProfileUI = updateProfileUI;

// Notifiche
window.getNotifications = getNotifications;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.getUnreadCount = getUnreadCount;

// Audio
window.AudioSystem = AudioSystem;
window.toggleAudio = () => AudioSystem.toggleMute();