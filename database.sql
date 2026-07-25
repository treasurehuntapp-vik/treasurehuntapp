-- ============================================================
-- Database: caccia_tesoro
-- ============================================================

-- Tabelle

-- 1. UTENTI
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    
    -- Livelli di fiducia
    trust_level VARCHAR(20) DEFAULT 'explorer', -- explorer, hunter, master, legend
    verified BOOLEAN DEFAULT FALSE,
    spid_verified BOOLEAN DEFAULT FALSE,
    
    -- Statistiche
    karma INTEGER DEFAULT 0,
    treasures_found INTEGER DEFAULT 0,
    treasures_hidden INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Profilo
    avatar_url VARCHAR(255),
    bio TEXT,
    city VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Italy',
    
    -- Sicurezza
    device_id VARCHAR(255),
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TESORI
CREATE TABLE treasures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Creatore
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dati del tesoro
    title VARCHAR(200) NOT NULL,
    clue TEXT NOT NULL,
    category VARCHAR(50), -- libro, giocattolo, biglietto, souvenir, altro
    photo_url VARCHAR(255),
    
    -- Posizione (coordinate reali)
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    address TEXT,
    
    -- Stato
    status VARCHAR(20) DEFAULT 'active', -- active, found, reported, removed, relic
    
    -- Sistema Reliquie
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    found_at TIMESTAMP,
    becomes_relic_at TIMESTAMP,
    is_relic BOOLEAN DEFAULT FALSE,
    
    -- Karma
    karma_value INTEGER DEFAULT 10,
    
    -- Approvazione
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Contatori
    find_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RICERCHE TROVATE (log delle scoperte)
CREATE TABLE treasure_finds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treasure_id UUID REFERENCES treasures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    karma_earned INTEGER DEFAULT 5,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedback TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);

-- 4. SEGNALAZIONI (report per sicurezza)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treasure_id UUID REFERENCES treasures(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL, -- pericoloso, luogo_inappropriato, falso, altro
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, dismissed, action_taken
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id)
);

-- 5. KARMA TRANSACTIONS (storico di ogni movimento)
CREATE TABLE karma_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(50), -- find_treasure, hide_treasure, report, relic, daily_streak
    reference_id UUID, -- può essere treasure_id o altro
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. NOTIFICHE (per future push)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- relic_awakened, treasure_found, report_status, etc.
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_treasures_location ON treasures (latitude, longitude);
CREATE INDEX idx_treasures_status ON treasures (status);
CREATE INDEX idx_treasures_created ON treasures (created_at);
CREATE INDEX idx_treasures_user ON treasures (user_id);
CREATE INDEX idx_reports_treasure ON reports (treasure_id);
CREATE INDEX idx_karma_user ON karma_transactions (user_id);
CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_phone ON users (phone);

-- ============================================================
-- Trigger: aggiorna updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_treasures_updated_at
BEFORE UPDATE ON treasures
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger: aggiorna karma utente quando trova un tesoro
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_karma_on_find()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        karma = karma + NEW.karma_earned,
        treasures_found = treasures_found + 1,
        streak_days = CASE 
            WHEN last_active::DATE = CURRENT_DATE - INTERVAL '1 day' 
            THEN streak_days + 1 
            ELSE 0 
        END,
        last_active = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_treasure_find
AFTER INSERT ON treasure_finds
FOR EACH ROW EXECUTE FUNCTION update_user_karma_on_find();
