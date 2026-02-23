CREATE TABLE IF NOT EXISTS parked_vehicles (
  device_id VARCHAR(50) PRIMARY KEY,    -- IMEI from Traccar
  is_parked BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  parked_at TIMESTAMP,                  -- when ignition turned off
  unparked_at TIMESTAMP,                -- when ignition turned back on
  updated_at TIMESTAMP DEFAULT NOW()
);