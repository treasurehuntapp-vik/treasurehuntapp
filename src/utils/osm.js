// ============================================================
// UTILITY PER OPENSTREETMAP
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
    const name = landmark.name?.toLowerCase() || '';
    const type = landmark.type || '';
    
    // Parole che indicano luoghi NON sicuri o PRIVATI
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
    
    // Controlla se il nome contiene parole proibite
    for (const keyword of unsafeKeywords) {
        if (name.includes(keyword)) {
            console.log(`⚠️ Escluso: ${landmark.name} (contiene "${keyword}")`);
            return false;
        }
    }
    
    // Controlla il tipo
    const unsafeTypes = ['hotel', 'restaurant', 'shop', 'school', 'hospital', 'bank', 'post_office'];
    if (unsafeTypes.includes(type)) {
        console.log(`⚠️ Escluso: ${landmark.name} (tipo "${type}")`);
        return false;
    }
    
    return true;
}

/**
 * Luoghi predefiniti per Ivrea (ULTIMA SPIAGGIA)
 */
function getIvreaLandmarks() {
    return [
        { name: '🏰 Castello di Ivrea', lat: 45.46875, lon: 7.88430, type: 'castle', category: 'libro' },
        { name: '🌉 Ponte Vecchio', lat: 45.46445, lon: 7.87940, type: 'tourism', category: 'giocattolo' },
        { name: '⛪ Cattedrale di Ivrea', lat: 45.46715, lon: 7.88395, type: 'place_of_worship', category: 'biglietto' },
        { name: '🏛️ Piazza Ottinetti', lat: 45.46750, lon: 7.88280, type: 'tourism', category: 'souvenir' },
        { name: '🏭 Museo Olivetti', lat: 45.46820, lon: 7.88590, type: 'museum', category: 'altro' },
        { name: '🌳 Parco della Polveriera', lat: 45.46300, lon: 7.88200, type: 'park', category: 'souvenir' },
        { name: '🎭 Teatro Giacosa', lat: 45.46650, lon: 7.88450, type: 'tourism', category: 'libro' }
    ];
}

/**
 * Luoghi predefiniti per Torino (ULTIMA SPIAGGIA)
 */
function getTorinoLandmarks() {
    return [
        { name: '🏛️ Piazza Castello', lat: 45.07030, lon: 7.68690, type: 'tourism', category: 'libro' },
        { name: '🏛️ Museo Egizio', lat: 45.06840, lon: 7.68430, type: 'museum', category: 'altro' },
        { name: '🏛️ Palazzo Reale', lat: 45.07160, lon: 7.68600, type: 'castle', category: 'libro' },
        { name: '⛪ Duomo di Torino', lat: 45.07310, lon: 7.68540, type: 'place_of_worship', category: 'biglietto' },
        { name: '🌳 Parco del Valentino', lat: 45.05500, lon: 7.68600, type: 'park', category: 'souvenir' },
        { name: '🏛️ Mole Antonelliana', lat: 45.06890, lon: 7.69340, type: 'tourism', category: 'souvenir' },
        { name: '🏛️ Porta Palatina', lat: 45.07500, lon: 7.68440, type: 'historic', category: 'libro' }
    ];
}

/**
 * 🔥 LUOGHI DI DEFAULT MIGLIORATI (se OpenStreetMap non risponde)
 */
function getDefaultLandmarks(lat, lng) {
    const offset = 0.002;
    
    // Nomi specifici per città italiane
    const cityNames = [
        'Torre Antica', 'Giardino Segreto', 'Museo Civico', 'Piazza Centrale', 'Chiesa Vecchia',
        'Palazzo Storico', 'Villa Nobiliare', 'Teatro Comunale', 'Biblioteca Antica', 'Giardino Botanico'
    ];
    
    const types = ['castle', 'park', 'museum', 'tourism', 'place_of_worship'];
    const categories = ['libro', 'giocattolo', 'biglietto', 'souvenir', 'altro'];
    const emojis = ['🏰', '🌳', '🏛️', '📍', '⛪'];
    
    const landmarks = [];
    
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * 2 * Math.PI;
        const dist = offset * (1 + i * 0.2);
        const latOffset = dist * Math.cos(angle);
        const lngOffset = dist * Math.sin(angle);
        
        // Scegli un nome a caso dalla lista
        const nameIndex = (i + Math.floor(Math.random() * 3)) % cityNames.length;
        const typeIndex = i % types.length;
        
        landmarks.push({
            name: `${emojis[i % emojis.length]} ${cityNames[nameIndex]}`,
            lat: lat + latOffset,
            lon: lng + lngOffset,
            type: types[typeIndex],
            category: categories[i % categories.length]
        });
    }
    
    console.log('📍 Generati luoghi di default con nomi specifici');
    return landmarks;
}

/**
 * Ottiene i luoghi iconici di una città da OpenStreetMap
 * PRIMA prova OpenStreetMap, POI usa i predefiniti come ultima spiaggia
 */
export async function getCityLandmarks(lat, lng, radius = 3000) {
    try {
        // ============================================================
        // TENTATIVO 1: Overpass API (PRIMA SEMPRE)
        // ============================================================
        console.log('🔄 Richiesta a OpenStreetMap (Overpass)...');
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
                .map(el => ({
                    name: el.tags.name,
                    lat: el.lat,
                    lon: el.lon,
                    type: getTypeFromTags(el.tags),
                    category: getCategoryFromTags(el.tags)
                }))
                .filter((el, index, self) => 
                    index === self.findIndex(e => e.name === el.name)
                )
                // 🔥 FILTRO DI SICUREZZA: esclude hotel, ristoranti, negozi, ecc.
                .filter(el => isSafeLandmark(el))
                .slice(0, 8);

            if (landmarks.length > 0) {
                console.log(`📍 Trovati ${landmarks.length} luoghi da OpenStreetMap (Overpass)`);
                return landmarks;
            }
        }

        // ============================================================
        // TENTATIVO 2: Nominatim (SECONDO)
        // ============================================================
        console.log('🔄 Overpass non ha trovato luoghi, provo con Nominatim...');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=monumento+chiesa+castello+museo+parco&bounded=1&viewbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&limit=10&accept-language=it`;
        
        const nomResponse = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'CacciaAlTesoro/1.0 (https://github.com/treasurehuntapp-vik/treasurehuntapp)'
            }
        });

        if (nomResponse.ok) {
            const data = await nomResponse.json();
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
                .filter(el => isSafeLandmark(el)) // 🔥 FILTRO DI SICUREZZA
                .slice(0, 5);

            if (landmarks.length > 0) {
                console.log(`📍 Trovati ${landmarks.length} luoghi da Nominatim`);
                return landmarks;
            }
        }

        // ============================================================
        // TENTATIVO 3: Luoghi predefiniti (ULTIMA SPIAGGIA)
        // ============================================================
        console.log('⚠️ OpenStreetMap non ha risposto, uso luoghi predefiniti...');
        
        // Controllo per Ivrea
        const ivreaLat = 45.4660;
        const ivreaLng = 7.8830;
        const distanceToIvrea = calculateDistance(lat, lng, ivreaLat, ivreaLng);
        if (distanceToIvrea < 15000) {
            console.log('📍 Rilevata Ivrea, uso luoghi predefiniti...');
            return getIvreaLandmarks();
        }
        
        // Controllo per Torino
        const torinoLat = 45.0703;
        const torinoLng = 7.6869;
        const distanceToTorino = calculateDistance(lat, lng, torinoLat, torinoLng);
        if (distanceToTorino < 15000) {
            console.log('📍 Rilevata Torino, uso luoghi predefiniti...');
            return getTorinoLandmarks();
        }

        // Fallback generico - ora con nomi specifici!
        console.log('📍 Genero luoghi di default con nomi specifici...');
        return getDefaultLandmarks(lat, lng);

    } catch (error) {
        console.error('❌ Errore OpenStreetMap:', error);
        return getDefaultLandmarks(lat, lng);
    }
}

/**
 * Determina il tipo in base ai tag OpenStreetMap
 */
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

/**
 * Determina la categoria in base ai tag OpenStreetMap
 */
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
 * Ottiene il nome della città dalle coordinate (reverse geocoding)
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
            return 'Citta Sconosciuta';
        }

        const data = await response.json();
        
        if (data.address) {
            const city = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.municipality ||
                        data.address.county ||
                        'Citta Sconosciuta';
            return city;
        }

        return 'Citta Sconosciuta';

    } catch (error) {
        console.error('❌ Errore reverse geocoding:', error);
        return 'Citta Sconosciuta';
    }
}