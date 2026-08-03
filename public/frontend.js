// ============================================================
// FRONTEND - Connessione al Backend
// ============================================================

// Configurazione
const API_URL = 'https://caccia-tesoro-backend.onrender.com/api';
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
        console.warn('⚠️ Token mancante');
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

        if (response.status === 401) {
            console.warn('⚠️ Token scaduto, logout automatico');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showToast('⏳ Sessione scaduta, effettua di nuovo il login');
            setTimeout(() => location.reload(), 2000);
            return [];
        }

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
async function createTreasure(title, clue, category, latitude, longitude, address, photoUrl) {
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
                address,
                photoUrl
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
        // Avvia l'app dopo il login
        setTimeout(() => startApp(), 500);
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
        // Avvia l'app dopo la registrazione
        setTimeout(() => startApp(), 500);
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
// 14. GENERA TESORI STARTER PER L'UTENTE
// ============================================================

async function generateStartersForUser(lat, lng) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ Utente non loggato, salto generazione starter');
        return;
    }

    try {
        console.log(`📍 Controllo tesori starter per posizione: ${lat}, ${lng}`);
       
        const response = await fetch(
            `${API_URL}/treasures/starter/generate?lat=${lat}&lng=${lng}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
       
        if (data.success) {
            console.log(`✅ ${data.message}`);
            if (data.data && data.data.length > 0) {
                console.log(`📍 Creati ${data.data.length} tesori starter`);
                data.data.forEach((t, i) => {
                    console.log(`  ${i+1}. ${t.title}`);
                });
            }
        } else {
            console.log(`ℹ️ ${data.message}`);
        }
    } catch (error) {
        console.error('❌ Errore generazione starter:', error);
    }
}

// ============================================================
// 15. START APP - Avvia l'applicazione
// ============================================================

async function startApp() {
    console.log('🚀 Avvio applicazione...');
   
    // Verifica se l'utente è loggato
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
   
    if (token && user) {
        console.log('✅ Utente loggato:', user.name || user.email);
        updateUIForLoggedInUser();
        updateProfileUI();
        showToast('👋 Bentornato, ' + (user.name || user.email) + '!');
    } else {
        console.log('ℹ️ Utente non loggato');
        return;
    }
   
    // Mostra la schermata della mappa
    const homeScreen = document.getElementById('screen-home');
    const mapScreen = document.getElementById('screen-map');
   
    if (homeScreen && mapScreen) {
        homeScreen.style.transform = 'translateY(-100%)';
        mapScreen.style.transform = 'translateY(0)';
        console.log('🗺️ Mappa visualizzata');
       
        // Ottieni la posizione corrente
        let lat = 45.4660;
        let lng = 7.8830;
       
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                console.log('📍 Posizione GPS:', lat, lng);
            } catch (e) {
                console.log('📍 Usando posizione predefinita (Ivrea)');
            }
        }
       
        // 🔥 PASSO 1: Genera i tesori starter (se necessario)
        await generateStartersForUser(lat, lng);
       
        // 🔥 PASSO 2: Inizializza la mappa
        setTimeout(() => {
            if (typeof initMap === 'function') {
                initMap();
            } else {
                console.warn('⚠️ initMap non definita, assicurati che sia definita nel DOM');
            }
        }, 300);
       
        // 🔥 PASSO 3: Carica i tesori (ora dovrebbero esserci gli starter)
        setTimeout(() => {
            loadRealTreasures();
        }, 1500);
    } else {
        console.error('❌ Schermate non trovate');
    }
}

// ============================================================
// 16. CARICA TESORI REALI DAL BACKEND
// ============================================================

async function loadRealTreasures() {
    if (!map) {
        console.log('⚠️ Mappa non inizializzata, riprovo tra 1 secondo...');
        setTimeout(() => loadRealTreasures(), 1000);
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ Utente non loggato, salto caricamento tesori');
        return;
    }

    try {
        // Ottieni la posizione corrente
        let lat = 45.4660;
        let lng = 7.8830;
       
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                console.log('📍 Posizione GPS per tesori:', lat, lng);
            } catch (e) {
                console.log('📍 Usando posizione predefinita (Ivrea)');
            }
        }
       
        // 🔥 Usa getNearbyTreasures per caricare i tesori
        const treasures = await getNearbyTreasures(lat, lng, 10000);
        console.log('📦 Risultato getNearbyTreasures:', treasures);

        if (treasures && treasures.length > 0) {
            window.realTreasures = treasures;
            clearTreasureMarkers();

            treasures.forEach(t => {
                addRealTreasureMarker(t);
            });

            document.getElementById('found-count').textContent = treasures.length;
            console.log(`✅ Caricati ${treasures.length} tesori dal database`);
        } else {
            console.log('ℹ️ Nessun tesoro trovato nelle vicinanze');
            document.getElementById('found-count').textContent = '0';
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento dei tesori:', error);
    }
}

// ============================================================
// 17. SISTEMA AUDIO
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
// 18. FUNZIONE PER PULIRE I MARKER (dichiarata per sicurezza)
// ============================================================

function clearTreasureMarkers() {
    if (window.treasureMarkers) {
        window.treasureMarkers.forEach(marker => {
            if (map) map.removeLayer(marker);
        });
        window.treasureMarkers = [];
    }
}

// ============================================================
// 19. FUNZIONE PER AGGIUNGERE MARKER (dichiarata per sicurezza)
// ============================================================

function addRealTreasureMarker(treasure) {
    if (!map) {
        console.log('⚠️ Mappa non disponibile, salto il marker');
        return;
    }

    let color, glow, size, anim;

    if (treasure.level === 'relic') {
        color = '#ff1744';
        glow = '0 0 40px rgba(255,23,68,0.9)';
        size = '28px';
        anim = 'animation:pulse 1.5s infinite, relicGlow 2s infinite alternate;';
    } else if (treasure.level === 'warm') {
        color = '#ffd700';
        glow = '0 0 30px rgba(255,215,0,0.7)';
        size = '24px';
        anim = 'animation:pulse 2s infinite;';
    } else {
        color = '#39ff14';
        glow = '0 0 20px rgba(57,255,20,0.4)';
        size = '20px';
        anim = '';
    }

    let icon = '📦';
    const category = treasure.category || '';
    if (category.includes('libro') || category === 'book' || category === '📖') icon = '📖';
    else if (category.includes('giocattolo') || category === 'toy' || category === '🧸') icon = '🧸';
    else if (category.includes('biglietto') || category === 'ticket' || category === '🎫') icon = '🎫';
    else if (category.includes('souvenir') || category === '🎁') icon = '🎁';
    else if (category.includes('altro') || category === 'other') icon = '📦';

    if (treasure.category && treasure.category.match(/[\u{1F300}-\u{1FAFF}]/u)) {
        icon = treasure.category;
    }

    const html = `
        <div style="
            width:${size};height:${size};
            background:${color};
            border-radius:50%;
            box-shadow:${glow};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:${treasure.level === 'relic' ? '14px' : '11px'};
            border:2px solid rgba(255,255,255,0.15);
            cursor:pointer;
            ${anim}
            position:relative;
            transition: transform 0.2s;
        ">
            ${icon}
            <div style="
                position:absolute;
                top:-15px;left:-15px;
                width:${parseInt(size) + 30}px;
                height:${parseInt(size) + 30}px;
                background:transparent;
                border-radius:50%;
                z-index:10;
            "></div>
            ${treasure.level === 'relic' ? `
                <div style="
                    position:absolute;
                    top:-8px;right:-8px;
                    font-size:12px;
                    animation: spin 3s linear infinite;
                ">⚡</div>
            ` : ''}
            ${treasure.level === 'warm' ? `
                <div style="
                    position:absolute;
                    top:-8px;right:-8px;
                    font-size:12px;
                ">🔥</div>
            ` : ''}
        </div>
    `;

    const iconL = L.divIcon({
        className: 'treasure-marker',
        html: html,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([treasure.latitude, treasure.longitude], { icon: iconL }).addTo(map);

    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (typeof openClue === 'function') {
            openClue(treasure.id);
        } else {
            console.warn('⚠️ openClue non definita');
        }
    });
    marker.on('tap', function(e) {
        L.DomEvent.stopPropagation(e);
        if (typeof openClue === 'function') {
            openClue(treasure.id);
        } else {
            console.warn('⚠️ openClue non definita');
        }
    });

    if (!window.treasureMarkers) window.treasureMarkers = [];
    window.treasureMarkers.push(marker);
}

// ============================================================
// PROFILO - CRONOLOGIA TESORI (REALE)
// ============================================================

async function openTreasureHistory() {
    console.log('📜 Apertura cronologia tesori...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('⚠️ Devi essere loggato');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/treasure-history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            showToast('📭 Nessun tesoro trovato o nascosto');
            return;
        }

        // Costruisci il contenuto del modale
        let html = `
            <div style="padding:20px; max-height:400px; overflow-y:auto;">
                <h3 style="margin-bottom:16px; color:var(--neon-green);">📜 Cronologia Tesori</h3>
        `;

        data.data.forEach(t => {
            const statusIcon = t.status === 'found' ? '✅' : '📦';
            const statusText = t.status === 'found' ? 'Trovato' : 'Nascosto';
            const date = new Date(t.created_at).toLocaleDateString('it-IT');
            
            html += `
                <div style="padding:12px 0; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:var(--text-primary);">${t.title}</span>
                        <span style="font-size:12px; color:${t.status === 'found' ? 'var(--neon-green)' : 'var(--neon-gold)'};">
                            ${statusIcon} ${statusText}
                        </span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary);">
                        ${date}
                    </div>
                </div>
            `;
        });

        html += `
                <button onclick="closeClue()" style="margin-top:16px; padding:10px 20px; border-radius:12px; border:1px solid var(--border-color); background:transparent; color:var(--text-primary); cursor:pointer; width:100%;">
                    Chiudi
                </button>
            </div>
        `;

        // Mostra il modale
        const modal = document.getElementById('clue-modal');
        if (modal) {
            document.getElementById('modal-title').textContent = '📜 Cronologia Tesori';
            document.getElementById('modal-tag').textContent = 'Storico';
            document.getElementById('modal-tag').className = 'modal-tag';
            document.getElementById('modal-level').textContent = '';
            document.getElementById('modal-clue').innerHTML = html;
            document.getElementById('modal-dist').textContent = '';
            document.getElementById('modal-bonus').style.display = 'none';
            
            document.querySelector('.modal-actions').style.display = 'none';
            document.querySelector('.btn-danger').style.display = 'none';
            
            modal.classList.add('show');
        } else {
            showToast('📜 Cronologia tesori caricata');
        }

    } catch (error) {
        console.error('❌ Errore cronologia:', error);
        showToast('❌ Errore nel caricamento della cronologia');
    }
}

// ============================================================
// CHIUDI MODALE (con ripristino)
// ============================================================

function closeClue() {
    const modal = document.getElementById('clue-modal');
    if (modal) {
        modal.classList.remove('show');
        
        // Ripristina i pulsanti per i tesori (se sono stati nascosti)
        const actions = document.querySelector('.modal-actions');
        const dangerBtn = document.querySelector('.btn-danger');
        if (actions) actions.style.display = 'flex';
        if (dangerBtn) dangerBtn.style.display = 'block';
        
        // Ripristina il contenuto del modale (per evitare che rimanga la cronologia)
        const titleEl = document.getElementById('modal-title');
        const tagEl = document.getElementById('modal-tag');
        const levelEl = document.getElementById('modal-level');
        const clueEl = document.getElementById('modal-clue');
        const distEl = document.getElementById('modal-dist');
        const bonusEl = document.getElementById('modal-bonus');
        
        if (titleEl) titleEl.textContent = 'Il Quaderno Perduto';
        if (tagEl) {
            tagEl.textContent = '🏴‍☠️ Tesoro Rilevato';
            tagEl.className = 'modal-tag';
        }
        if (levelEl) levelEl.textContent = '📦 Tesoro Normale · Karma: 10';
        if (clueEl) clueEl.textContent = '"Dove l\'acqua cantava e ora la pietra tace..."';
        if (distEl) distEl.textContent = '150 m';
        if (bonusEl) bonusEl.style.display = 'none';
    }
}
// ============================================================
// PROFILO - PULSANTI
// ============================================================


function openBadges() {
    showToast('🏅 Badge e Ricompense - In sviluppo');
}

function openIdentityVerification() {
    showToast('🔐 Verifica Identità - In sviluppo');
}

function openSecurityCenter() {
    showToast('🛡️ Centro Sicurezza - In sviluppo');
}

function openPrivacySettings() {
    showToast('⚙️ Impostazioni Privacy - In sviluppo');
}

function openCityLeaderboard() {
    goTo('leaderboard');
}

// ============================================================
// ESPORTA FUNZIONI PROFILO (per uso globale)
// ============================================================
window.openBadges = openBadges;
window.openIdentityVerification = openIdentityVerification;
window.openSecurityCenter = openSecurityCenter;
window.openPrivacySettings = openPrivacySettings;
window.openCityLeaderboard = openCityLeaderboard;

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
window.openTreasureHistory = openTreasureHistory;
window.closeClue = closeClue;

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

// App - TESORI STARTER
window.startApp = startApp;
window.loadRealTreasures = loadRealTreasures;
window.generateStartersForUser = generateStartersForUser;
window.clearTreasureMarkers = clearTreasureMarkers;
window.addRealTreasureMarker = addRealTreasureMarker;

console.log('✅ frontend.js caricato correttamente!');
console.log('🔧 Funzioni disponibili:');
console.log('  - registerUser(), loginUser()');
console.log('  - getNearbyTreasures(), createTreasure()');
console.log('  - getLeaderboard(), getKarmaHistory()');
console.log('  - handleLogin(), handleRegister(), handleLogout()');
console.log('  - startApp() - Avvia la mappa e genera starter');
console.log('  - loadRealTreasures() - Carica i tesori');
console.log('  - generateStartersForUser() - Genera tesori starter');
console.log('  - AudioSystem - Gestione audio');
