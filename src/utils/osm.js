// ============================================================
// UTILITY PER OPENSTREETMAP - VERSIONE CON LUOGHI REALI
// ============================================================

/**
 * Calcola la distanza tra due coordinate
 */
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

/**
 * Verifica se un luogo è sicuro per un tesoro
 */
function isSafeLandmark(landmark) {
    const name = (landmark.name || '').toLowerCase();
    const type = landmark.type || '';
    
    const unsafeKeywords = [
        'hotel', 'ristorante', 'bar', 'caffè', 'negozio', 'supermercato',
        'scuola', 'liceo', 'istituto', 'università', 'asilo',
        'ospedale', 'clinica', 'ambulatorio', 'casa di cura',
        'municipio', 'comune', 'ufficio', 'sede', 'palazzo',
        'privato', 'residenza', 'condominio', 'abitazione',
        'strada', 'via', 'corso', 'autostrada', 'tangenziale',
        'ferrovia', 'stazione', 'binario', 'treno',
        'cantiere', 'costruzione', 'lavori', 'scavi',
        'stabilimento', 'fabbrica', 'industria',
        'caserma', 'polizia', 'carabinieri', 'vigili',
        'banca', 'poste', 'ufficio postale',
        'cimitero', 'obitorio'
    ];
    
    for (const keyword of unsafeKeywords) {
        if (name.includes(keyword)) {
            console.log(`⚠️ Escluso: ${landmark.name} (contiene "${keyword}")`);
            return false;
        }
    }
    
    const unsafeTypes = ['hotel', 'restaurant', 'shop', 'school', 'hospital', 'bank', 'post_office'];
    if (unsafeTypes.includes(type)) {
        console.log(`⚠️ Escluso: ${landmark.name} (tipo "${type}")`);
        return false;
    }
    
    return true;
}

/**
 * 🔥 RICERCA AMPIA SU OPENSTREETMAP
 */
async function searchOpenStreetMap(lat, lng, radius = 5000, maxResults = 10) {
    try {
        const overpassQuery = `
            [out:json];
            (
                node["historic"](around:${radius},${lat},${lng});
                node["tourism"](around:${radius},${lat},${lng});
                node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
                node["leisure"="park"](around:${radius},${lat},${lng});
                node["historic"="castle"](around:${radius},${lat},${lng});
                node["amenity"="museum"](around:${radius},${lat},${lng});
                node["amenity"="library"](around:${radius},${lat},${lng});
                node["tourism"="attraction"](around:${radius},${lat},${lng});
                node["tourism"="artwork"](around:${radius},${lat},${lng});
                node["leisure"="garden"](around:${radius},${lat},${lng});
                node["amenity"="theatre"](around:${radius},${lat},${lng});
                node["amenity"="cinema"](around:${radius},${lat},${lng});
                way["historic"](around:${radius},${lat},${lng});
                way["tourism"](around:${radius},${lat},${lng});
                relation["historic"](around:${radius},${lat},${lng});
                relation["tourism"](around:${radius},${lat},${lng});
            );
            out body;
        `;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CacciaAlTesoro/1.0 (https://github.com/treasurehuntapp-vik/treasurehuntapp)'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const landmarks = data.elements
                .filter(el => el.tags && el.tags.name)
                .map(el => {
                    let lat = el.lat;
                    let lon = el.lon;
                    if (el.center) {
                        lat = el.center.lat;
                        lon = el.center.lon;
                    }
                    return {
                        name: el.tags.name,
                        lat: lat || el.lat,
                        lon: lon || el.lon,
                        type: getTypeFromTags(el.tags),
                        category: getCategoryFromTags(el.tags)
                    };
                })
                .filter(el => el.lat && el.lon)
                .filter((el, index, self) => 
                    index === self.findIndex(e => e.name === el.name)
                )
                .filter(el => isSafeLandmark(el))
                .slice(0, maxResults);

            if (landmarks.length > 0) {
                console.log(`📍 Trovati ${landmarks.length} luoghi da OpenStreetMap (Overpass)`);
                return landmarks;
            }
        }
        return [];
    } catch (error) {
        console.error('❌ Errore Overpass:', error.message);
        return [];
    }
}

/**
 * 🔥 RICERCA CON NOMINATIM
 */
async function searchNominatim(lat, lng, maxResults = 8) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=monumento+chiesa+castello+museo+parco+attrazione&bounded=1&viewbox=${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}&limit=15&accept-language=it`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CacciaAlTesoro/1.0 (https://github.com/treasurehuntapp-vik/treasurehuntapp)'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const landmarks = data
                .filter(el => {
                    const name = el.display_name || '';
                    const type = el.type || '';
                    return name.length > 5 && 
                           !name.includes('strada') &&
                           !name.includes('via') &&
                           !name.includes('corso') &&
                           !name.includes('piazza') &&
                           type !== 'road' &&
                           type !== 'street';
                })
                .map(el => {
                    let name = el.display_name.split(',')[0] || el.display_name;
                    name = name.replace(/^IT\s*/i, '').trim();
                    return {
                        name: name,
                        lat: parseFloat(el.lat),
                        lon: parseFloat(el.lon),
                        type: 'tourism',
                        category: 'libro'
                    };
                })
                .filter(el => isSafeLandmark(el))
                .slice(0, maxResults);

            if (landmarks.length > 0) {
                console.log(`📍 Trovati ${landmarks.length} luoghi da Nominatim`);
                return landmarks;
            }
        }
        return [];
    } catch (error) {
        console.error('❌ Errore Nominatim:', error.message);
        return [];
    }
}

/**
 * 🏙️ LUOGHI PREDEFINITI PER CITTÀ (PRIORITÀ ASSOLUTA)
 */
function getDefaultLandmarksForCity(lat, lng) {
    const cities = [
        {
            name: 'Ivrea',
            center: { lat: 45.4660, lng: 7.8830 },
            landmarks: [
                { name: '🏰 Castello di Ivrea', lat: 45.46875, lon: 7.88430, type: 'castle', category: 'libro' },
                { name: '🌉 Ponte Vecchio', lat: 45.46445, lon: 7.87940, type: 'tourism', category: 'giocattolo' },
                { name: '⛪ Cattedrale di Ivrea', lat: 45.46715, lon: 7.88395, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Piazza Ottinetti', lat: 45.46750, lon: 7.88280, type: 'tourism', category: 'souvenir' },
                { name: '🏭 Museo Olivetti', lat: 45.46820, lon: 7.88590, type: 'museum', category: 'altro' },
                { name: '🌳 Parco della Polveriera', lat: 45.46300, lon: 7.88200, type: 'park', category: 'souvenir' },
                { name: '🎭 Teatro Giacosa', lat: 45.46650, lon: 7.88450, type: 'tourism', category: 'libro' },
                { name: '🏛️ Palazzo Vescovile', lat: 45.46680, lon: 7.88410, type: 'castle', category: 'libro' },
                { name: '🌳 Giardino della Biblioteca', lat: 45.46730, lon: 7.88340, type: 'park', category: 'souvenir' },
                { name: '⛪ Chiesa di San Bernardino', lat: 45.46840, lon: 7.88250, type: 'place_of_worship', category: 'biglietto' }
            ]
        },
        {
            name: 'Torino',
            center: { lat: 45.0703, lng: 7.6869 },
            landmarks: [
                { name: '🏛️ Piazza Castello', lat: 45.07030, lon: 7.68690, type: 'tourism', category: 'libro' },
                { name: '🏛️ Museo Egizio', lat: 45.06840, lon: 7.68430, type: 'museum', category: 'altro' },
                { name: '🏛️ Palazzo Reale', lat: 45.07160, lon: 7.68600, type: 'castle', category: 'libro' },
                { name: '⛪ Duomo di Torino', lat: 45.07310, lon: 7.68540, type: 'place_of_worship', category: 'biglietto' },
                { name: '🌳 Parco del Valentino', lat: 45.05500, lon: 7.68600, type: 'park', category: 'souvenir' },
                { name: '🏛️ Mole Antonelliana', lat: 45.06890, lon: 7.69340, type: 'tourism', category: 'souvenir' },
                { name: '🏛️ Porta Palatina', lat: 45.07500, lon: 7.68440, type: 'historic', category: 'libro' },
                { name: '🏛️ Galleria Sabauda', lat: 45.07100, lon: 7.68550, type: 'museum', category: 'altro' }
            ]
        },
        {
            name: 'Milano',
            center: { lat: 45.4642, lng: 9.1900 },
            landmarks: [
                { name: '🏛️ Duomo di Milano', lat: 45.46410, lon: 9.19190, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Galleria Vittorio Emanuele', lat: 45.46580, lon: 9.19040, type: 'tourism', category: 'souvenir' },
                { name: '🏰 Castello Sforzesco', lat: 45.47050, lon: 9.17910, type: 'castle', category: 'libro' },
                { name: '🎭 Teatro alla Scala', lat: 45.46700, lon: 9.18850, type: 'tourism', category: 'libro' },
                { name: '🌳 Parco Sempione', lat: 45.47400, lon: 9.17600, type: 'park', category: 'souvenir' },
                { name: '⛪ Basilica di Sant\'Ambrogio', lat: 45.46230, lon: 9.17550, type: 'place_of_worship', category: 'biglietto' }
            ]
        },
        {
            name: 'Roma',
            center: { lat: 41.9028, lng: 12.4964 },
            landmarks: [
                { name: '🏛️ Colosseo', lat: 41.89020, lon: 12.49220, type: 'castle', category: 'libro' },
                { name: '⛪ Basilica di San Pietro', lat: 41.90220, lon: 12.45390, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Piazza Navona', lat: 41.89930, lon: 12.47330, type: 'tourism', category: 'souvenir' },
                { name: '🏛️ Fontana di Trevi', lat: 41.90090, lon: 12.48330, type: 'tourism', category: 'souvenir' },
                { name: '🌳 Villa Borghese', lat: 41.91400, lon: 12.48400, type: 'park', category: 'souvenir' },
                { name: '🏛️ Pantheon', lat: 41.89860, lon: 12.47690, type: 'place_of_worship', category: 'biglietto' }
            ]
        },
        {
            name: 'Firenze',
            center: { lat: 43.7696, lng: 11.2558 },
            landmarks: [
                { name: '⛪ Duomo di Firenze', lat: 43.77310, lon: 11.25600, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Piazza della Signoria', lat: 43.76960, lon: 11.25570, type: 'tourism', category: 'souvenir' },
                { name: '🏛️ Piazza dei Miracoli', lat: 43.72310, lon: 10.39660, type: 'tourism', category: 'souvenir' },
                { name: '🏛️ Palazzo Vecchio', lat: 43.76930, lon: 11.25620, type: 'castle', category: 'libro' },
                { name: '🌳 Giardino di Boboli', lat: 43.76500, lon: 11.25100, type: 'park', category: 'souvenir' }
            ]
        },
        {
            name: 'Venezia',
            center: { lat: 45.4343, lng: 12.3388 },
            landmarks: [
                { name: '🏛️ Piazza San Marco', lat: 45.43430, lon: 12.33880, type: 'tourism', category: 'souvenir' },
                { name: '🌉 Ponte di Rialto', lat: 45.43800, lon: 12.33500, type: 'tourism', category: 'giocattolo' },
                { name: '⛪ Basilica di San Marco', lat: 45.43440, lon: 12.33970, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Palazzo Ducale', lat: 45.43450, lon: 12.34000, type: 'castle', category: 'libro' },
                { name: '🌳 Giardini della Biennale', lat: 45.42890, lon: 12.35720, type: 'park', category: 'souvenir' }
            ]
        },
        {
            name: 'Napoli',
            center: { lat: 40.8518, lng: 14.2681 },
            landmarks: [
                { name: '🏛️ Palazzo Reale di Napoli', lat: 40.83640, lon: 14.24920, type: 'castle', category: 'libro' },
                { name: '⛪ Duomo di Napoli', lat: 40.85250, lon: 14.25920, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Castel dell\'Ovo', lat: 40.82820, lon: 14.24760, type: 'castle', category: 'libro' },
                { name: '🌳 Villa Comunale', lat: 40.83300, lon: 14.24500, type: 'park', category: 'souvenir' },
                { name: '🏛️ Museo Archeologico', lat: 40.85330, lon: 14.25080, type: 'museum', category: 'altro' }
            ]
        }
    ];
    
    for (const city of cities) {
        const distance = calculateDistance(lat, lng, city.center.lat, city.center.lng);
        if (distance < 15000) { // 15km di raggio
            console.log(`📍 Rilevata ${city.name}, uso ${city.landmarks.length} luoghi predefiniti...`);
            return city.landmarks;
        }
    }
    
    return [];
}

/**
 * 🛡️ FALLBACK DI SICUREZZA - USA SOLO LUOGHI REALI DAL DATABASE
 */
function getSafeFallbackLandmarks(lat, lng) {
    // Database di luoghi REALI in Italia con coordinate PRECISE
    const realPlaces = [
        // Ivrea
        { name: '🏰 Castello di Ivrea', lat: 45.46875, lon: 7.88430, type: 'castle', category: 'libro' },
        { name: '⛪ Cattedrale di Ivrea', lat: 45.46715, lon: 7.88395, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Piazza Ottinetti', lat: 45.46750, lon: 7.88280, type: 'tourism', category: 'souvenir' },
        { name: '🌉 Ponte Vecchio', lat: 45.46445, lon: 7.87940, type: 'tourism', category: 'giocattolo' },
        { name: '🏭 Museo Olivetti', lat: 45.46820, lon: 7.88590, type: 'museum', category: 'altro' },
        { name: '🌳 Parco della Polveriera', lat: 45.46300, lon: 7.88200, type: 'park', category: 'souvenir' },
        
        // Torino
        { name: '🏛️ Piazza Castello', lat: 45.07030, lon: 7.68690, type: 'tourism', category: 'libro' },
        { name: '🏛️ Museo Egizio', lat: 45.06840, lon: 7.68430, type: 'museum', category: 'altro' },
        { name: '🏛️ Palazzo Reale', lat: 45.07160, lon: 7.68600, type: 'castle', category: 'libro' },
        { name: '⛪ Duomo di Torino', lat: 45.07310, lon: 7.68540, type: 'place_of_worship', category: 'biglietto' },
        { name: '🌳 Parco del Valentino', lat: 45.05500, lon: 7.68600, type: 'park', category: 'souvenir' },
        { name: '🏛️ Mole Antonelliana', lat: 45.06890, lon: 7.69340, type: 'tourism', category: 'souvenir' },
        
        // Milano
        { name: '🏛️ Duomo di Milano', lat: 45.46410, lon: 9.19190, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Galleria Vittorio Emanuele', lat: 45.46580, lon: 9.19040, type: 'tourism', category: 'souvenir' },
        { name: '🏰 Castello Sforzesco', lat: 45.47050, lon: 9.17910, type: 'castle', category: 'libro' },
        { name: '🎭 Teatro alla Scala', lat: 45.46700, lon: 9.18850, type: 'tourism', category: 'libro' },
        { name: '🌳 Parco Sempione', lat: 45.47400, lon: 9.17600, type: 'park', category: 'souvenir' },
        
        // Roma
        { name: '🏛️ Colosseo', lat: 41.89020, lon: 12.49220, type: 'castle', category: 'libro' },
        { name: '⛪ Basilica di San Pietro', lat: 41.90220, lon: 12.45390, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Piazza Navona', lat: 41.89930, lon: 12.47330, type: 'tourism', category: 'souvenir' },
        { name: '🏛️ Fontana di Trevi', lat: 41.90090, lon: 12.48330, type: 'tourism', category: 'souvenir' },
        { name: '🌳 Villa Borghese', lat: 41.91400, lon: 12.48400, type: 'park', category: 'souvenir' },
        
        // Firenze
        { name: '⛪ Duomo di Firenze', lat: 43.77310, lon: 11.25600, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Piazza della Signoria', lat: 43.76960, lon: 11.25570, type: 'tourism', category: 'souvenir' },
        { name: '🏛️ Piazza dei Miracoli', lat: 43.72310, lon: 10.39660, type: 'tourism', category: 'souvenir' },
        
        // Venezia
        { name: '🏛️ Piazza San Marco', lat: 45.43430, lon: 12.33880, type: 'tourism', category: 'souvenir' },
        { name: '🌉 Ponte di Rialto', lat: 45.43800, lon: 12.33500, type: 'tourism', category: 'giocattolo' },
        { name: '⛪ Basilica di San Marco', lat: 45.43440, lon: 12.33970, type: 'place_of_worship', category: 'biglietto' },
        
        // Napoli
        { name: '🏛️ Palazzo Reale di Napoli', lat: 40.83640, lon: 14.24920, type: 'castle', category: 'libro' },
        { name: '⛪ Duomo di Napoli', lat: 40.85250, lon: 14.25920, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Castel dell\'Ovo', lat: 40.82820, lon: 14.24760, type: 'castle', category: 'libro' }
    ];

    // Calcola la distanza di ogni luogo dall'utente
    const placesWithDistance = realPlaces.map(place => ({
        ...place,
        distance: calculateDistance(lat, lng, place.lat, place.lon)
    }));

    // Ordina per distanza e prendi i 5 più vicini
    const sorted = placesWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

    console.log(`📍 Usati ${sorted.length} luoghi reali come fallback`);
    return sorted;
}

/**
 * 🗺️ OTTIENE I LUOGHI ICONICI
 */
export async function getCityLandmarks(lat, lng, radius = 3000) {
    console.log(`📍 Ricerca luoghi per: ${lat}, ${lng}`);
    
    // ============================================================
    // 🔥 PRIORITÀ 1: Luoghi predefiniti per città (Ivrea, Torino, Milano, ecc.)
    // ============================================================
    const defaultLandmarks = getDefaultLandmarksForCity(lat, lng);
    if (defaultLandmarks.length >= 3) {
        console.log(`📍 Usati ${defaultLandmarks.length} luoghi predefiniti per la città`);
        return defaultLandmarks;
    }
    
    // ============================================================
    // PRIORITÀ 2: Overpass API
    // ============================================================
    let landmarks = await searchOpenStreetMap(lat, lng, radius, 10);
    if (landmarks.length >= 5) {
        console.log(`📍 Trovati ${landmarks.length} luoghi da OpenStreetMap`);
        return landmarks.slice(0, 5);
    }
    
    // ============================================================
    // PRIORITÀ 3: Overpass con raggio maggiore
    // ============================================================
    if (landmarks.length < 5) {
        console.log(`🔍 Trovati solo ${landmarks.length} luoghi, aumento il raggio a 10km...`);
        landmarks = await searchOpenStreetMap(lat, lng, 10000, 10);
        if (landmarks.length >= 5) {
            return landmarks.slice(0, 5);
        }
    }
    
    // ============================================================
    // PRIORITÀ 4: Nominatim
    // ============================================================
    if (landmarks.length < 3) {
        console.log('🔍 Provo con Nominatim...');
        const nomLandmarks = await searchNominatim(lat, lng, 10);
        if (nomLandmarks.length > landmarks.length) {
            landmarks = nomLandmarks;
        }
        if (landmarks.length >= 5) {
            return landmarks.slice(0, 5);
        }
    }
    
    // ============================================================
    // PRIORITÀ 5: Database di luoghi reali (fallback)
    // ============================================================
    if (landmarks.length < 3) {
        console.log('⚠️ Uso database di luoghi reali come fallback...');
        const fallbackLandmarks = getSafeFallbackLandmarks(lat, lng);
        if (fallbackLandmarks.length > 0) {
            return fallbackLandmarks;
        }
    }
    
    // ============================================================
    // ULTIMA SPIAGGIA: luoghi generici (MAI coordinate casuali!)
    // ============================================================
    if (landmarks.length > 0) {
        console.log(`⚠️ Trovati solo ${landmarks.length} luoghi, ma li uso comunque.`);
        return landmarks;
    }
    
    console.log('⚠️ Nessun luogo trovato, uso luoghi generici di sicurezza...');
    return getSafeFallbackLandmarks(lat, lng);
}

// ============================================================
// FUNZIONI DI SUPPORTO
// ============================================================

function getTypeFromTags(tags) {
    if (tags.historic === 'castle') return 'castle';
    if (tags.historic === 'church') return 'place_of_worship';
    if (tags.historic) return 'castle';
    if (tags.tourism === 'museum') return 'museum';
    if (tags.tourism === 'attraction') return 'tourism';
    if (tags.tourism) return 'tourism';
    if (tags.amenity === 'place_of_worship') return 'place_of_worship';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return 'tourism';
    return 'default';
}

function getCategoryFromTags(tags) {
    if (tags.historic === 'castle') return 'libro';
    if (tags.historic === 'church') return 'biglietto';
    if (tags.historic) return 'libro';
    if (tags.tourism === 'museum') return 'altro';
    if (tags.tourism === 'attraction') return 'souvenir';
    if (tags.tourism) return 'souvenir';
    if (tags.amenity === 'place_of_worship') return 'biglietto';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'souvenir';
    if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return 'souvenir';
    return 'giocattolo';
}

/**
 * Ottiene il nome della città dalle coordinate
 */
export async function getCityFromCoordinates(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=it`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CacciaAlTesoro/1.0 (https://github.com/treasurehuntapp-vik/treasurehuntapp)'
            }
        });
        
        if (!response.ok) {
            console.error('❌ Errore reverse geocoding:', response.status);
            return 'Città Sconosciuta';
        }

        const data = await response.json();
        
        if (data.address) {
            const city = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.municipality ||
                        data.address.county ||
                        'Città Sconosciuta';
            return city;
        }

        return 'Città Sconosciuta';

    } catch (error) {
        console.error('❌ Errore reverse geocoding:', error);
        return 'Città Sconosciuta';
    }
}