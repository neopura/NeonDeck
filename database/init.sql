-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#00d9ff',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL UNIQUE,
    description TEXT,
    favicon_url VARCHAR(512),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    ip_address INET,
    port INTEGER,
    protocol VARCHAR(10) DEFAULT 'https',
    status VARCHAR(20) DEFAULT 'active',
    response_time INTEGER,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_discovered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_manual BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scan history table
CREATE TABLE IF NOT EXISTS scan_history (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    services_found INTEGER DEFAULT 0,
    new_services INTEGER DEFAULT 0,
    removed_services INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running',
    error_message TEXT,
    scan_config JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_url ON services(url);
CREATE INDEX IF NOT EXISTS idx_services_last_seen ON services(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_started ON scan_history(started_at DESC);

-- Insert default categories with cyberpunk colors
INSERT INTO categories (name, icon, color, order_index) VALUES
    ('Infrastructure', 'server', '#00d9ff', 1),
    ('Monitoring', 'activity', '#ff00ff', 2),
    ('Media', 'film', '#b026ff', 3),
    ('Automation', 'zap', '#ff0080', 4),
    ('Storage', 'database', '#0080ff', 5),
    ('Development', 'code', '#00ffaa', 6),
    ('Security', 'shield', '#ff4444', 7),
    ('Networking', 'globe', '#00d9ff', 8),
    ('Other', 'box', '#888888', 99)
ON CONFLICT (name) DO NOTHING;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
