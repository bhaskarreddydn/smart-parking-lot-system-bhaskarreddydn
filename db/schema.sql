-- ====================================================================
-- SMART PARKING LOT SYSTEM - RELATIONAL DATABASE SCHEMA (PostgreSQL / MySQL)
-- ====================================================================

-- 1. PARKING LOTS TABLE
CREATE TABLE IF NOT EXISTS parking_lots (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    total_floors INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FLOORS TABLE
CREATE TABLE IF NOT EXISTS floors (
    id VARCHAR(36) PRIMARY KEY,
    parking_lot_id VARCHAR(36) NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lot_floor UNIQUE (parking_lot_id, floor_number)
);

-- 3. PARKING SPOTS TABLE
-- Spot Types: SMALL, MEDIUM, LARGE, ELECTRIC
CREATE TABLE IF NOT EXISTS parking_spots (
    id VARCHAR(36) PRIMARY KEY, -- e.g. "F1-S01"
    floor_id VARCHAR(36) NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    spot_number INT NOT NULL,
    spot_type VARCHAR(20) NOT NULL CHECK (spot_type IN ('SMALL', 'MEDIUM', 'LARGE', 'ELECTRIC')),
    distance_score INT NOT NULL DEFAULT 10, -- Walking distance from entry barrier
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1, -- Optimistic locking version
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_floor_spot UNIQUE (floor_id, spot_number)
);

CREATE INDEX idx_spots_availability ON parking_spots(floor_id, spot_type, is_occupied);
CREATE INDEX idx_spots_distance ON parking_spots(is_occupied, distance_score);

-- 4. VEHICLES TABLE
-- Vehicle Types: MOTORCYCLE, CAR, BUS, ELECTRIC
CREATE TABLE IF NOT EXISTS vehicles (
    license_plate VARCHAR(20) PRIMARY KEY,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('MOTORCYCLE', 'CAR', 'BUS', 'ELECTRIC')),
    owner_name VARCHAR(100),
    contact_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

-- 5. GATES TABLE
-- Gate Types: ENTRY, EXIT
CREATE TABLE IF NOT EXISTS gates (
    id VARCHAR(36) PRIMARY KEY,
    parking_lot_id VARCHAR(36) NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    gate_name VARCHAR(50) NOT NULL,
    gate_type VARCHAR(10) NOT NULL CHECK (gate_type IN ('ENTRY', 'EXIT')),
    is_operational BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PARKING TICKETS TABLE
-- Status: ACTIVE, PAID, COMPLETED, CANCELLED
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id VARCHAR(50) PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL REFERENCES vehicles(license_plate),
    spot_id VARCHAR(36) NOT NULL REFERENCES parking_spots(id),
    entry_gate_id VARCHAR(36) REFERENCES gates(id),
    exit_gate_id VARCHAR(36) REFERENCES gates(id),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT DEFAULT 0,
    fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAID', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_active ON tickets(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_tickets_license ON tickets(license_plate);
CREATE INDEX idx_tickets_entry_time ON tickets(entry_time);

-- 7. PAYMENTS TABLE
-- Methods: CASH, CARD, UPI
-- Status: SUCCESS, FAILED, PENDING, REFUNDED
CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'UPI')),
    transaction_ref VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
    payment_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_ticket ON payments(ticket_id);
CREATE INDEX idx_payments_time ON payments(payment_time);

-- 8. RATE CARDS TABLE
CREATE TABLE IF NOT EXISTS rate_cards (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_type VARCHAR(20) NOT NULL UNIQUE CHECK (vehicle_type IN ('MOTORCYCLE', 'CAR', 'BUS', 'ELECTRIC')),
    hourly_rate DECIMAL(10, 2) NOT NULL,
    minimum_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grace_period_minutes INT NOT NULL DEFAULT 15,
    surge_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA EXAMPLE
INSERT INTO rate_cards (id, vehicle_type, hourly_rate, minimum_charge, grace_period_minutes, surge_multiplier) VALUES
('RC-1', 'MOTORCYCLE', 10.00, 10.00, 15, 1.00),
('RC-2', 'CAR', 20.00, 20.00, 15, 1.00),
('RC-3', 'ELECTRIC', 25.00, 25.00, 15, 1.00),
('RC-4', 'BUS', 50.00, 50.00, 15, 1.00)
ON CONFLICT (vehicle_type) DO NOTHING;
