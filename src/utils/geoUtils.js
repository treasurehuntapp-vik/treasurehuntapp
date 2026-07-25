// ============================================================
// UTILITY DI GEOLOCALIZZAZIONE
// ============================================================

/**
 * Calcola la distanza tra due coordinate usando la formula di Haversine
 * @param {number} lat1 - Latitudine punto 1
 * @param {number} lng1 - Longitudine punto 1
 * @param {number} lat2 - Latitudine punto 2
 * @param {number} lng2 - Longitudine punto 2
 * @returns {number} Distanza in metri
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Raggio della Terra in metri
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Verifica se un punto è all'interno di un raggio
 * @param {number} lat - Latitudine del punto
 * @param {number} lng - Longitudine del punto
 * @param {number} centerLat - Latitudine del centro
 * @param {number} centerLng - Longitudine del centro
 * @param {number} radius - Raggio in metri
 * @returns {boolean}
 */
const isWithinRadius = (lat, lng, centerLat, centerLng, radius) => {
    const distance = calculateDistance(lat, lng, centerLat, centerLng);
    return distance <= radius;
};

/**
 * Calcola la distanza in metri e la formatta in modo leggibile
 * @param {number} distance - Distanza in metri
 * @returns {string} Distanza formattata (es. "1.2 km" o "150 m")
 */
const formatDistance = (distance) => {
    if (distance >= 1000) {
        return (distance / 1000).toFixed(1) + ' km';
    }
    return Math.round(distance) + ' m';
};

/**
 * Genera coordinate casuali intorno a un punto
 * @param {number} lat - Latitudine centro
 * @param {number} lng - Longitudine centro
 * @param {number} radius - Raggio in metri
 * @returns {{lat: number, lng: number}} Coordinate casuali
 */
const randomNearby = (lat, lng, radius) => {
    const earthRadius = 6371000;
    const angularRadius = radius / earthRadius;
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * angularRadius;

    const newLat = lat + (randomRadius * Math.cos(randomAngle)) * (180 / Math.PI);
    const newLng = lng + (randomRadius * Math.sin(randomAngle) / Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

    return { lat: newLat, lng: newLng };
};

/**
 * Verifica se un punto è in una "zona rossa" (geofencing)
 * @param {number} lat - Latitudine del punto
 * @param {number} lng - Longitudine del punto
 * @param {Array} redZones - Array di zone proibite [{lat, lng, radius}]
 * @returns {boolean|string} False se non è in zona rossa, altrimenti il nome della zona
 */
const checkRedZone = (lat, lng, redZones = []) => {
    for (const zone of redZones) {
        const distance = calculateDistance(lat, lng, zone.lat, zone.lng);
        if (distance <= zone.radius) {
            return zone.name || 'zona_proibita';
        }
    }
    return false;
};

module.exports = {
    calculateDistance,
    isWithinRadius,
    formatDistance,
    randomNearby,
    checkRedZone
};
