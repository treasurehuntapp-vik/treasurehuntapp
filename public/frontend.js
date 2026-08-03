// ============================================================
// FRONTEND - Connessione al Backend
// ============================================================

// Configurazione
const API_URL = 'https://caccia-tesoro-backend.onrender.com/api';
let currentToken = null;
let currentUser = null;

// Variabili per il caricamento foto
let hidePhotoFile = null;
let hidePhotoDataUrl = null;

// Variabili per la mappa
let map = null;
let userMarker = null;
let userPos = { lat: 45.4660, lng: 7.8830 };
let isFollowing = false;
let watchId = null;
let treasureMarkers = [];

// Variabili per il radar
let radarActive = false;
let radarTreasure = null;
let radarAnimationId = null;
let radarDistance = 0;

// Variabili per la selezione posizione su "Nascondi"
let hideMap = null;
let hideMarker = null;
let selectedHideLocation = { lat: 45.4660, lng: 7.8830 };
let selectedHideAddress = '📍 Piazza Ottinetti, Ivrea';

// Variabili per la classifica
let currentLeaderboardFilter = 'all';
let hidePhotoFile = null;
let hidePhotoDataUrl = null;

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
            
            let levelLabel = 'Esploratore';
            if (profile.karma >= 500) {
                levelLabel = 'Maestro';
            } else if (profile.karma >= 100) {
                levelLabel = 'Cacciatore';
            }
            
            document.getElementById('profile-level').textContent = `🟢 ${levelLabel} · Livello ${Math.floor(profile.karma / 100) + 1}`;
            document.getElementById('profile-found').textContent = profile.treasures_found || 0;
            document.getElementById('profile-karma').textContent = profile.karma || 0;
            document.getElementById('profile-streak').textContent = profile.streak_days || 0;
            
            const currentKarma = profile.karma || 0;
            let progressText = '';
            let progressPercent = 0;
            
            if (currentKarma < 100) {
                progressText = `${currentKarma} / 100 Karma`;
                progressPercent = (currentKarma / 100) * 100;
            } else if (currentKarma < 500) {
                progressText = `${currentKarma} / 500 Karma`;
                progressPercent = (currentKarma / 500) * 100;
            } else {
                progressText = '🏆 Livello Massimo!';
                progressPercent = 100;
            }
            
            document.getElementById('profile-progress-text').textContent = progressText;
            document.getElementById('profile-progress-bar').style.width = `${Math.min(progressPercent, 100)}%`;
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
// 15. MAPPA - FUNZIONI DI INIZIALIZZAZIONE
// ============================================================

function initMap() {
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet non caricato!');
        showToast('⚠️ Errore: libreria mappa non disponibile');
        return;
    }
    
    if (map) {
        console.log('ℹ️ Mappa già esistente');
        return;
    }
    
    const container = document.getElementById('map-container');
    if (!container) {
        console.error('❌ Contenitore mappa non trovato!');
        return;
    }
    
    try {
        map = L.map('map-container', {
            zoomControl: true,
            attributionControl: false
        }).setView([userPos.lat, userPos.lng], 16);

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const tileLayer = currentTheme === 'dark' ?
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        L.tileLayer(tileLayer, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        addUserMarker();
        startGPS();

        map.on('dragstart', function() {
            if (isFollowing) {
                isFollowing = false;
                document.getElementById('btnCenter').classList.remove('active');
                document.getElementById('btnCenter').innerHTML = '🎯';
            }
        });

        setTimeout(() => {
            if (map) map.invalidateSize();
            console.log('✅ Mappa inizializzata correttamente');
            loadRealTreasures();
        }, 500);

    } catch (error) {
        console.error('❌ Errore inizializzazione mappa:', error);
        showToast('❌ Errore nel caricamento della mappa');
    }
}

function addUserMarker() {
    if (!map) return;
    
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="width:16px;height:16px;background:#39ff14;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(57,255,20,0.6);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userMarker = L.marker([userPos.lat, userPos.lng], {
        icon: userIcon,
        zIndexOffset: 1000
    }).addTo(map);
}

function startGPS() {
    if (!navigator.geolocation) {
        console.log('⚠️ GPS non supportato');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            updateUserPosition(latitude, longitude);
            if (map) map.setView([latitude, longitude], 16);
            console.log('📍 GPS acquisito:', latitude, longitude);
        },
        () => {
            console.log('⚠️ GPS non disponibile, posizione simulata (Ivrea)');
        }, {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );

    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            updateUserPosition(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
}

function updateUserPosition(lat, lng) {
    userPos.lat = lat;
    userPos.lng = lng;
    if (userMarker) {
        userMarker.setLatLng([lat, lng]);
    }
    if (isFollowing && map) {
        map.setView([lat, lng], map.getZoom());
    }
}

function centerOnUser() {
    if (!map) return;
    isFollowing = !isFollowing;
    const btn = document.getElementById('btnCenter');
    if (isFollowing) {
        btn.classList.add('active');
        btn.innerHTML = '📍';
        map.setView([userPos.lat, userPos.lng], 16);
        showToast('📍 Follow attivo');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '🎯';
        showToast('🗺️ Esplorazione libera');
    }
}

// ============================================================
// 16. START APP - Avvia l'applicazione
// ============================================================

async function startApp() {
    console.log('🚀 Avvio applicazione...');
    
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
    
    const homeScreen = document.getElementById('screen-home');
    const mapScreen = document.getElementById('screen-map');
    
    if (homeScreen && mapScreen) {
        homeScreen.style.transform = 'translateY(-100%)';
        mapScreen.style.transform = 'translateY(0)';
        console.log('🗺️ Mappa visualizzata');
        
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
        
        await generateStartersForUser(lat, lng);
        
        setTimeout(() => {
            if (typeof initMap === 'function') {
                initMap();
            } else {
                console.warn('⚠️ initMap non definita');
                if (typeof L !== 'undefined') {
                    console.log('✅ Leaflet disponibile, inizializzo mappa...');
                    initMap();
                } else {
                    console.error('❌ Leaflet non disponibile!');
                    showToast('❌ Errore: mappa non disponibile');
                }
            }
        }, 300);
        
        setTimeout(() => {
            loadRealTreasures();
        }, 1500);
    } else {
        console.error('❌ Schermate non trovate');
    }
}

// ============================================================
// 17. CARICA TESORI REALI DAL BACKEND
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
// 18. SISTEMA AUDIO
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
// 19. FUNZIONE PER PULIRE I MARKER
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
// 20. FUNZIONE PER AGGIUNGERE MARKER
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
// 21. NAVIGAZIONE E FUNZIONI DI INTERFACCIA
// ============================================================

// Navigazione tra le schermate
function goTo(screen) {
    console.log('🔄 Navigazione a:', screen);
    
    const screens = {
        map: 'screen-map',
        profile: 'screen-profile',
        hide: 'screen-hide',
        leaderboard: 'screen-leaderboard'
    };

    Object.values(screens).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.transform = 'translateY(100%)';
    });

    const target = document.getElementById(screens[screen]);
    if (target) {
        target.style.transform = 'translateY(0)';
    }
    
    // Chiudi il modale se aperto
    const clueModal = document.getElementById('clue-modal');
    if (clueModal) {
        clueModal.classList.remove('show');
    }

    // Aggiorna i bottoni di navigazione
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const navMap = { map: 0, hide: 1, leaderboard: 2, profile: 3 };
    const btns = document.querySelectorAll('.nav-item');
    if (btns && btns[navMap[screen]]) {
        btns[navMap[screen]].classList.add('active');
    }

    if (screen === 'map') {
        setTimeout(() => { 
            if (map) map.invalidateSize();
            loadRealTreasures();
        }, 400);
    }

    if (screen === 'profile') {
        updateProfileUI();
    }

    if (screen === 'leaderboard') {
        loadLeaderboard(currentLeaderboardFilter || 'all');
    }
}

// Navigazione tra gli step del form "Nascondi tesoro"
function goToStep(step) {
    if (step < 1 || step > 4) return;

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('step' + step);
    if (panel) panel.classList.add('active');

    document.querySelectorAll('.step-indicator .step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === step) el.classList.add('active');
        else if (s < step) el.classList.add('done');
    });

    if (step === 2) {
        setTimeout(() => {
            if (typeof initHideMap === 'function') {
                initHideMap();
            }
        }, 300);
    }
}

// Apre il modale con l'indizio del tesoro
function openClue(id) {
    window.currentTreasureId = id;
    
    let t = null;
    if (window.realTreasures) {
        t = window.realTreasures.find(t => t.id === id);
    }

    if (!t) {
        showToast('⚠️ Tesoro non trovato');
        return;
    }

    if (AudioSystem) AudioSystem.play('clueOpen');

    const tag = document.getElementById('modal-tag');
    const clueBox = document.getElementById('modal-clue');
    const bonus = document.getElementById('modal-bonus');
    const levelEl = document.getElementById('modal-level');

    if (tag) tag.className = 'modal-tag';
    if (clueBox) clueBox.className = 'clue-box';
    if (bonus) bonus.style.display = 'none';

    let levelText = '';
    let karmaText = '';

    if (t.level === 'relic') {
        if (tag) {
            tag.textContent = '⚡ RELIQUIA DIMENTICATA';
            tag.classList.add('relic');
        }
        if (clueBox) clueBox.classList.add('relic');
        if (bonus) {
            bonus.style.display = 'inline';
            bonus.textContent = '🔥 Karma x3 (+30)';
        }
        levelText = '⚡ Reliquia Leggendaria';
        karmaText = 'Karma: 30';
        if (AudioSystem) AudioSystem.play('relicAlert');
    } else if (t.level === 'warm') {
        if (tag) {
            tag.textContent = '🔥 Tesoro "Caldo"';
            tag.classList.add('warm');
        }
        if (clueBox) clueBox.classList.add('warm');
        if (bonus) {
            bonus.style.display = 'inline';
            bonus.textContent = '🔥 Karma x2 (+20)';
        }
        levelText = '🔥 Tesoro Caldo';
        karmaText = 'Karma: 20';
    } else {
        if (tag) tag.textContent = '🏴‍☠️ Tesoro Rilevato';
        levelText = '📦 Tesoro Normale';
        karmaText = 'Karma: 10';
    }

    if (levelEl) levelEl.textContent = `${levelText} · ${karmaText}`;
    
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = t.title;
    
    const clueEl = document.getElementById('modal-clue');
    if (clueEl) clueEl.textContent = `"${t.clue}"`;
    
    const distEl = document.getElementById('modal-dist');
    if (distEl) distEl.textContent = `${t.distance || 0} m`;

    const modal = document.getElementById('clue-modal');
    if (modal) modal.classList.add('show');
}

// Chiude il modale dell'indizio
function closeClue() {
    const modal = document.getElementById('clue-modal');
    if (modal) modal.classList.remove('show');
}

// Gestione del tema (chiaro/scuro)
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(newTheme === 'dark' ? '🌙 Tema scuro attivato' : '☀️ Tema chiaro attivato');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        const tileLayer = theme === 'dark' ?
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        L.tileLayer(tileLayer, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);
    }

    if (hideMap) {
        hideMap.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                hideMap.removeLayer(layer);
            }
        });
        const hideTileLayer = theme === 'dark' ?
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(hideTileLayer, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(hideMap);
    }
}

// Inizializza il tema all'avvio
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    let theme;

    if (savedTheme) {
        theme = savedTheme;
    } else {
        const hour = new Date().getHours();
        theme = (hour >= 20 || hour < 6) ? 'dark' : 'light';
    }

    applyTheme(theme);
}

// Funzioni per il radar
function closeRadar() {
    const overlay = document.getElementById('radar-overlay');
    if (overlay) overlay.classList.remove('active');
    radarActive = false;
    radarTreasure = null;
    if (radarAnimationId) {
        cancelAnimationFrame(radarAnimationId);
        radarAnimationId = null;
    }
}

// Funzioni per le notifiche
function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (panel) {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            loadNotifications();
            updateUnreadCount();
        }
    }
}

// ============================================================
// 22. PROFILO - GESTIONE PULSANTI
// ============================================================

async function openTreasureHistory() {
    console.log('📜 Apertura cronologia tesori...');
    showToast('📜 Cronologia tesori - Funzionalità in sviluppo');
}

async function openBadges() {
    console.log('🏅 Apertura badge e ricompense...');
    showToast('🏅 Badge e Ricompense - Funzionalità in sviluppo');
}

function openIdentityVerification() {
    console.log('🔐 Apertura verifica identità...');
    showToast('🔐 Verifica Identità - Funzionalità in sviluppo');
}

function openSecurityCenter() {
    console.log('🛡️ Apertura centro sicurezza...');
    showToast('🛡️ Centro Sicurezza - Funzionalità in sviluppo');
}

function openPrivacySettings() {
    console.log('⚙️ Apertura impostazioni privacy...');
    showToast('⚙️ Impostazioni Privacy - Funzionalità in sviluppo');
}

function openCityLeaderboard() {
    console.log('🏆 Apertura classifica cittadina...');
    goTo('leaderboard');
}

// ============================================================
// 23. SELEZIONE POSIZIONE (Nascondi tesoro)
// ============================================================

function initHideMap() {
    if (hideMap) return;
    
    const container = document.getElementById('hide-map-container');
    if (!container) return;
    
    hideMap = L.map('hide-map-container', {
        zoomControl: true,
        attributionControl: false
    }).setView([selectedHideLocation.lat, selectedHideLocation.lng], 16);

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const tileLayer = currentTheme === 'dark' ?
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileLayer, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(hideMap);

    hideMarker = L.marker([selectedHideLocation.lat, selectedHideLocation.lng], {
        draggable: true
    }).addTo(hideMap);

    hideMarker.on('dragend', function() {
        const pos = hideMarker.getLatLng();
        selectedHideLocation.lat = pos.lat;
        selectedHideLocation.lng = pos.lng;
        updateHideLocationDisplay(pos.lat, pos.lng);
    });

    hideMap.on('click', function(e) {
        selectedHideLocation.lat = e.latlng.lat;
        selectedHideLocation.lng = e.latlng.lng;
        hideMarker.setLatLng(e.latlng);
        updateHideLocationDisplay(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
        if (hideMap) hideMap.invalidateSize();
    }, 500);
}

function getCurrentLocationForHide() {
    if (!navigator.geolocation) {
        showToast('⚠️ GPS non supportato');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            selectedHideLocation.lat = latitude;
            selectedHideLocation.lng = longitude;
            if (hideMarker) {
                hideMarker.setLatLng([latitude, longitude]);
            }
            if (hideMap) {
                hideMap.setView([latitude, longitude], 16);
            }
            updateHideLocationDisplay(latitude, longitude);
            showToast('📍 Posizione aggiornata!');
        },
        () => {
            showToast('⚠️ Impossibile ottenere la posizione');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function centerHideMapOnIvrea() {
    selectedHideLocation.lat = 45.4660;
    selectedHideLocation.lng = 7.8830;
    if (hideMarker) {
        hideMarker.setLatLng([45.4660, 7.8830]);
    }
    if (hideMap) {
        hideMap.setView([45.4660, 7.8830], 16);
    }
    updateHideLocationDisplay(45.4660, 7.8830);
}

function updateHideLocationDisplay(lat, lng) {
    const input = document.getElementById('hide-location-input');
    if (input) {
        input.value = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        selectedHideAddress = input.value;
    }
    
    if (window.tempTreasureData) {
        window.tempTreasureData.latitude = lat;
        window.tempTreasureData.longitude = lng;
        window.tempTreasureData.address = selectedHideAddress;
    }
    
    updateStep4Preview();
}

function saveHideLocationAndGoToStep3() {
    if (!window.tempTreasureData) {
        window.tempTreasureData = {};
    }
    window.tempTreasureData.latitude = selectedHideLocation.lat;
    window.tempTreasureData.longitude = selectedHideLocation.lng;
    window.tempTreasureData.address = selectedHideAddress;
    
    updateStep4Preview();
    goToStep(3);
}

// ============================================================
// 24. SALVA DATI TESORO E VAI ALLO STEP 4
// ============================================================

function saveTreasureDataAndGoToStep4() {
    const titleInput = document.querySelector('#step3 input[type="text"]');
    const clueTextarea = document.querySelector('#step3 textarea');
    const categorySelect = document.querySelector('#step3 select');

    const title = titleInput ? titleInput.value.trim() : 'Tesoro Misterioso';
    const clue = clueTextarea ? clueTextarea.value.trim() : 'Indizio segreto...';
    const category = categorySelect ? categorySelect.value : 'altro';

    if (!window.tempTreasureData) {
        window.tempTreasureData = {};
    }
    window.tempTreasureData.title = title;
    window.tempTreasureData.clue = clue;
    window.tempTreasureData.category = category;

    console.log('📦 Dati salvati:', window.tempTreasureData);

    goToStep(4);
    updateStep4Preview();
}

function updateStep4Preview() {
    const data = window.tempTreasureData;
    if (!data) return;

    const titleEl = document.querySelector('#step4 .preview-title');
    if (titleEl) titleEl.textContent = data.title || 'Tesoro Misterioso';

    const clueEl = document.querySelector('#step4 .clue-preview');
    if (clueEl) clueEl.textContent = `"${data.clue || 'Indizio segreto...'}"`;

    const addressEl = document.getElementById('preview-address');
    if (addressEl) {
        addressEl.textContent = data.address || '📍 Posizione selezionata sulla mappa';
    }
}

// ============================================================
// 25. CREA TESORO DAL FORM
// ============================================================

async function createTreasureFromForm() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('⚠️ Devi essere loggato per nascondere un tesoro');
        return;
    }

    const data = window.tempTreasureData;
    if (!data) {
        showToast('⚠️ Nessun dato trovato. Compila prima il form.');
        return;
    }

    const title = data.title || 'Tesoro Misterioso';
    const clue = data.clue || 'Indizio segreto...';
    const category = data.category || 'altro';
    const latitude = data.latitude || userPos.lat || 45.4660;
    const longitude = data.longitude || userPos.lng || 7.8830;
    const address = data.address || '📍 Posizione selezionata sulla mappa';
    const photoUrl = data.photoDataUrl || null;

    console.log('📦 Creazione tesoro con dati salvati:');
    console.log('  Titolo:', title);
    console.log('  Indizio:', clue);
    console.log('  Categoria:', category);
    console.log('  Latitudine:', latitude);
    console.log('  Longitudine:', longitude);
    console.log('  Indirizzo:', address);
    console.log('  Foto:', photoUrl ? 'SI' : 'NO');

    if (!title || title === '') {
        showToast('⚠️ Inserisci un titolo per il tesoro');
        return;
    }

    if (!clue || clue === '') {
        showToast('⚠️ Inserisci un indizio per il tesoro');
        return;
    }

    const success = await createTreasure(title, clue, category, latitude, longitude, address, photoUrl);

    if (success) {
        window.tempTreasureData = null;
        hidePhotoFile = null;
        hidePhotoDataUrl = null;
        setTimeout(() => goToStep(1), 1500);
        setTimeout(() => {
            if (map) loadRealTreasures();
        }, 2000);
    }
}

// ============================================================
// 26. NOTIFICHE UI
// ============================================================

let notificationsPanelOpen = false;

async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    
    const result = await getNotifications(50, 0, false);
    
    if (!result || result.notifications.length === 0) {
        list.innerHTML = `<div class="notif-empty">📭 Nessuna notifica</div>`;
        return;
    }

    list.innerHTML = result.notifications.map(n => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="handleNotificationClick('${n.id}')">
            <div class="notif-item-title ${n.read ? 'read' : 'unread'}">${n.title}</div>
            <div class="notif-item-body">${n.body}</div>
            <div class="notif-item-time">${new Date(n.created_at).toLocaleString()}</div>
        </div>
    `).join('');
}

async function handleNotificationClick(notificationId) {
    await markNotificationRead(notificationId);
    await loadNotifications();
    await updateUnreadCount();
}

async function updateUnreadCount() {
    const count = await getUnreadCount();
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    if (count > 0) {
        badge.classList.add('visible');
        badge.textContent = count > 99 ? '99+' : count;
    } else {
        badge.classList.remove('visible');
    }
}

// ============================================================
// 27. CARICAMENTO FOTO - VERSIONE COMPLETA
// ============================================================

// Inizializza il listener per il cambio file
function initHidePhoto() {
    const input = document.getElementById('hide-photo-input');
    if (!input) {
        console.error('❌ Input file non trovato');
        return;
    }
    
    input.removeEventListener('change', handleFileSelect);
    input.addEventListener('change', handleFileSelect);
    console.log('📸 Input file inizializzato correttamente');
}

// Gestisce la selezione del file
function handleFileSelect(e) {
    console.log('📸 Evento change catturato!');
    
    const input = e.target;
    const file = input.files[0];
    
    if (!file) {
        console.log('⚠️ Nessun file selezionato');
        return;
    }
    
    console.log('📸 File selezionato:', file.name, file.size, file.type);
    
    // Validazione sul tipo
    if (!file.type.startsWith('image/')) {
        showToast('❌ Il file deve essere un\'immagine');
        input.value = '';
        return;
    }
    
    // Salva il file
    hidePhotoFile = file;
    console.log('📸 File salvato in hidePhotoFile');
    
    // Leggi il file per l'anteprima
    const reader = new FileReader();
    reader.onload = function(event) {
        console.log('📸 FileReader completato');
        hidePhotoDataUrl = event.target.result;
        
        const img = document.getElementById('hide-photo-image');
        const placeholder = document.getElementById('hide-photo-placeholder');
        const preview = document.getElementById('hide-photo-preview');
        const removeBtn = document.getElementById('hide-photo-remove');
        
        if (img) {
            img.src = event.target.result;
            img.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (preview) {
            preview.classList.add('has-image');
        }
        if (removeBtn) {
            removeBtn.style.display = 'block';
        }
        
        showToast('✅ Foto caricata!');
        console.log('📸 Anteprima visualizzata');
    };
    
    reader.onerror = function() {
        console.error('❌ Errore FileReader');
        showToast('❌ Errore nella lettura del file');
    };
    
    reader.readAsDataURL(file);
    
    // Reset dell'input DOPO aver letto il file
    input.value = '';
}

// Apre il selettore di file (chiamato dal pulsante)
function triggerFileInput() {
    console.log('📸 triggerFileInput chiamato');
    
    const input = document.getElementById('hide-photo-input');
    if (!input) {
        console.error('❌ Input file non trovato');
        showToast('⚠️ Errore: input non trovato');
        return;
    }
    
    // 🔥 FIX: Reset del valore prima di aprire
    input.value = '';
    input.click();
    console.log('📸 File input aperto (resettato)');
}

// Rimuove la foto selezionata
function clearHidePhoto() {
    console.log('🗑️ Rimozione foto');
    
    hidePhotoFile = null;
    hidePhotoDataUrl = null;
    
    const img = document.getElementById('hide-photo-image');
    const placeholder = document.getElementById('hide-photo-placeholder');
    const preview = document.getElementById('hide-photo-preview');
    const removeBtn = document.getElementById('hide-photo-remove');
    const input = document.getElementById('hide-photo-input');
    
    if (img) {
        img.src = '';
        img.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'block';
    }
    if (preview) {
        preview.classList.remove('has-image');
    }
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }
    if (input) {
        input.value = '';
    }
    
    showToast('🗑️ Foto rimossa');
}

// Salva la foto e passa allo step 2
async function saveHidePhotoAndGoToStep2() {
    console.log('📸 Verifica foto:', hidePhotoFile ? '✅ File presente' : '❌ NESSUN FILE');
    
    if (!hidePhotoFile) {
        showToast('⚠️ Carica una foto dell\'oggetto');
        return;
    }
    
    if (!window.tempTreasureData) {
        window.tempTreasureData = {};
    }
    window.tempTreasureData.photoFile = hidePhotoFile;
    window.tempTreasureData.photoDataUrl = hidePhotoDataUrl;
    
    console.log('📸 Dati foto salvati in tempTreasureData');
    goToStep(2);
}

// ============================================================
// 28. CLASSIFICA
// ============================================================

async function loadLeaderboard(filter = 'all') {
    currentLeaderboardFilter = filter;
    
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = filter === 'all' 
        ? document.querySelector('.btn-filter:first-child')
        : document.querySelector('.btn-filter:last-child');
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:40px 0;">⏳ Caricamento...</div>';

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const city = filter === 'city' && user ? user.city : null;
        
        const data = await getLeaderboard(50, city);
        
        if (!data || data.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; color:var(--text-secondary); padding:40px 0;">
                    🏆 Nessun cacciatore trovato
                    ${filter === 'city' ? ' nella tua città' : ''}
                </div>
            `;
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        
        list.innerHTML = data.map((user, index) => {
            const medal = index < 3 ? medals[index] : `#${index + 1}`;
            const levelLabel = user.trust_level === 'legend' ? '👑 Leggenda' :
                               user.trust_level === 'master' ? '⭐ Maestro' :
                               user.trust_level === 'hunter' ? '🔶 Cacciatore' : '🟢 Esploratore';
            
            return `
                <div class="leaderboard-item ${index < 3 ? 'top' : ''}">
                    <div class="leaderboard-rank">${medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${user.name || 'Anonimo'}</div>
                        <div class="leaderboard-level">${levelLabel}</div>
                    </div>
                    <div class="leaderboard-karma">
                        <div class="value">${user.karma}</div>
                        <div class="label">Karma</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Errore classifica:', error);
        list.innerHTML = '<div style="text-align:center; color:var(--neon-red); padding:40px 0;">❌ Errore nel caricamento della classifica</div>';
    }
}

// ============================================================
// 29. ESPORTA FUNZIONI (per uso globale)
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
window.loadNotifications = loadNotifications;
window.handleNotificationClick = handleNotificationClick;
window.updateUnreadCount = updateUnreadCount;
window.toggleNotifications = toggleNotifications;

// Audio
window.AudioSystem = AudioSystem;
window.toggleAudio = () => AudioSystem.toggleMute();

// App - TESORI STARTER
window.startApp = startApp;
window.loadRealTreasures = loadRealTreasures;
window.generateStartersForUser = generateStartersForUser;
window.clearTreasureMarkers = clearTreasureMarkers;
window.addRealTreasureMarker = addRealTreasureMarker;

// Mappa
window.initMap = initMap;
window.centerOnUser = centerOnUser;

// Navigazione e UI
window.goTo = goTo;
window.goToStep = goToStep;
window.openClue = openClue;
window.closeClue = closeClue;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.initTheme = initTheme;
window.closeRadar = closeRadar;

// Nascondi tesoro
window.initHideMap = initHideMap;
window.getCurrentLocationForHide = getCurrentLocationForHide;
window.centerHideMapOnIvrea = centerHideMapOnIvrea;
window.updateHideLocationDisplay = updateHideLocationDisplay;
window.saveHideLocationAndGoToStep3 = saveHideLocationAndGoToStep3;
window.saveTreasureDataAndGoToStep4 = saveTreasureDataAndGoToStep4;
window.updateStep4Preview = updateStep4Preview;
window.createTreasureFromForm = createTreasureFromForm;

// Caricamento foto
window.initHidePhoto = initHidePhoto;
window.handleFileSelect = handleFileSelect;
window.triggerFileInput = triggerFileInput;
window.clearHidePhoto = clearHidePhoto;
window.saveHidePhotoAndGoToStep2 = saveHidePhotoAndGoToStep2;

// Profilo - Pulsanti
window.openTreasureHistory = openTreasureHistory;
window.openBadges = openBadges;
window.openIdentityVerification = openIdentityVerification;
window.openSecurityCenter = openSecurityCenter;
window.openPrivacySettings = openPrivacySettings;
window.openCityLeaderboard = openCityLeaderboard;

console.log('✅ frontend.js caricato correttamente!');
console.log('🔧 Funzioni disponibili:');
console.log('  - registerUser(), loginUser()');
console.log('  - getNearbyTreasures(), createTreasure()');
console.log('  - getLeaderboard(), getKarmaHistory()');
console.log('  - handleLogin(), handleRegister(), handleLogout()');
console.log('  - startApp() - Avvia la mappa e genera starter');
console.log('  - loadRealTreasures() - Carica i tesori');
console.log('  - generateStartersForUser() - Genera tesori starter');
console.log('  - initMap() - Inizializza la mappa');
console.log('  - goTo() - Navigazione tra schermate');
console.log('  - openClue() - Apre l\'indizio del tesoro');
console.log('  - triggerFileInput() - Carica foto');
console.log('  - openTreasureHistory() - Cronologia tesori');
console.log('  - openBadges() - Badge e ricompense');
console.log('  - openSecurityCenter() - Centro sicurezza');
console.log('  - openPrivacySettings() - Impostazioni privacy');
console.log('  - openCityLeaderboard() - Classifica cittadina');
console.log('  - AudioSystem - Gestione audio');