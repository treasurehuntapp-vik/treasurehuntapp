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
// 15. CARICAMENTO FOTO - VERSIONE CORRETTA
// ============================================================

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

function handleFileSelect(e) {
    console.log('📸 Evento change catturato!');
    
    const input = e.target;
    const file = input.files[0];
    
    if (!file) {
        console.log('⚠️ Nessun file selezionato');
        return;
    }
    
    console.log('📸 File selezionato:', file.name, file.size, file.type);
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('❌ La foto è troppo grande (max 5MB)');
        input.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('❌ Il file deve essere un\'immagine');
        input.value = '';
        return;
    }
    
    hidePhotoFile = file;
    console.log('📸 File salvato in hidePhotoFile');
    
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
    
    input.value = '';
}

function triggerFileInput() {
    console.log('📸 triggerFileInput chiamato');
    
    const input = document.getElementById('hide-photo-input');
    if (!input) {
        console.error('❌ Input file non trovato');
        showToast('⚠️ Errore: input non trovato');
        return;
    }
    
    input.value = '';
    input.click();
    console.log('📸 File input aperto (resettato)');
}

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

function saveHidePhotoAndGoToStep2() {
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

function goToStep(step) {
    if (step < 1 || step > 4) return;

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    document.querySelectorAll('.step-indicator .step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === step) el.classList.add('active');
        else if (s < step) el.classList.add('done');
    });

    if (step === 1) {
        setTimeout(() => initHidePhoto(), 100);
    }
    if (step === 2) {
        setTimeout(() => {
            if (typeof initHideMap === 'function') {
                initHideMap();
            }
        }, 300);
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
                console.warn('⚠️ initMap non definita, provo a definirla...');
                if (typeof L !== 'undefined') {
                    console.log('✅ Leaflet disponibile, inizializzo mappa...');
                    initializeMap();
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
// 17. INIZIALIZZA MAPPA (FALLBACK)
// ============================================================

function initializeMap() {
    console.log('🗺️ Inizializzazione mappa da frontend.js...');
    
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
// 18. CARICA TESORI REALI DAL BACKEND
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
// 19. SISTEMA AUDIO
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
// 20. FUNZIONE PER PULIRE I MARKER
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
// 21. FUNZIONE PER AGGIUNGERE MARKER
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

// App - TESORI STARTER
window.startApp = startApp;
window.loadRealTreasures = loadRealTreasures;
window.generateStartersForUser = generateStartersForUser;
window.clearTreasureMarkers = clearTreasureMarkers;
window.addRealTreasureMarker = addRealTreasureMarker;

// Caricamento Foto
window.initHidePhoto = initHidePhoto;
window.handleFileSelect = handleFileSelect;
window.triggerFileInput = triggerFileInput;
window.clearHidePhoto = clearHidePhoto;
window.saveHidePhotoAndGoToStep2 = saveHidePhotoAndGoToStep2;
window.goToStep = goToStep;

// Mappa
window.initMap = initMap;
window.initializeMap = initializeMap;
window.centerOnUser = centerOnUser;

console.log('✅ frontend.js caricato correttamente!');
console.log('🔧 Funzioni disponibili:');
console.log('  - registerUser(), loginUser()');
console.log('  - getNearbyTreasures(), createTreasure()');
console.log('  - getLeaderboard(), getKarmaHistory()');
console.log('  - handleLogin(), handleRegister(), handleLogout()');
console.log('  - startApp() - Avvia la mappa e genera starter');
console.log('  - loadRealTreasures() - Carica i tesori');
console.log('  - generateStartersForUser() - Genera tesori starter');
console.log('  - triggerFileInput() - Carica foto (FIX applicato!)');
console.log('  - initMap() - Inizializza la mappa');
console.log('  - AudioSystem - Gestione audio');