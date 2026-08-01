// ============================================================
// UTILITY PER OPENSTREETMAP - VERSIONE CON FALLBACK LOCALE
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
 * 🏙️ LUOGHI PREDEFINITI PER CITTÀ ITALIANE
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
                { name: '🌳 Parco della Polveriera', lat: 45.46300, lon: 7.88200, type: 'park', category: 'souvenir' }
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
                { name: '🏛️ Mole Antonelliana', lat: 45.06890, lon: 7.69340, type: 'tourism', category: 'souvenir' }
            ]
        },
        {
            name: 'Milano',
            center: { lat: 45.4642, lng: 9.1900 },
            landmarks: [
                { name: '🏛️ Duomo di Milano', lat: 45.4641, lon: 9.1919, type: 'place_of_worship', category: 'biglietto' },
                { name: '🏛️ Galleria Vittorio Emanuele', lat: 45.4658, lon: 9.1904, type: 'tourism', category: 'souvenir' },
                { name: '🏰 Castello Sforzesco', lat: 45.4705, lon: 9.1791, type: 'castle', category: 'libro' },
                { name: '🎭 Teatro alla Scala', lat: 45.4670, lon: 9.1885, type: 'tourism', category: 'libro' },
                { name: '🌳 Parco Sempione', lat: 45.4740, lon: 9.1760, type: 'park', category: 'souvenir' }
            ]
        }
    ];
    
    for (const city of cities) {
        const distance = calculateDistance(lat, lng, city.center.lat, city.center.lng);
        if (distance < 15000) {
            console.log(`📍 Rilevata ${city.name}, uso luoghi predefiniti...`);
            return city.landmarks;
        }
    }
    
    return [];
}

/**
 * 🛡️ FALLBACK DI SICUREZZA - GENERA LUOGHI PLAUSIBILI VICINI ALL'UTENTE
 */
function getSafeFallbackLandmarks(lat, lng) {
    // Nomi di luoghi tipici italiani
    const emojis = ['🏛️', '⛪', '🌳', '🏰', '🏛️'];
    const types = ['tourism', 'place_of_worship', 'park', 'castle', 'museum'];
    const categories = ['souvenir', 'biglietto', 'souvenir', 'libro', 'altro'];
    
    // Genera 5 luoghi con coordinate reali e plausibili
    const landmarks = [];
    const radius = 0.003; // ~300 metri di raggio
    
    for (let i = 0; i < 5; i++) {
        // Angolo diverso per ogni punto
        const angle = (i / 5) * 2 * Math.PI + 0.3;
        const distance = radius * (0.6 + i * 0.15);
        
        // Calcola coordinate reali
        const latOffset = distance * Math.cos(angle);
        const lngOffset = distance * Math.sin(angle);
        
        const placeLat = lat + latOffset;
        const placeLng = lng + lngOffset;
        
        // Scegli un nome dalla lista
        let name = '';
        if (i === 0) {
            name = 'Piazza Centrale';
        } else if (i === 1) {
            name = 'Chiesa Parrocchiale';
        } else if (i === 2) {
            name = 'Parco Pubblico';
        } else if (i === 3) {
            name = 'Monumento Storico';
        } else if (i === 4) {
            name = 'Biblioteca Comunale';
        }
        
        landmarks.push({
            name: `${emojis[i % emojis.length]} ${name}`,
            lat: placeLat,
            lon: placeLng,
            type: types[i % types.length],
            category: categories[i % categories.length]
        });
    }
    
    console.log(`📍 Generati ${landmarks.length} luoghi plausibili vicini all'utente`);
    return landmarks;
}

/**
 * 🗺️ OTTIENE I LUOGHI ICONICI
 */
export async function getCityLandmarks(lat, lng, radius = 3000) {
    console.log(`📍 Ricerca luoghi per: ${lat}, ${lng}`);
    
    // Tentativo 1: Overpass API
    let landmarks = await searchOpenStreetMap(lat, lng, radius, 10);
    if (landmarks.length >= 5) {
        return landmarks.slice(0, 5);
    }
    
    // Tentativo 2: Overpass con raggio maggiore
    if (landmarks.length < 5) {
        console.log(`🔍 Trovati solo ${landmarks.length} luoghi, aumento il raggio a 10km...`);
        landmarks = await searchOpenStreetMap(lat, lng, 10000, 10);
        if (landmarks.length >= 5) {
            return landmarks.slice(0, 5);
        }
    }
    
    // Tentativo 3: Nominatim
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
    
    // Tentativo 4: Luoghi predefiniti per città
    if (landmarks.length < 3) {
        console.log('⚠️ Uso luoghi predefiniti per città...');
        const defaultLandmarks = getDefaultLandmarksForCity(lat, lng);
        if (defaultLandmarks.length > 0) {
            return defaultLandmarks;
        }
    }
    
    // Ultima spiaggia: luoghi plausibili locali
    if (landmarks.length > 0) {
        console.log(`⚠️ Trovati solo ${landmarks.length} luoghi, ma li uso comunque.`);
        return landmarks;
    }
    
    // Fallback finale: luoghi plausibili vicini all'utente
    console.log('⚠️ Nessun luogo trovato, genero luoghi plausibili vicini...');
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
        
        if (!response.ok) return 'Città Sconosciuta';
        const data = await response.json();
        
        if (data.address) {
            return data.address.city || data.address.town || data.address.village || 
                   data.address.municipality || data.address.county || 'Città Sconosciuta';
        }
        return 'Città Sconosciuta';
    } catch (error) {
        console.error('❌ Errore reverse geocoding:', error);
        return 'Città Sconosciuta';
    }
}