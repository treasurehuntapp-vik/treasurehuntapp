// ============================================================
// MIDDLEWARE DI VALIDAZIONE
// ============================================================

// Valida la registrazione
const validateRegistration = (req, res, next) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email e password sono obbligatori'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'La password deve essere di almeno 8 caratteri'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email non valida'
        });
    }

    next();
};

// Valida la creazione di un tesoro
const validateTreasure = (req, res, next) => {
    const { title, clue, latitude, longitude, category } = req.body;

    if (!title || !clue || !latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: 'Titolo, indizio, latitudine e longitudine sono obbligatori'
        });
    }

    if (title.length < 3 || title.length > 200) {
        return res.status(400).json({
            success: false,
            message: 'Il titolo deve essere tra 3 e 200 caratteri'
        });
    }

    if (clue.length < 10 || clue.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'L\'indizio deve essere tra 10 e 500 caratteri'
        });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Latitudine e longitudine devono essere numeri'
        });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
            success: false,
            message: 'Coordinate non valide'
        });
    }

    // Categorie consentite
    const validCategories = ['libro', 'giocattolo', 'biglietto', 'souvenir', 'altro'];
    if (category && !validCategories.includes(category)) {
        return res.status(400).json({
            success: false,
            message: 'Categoria non valida. Scegli tra: ' + validCategories.join(', ')
        });
    }

    next();
};

// Valida la segnalazione
const validateReport = (req, res, next) => {
    const { reason, description } = req.body;

    const validReasons = ['pericoloso', 'luogo_inappropriato', 'falso', 'comportamento_sospetto', 'altro'];
    if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({
            success: false,
            message: 'Motivo non valido. Scegli tra: ' + validReasons.join(', ')
        });
    }

    if (description && description.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'La descrizione non può superare i 500 caratteri'
        });
    }

    next();
};

export  {
    validateRegistration,
    validateTreasure,
    validateReport
};
