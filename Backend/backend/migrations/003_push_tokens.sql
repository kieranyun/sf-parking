CREATE TABLE IF NOT EXISTS push_tokens (
  push_token VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,       -- Traccar device uniqueId (IMEI)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_tokens_device_idx ON push_tokens (device_id);