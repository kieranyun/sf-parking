CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS street_sweeping (
  id SERIAL PRIMARY KEY,

  -- Street identification
  corridor VARCHAR(255),        -- "Market St"
  fullname VARCHAR(100),        -- "Tuesday" (full day name)
  weekday VARCHAR(50),          -- "Tues" (abbreviated day)
  cnn VARCHAR(20),              -- "8753101" (Centerline Network ID)
  cnnrightleft CHAR(1),      -- "L" or "R" (which side of street)
  blocksweepid VARCHAR(20),     -- "1640782" (unique sweep block ID)

  -- Location details
  blockside VARCHAR(50),        -- "SouthEast"
  limits VARCHAR(255),          -- "Larkin St  -  Polk St" (block boundaries)

  -- Timing
  fromhour INTEGER,         -- "5" (start hour)
  tohour INTEGER,           -- "6" (end hour)
  holidays BOOLEAN,         -- "0" (holiday schedule flag, 1 = swept on holidays)

  -- Week schedule (which weeks of month this applies)
  week1 BOOLEAN,             -- "1" means applies to week 1
  week2 BOOLEAN,
  week3 BOOLEAN,
  week4 BOOLEAN,
  week5 BOOLEAN,

  -- Geometry
  curbline GEOMETRY(LineString, 4326),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for fast geographic queries
CREATE INDEX IF NOT EXISTS street_sweeping_geom_idx
ON street_sweeping USING GIST (curbline);

-- Index on weekday for filtering by day
CREATE INDEX IF NOT EXISTS street_sweeping_weekday_idx
ON street_sweeping (weekday);

-- Metadata table
CREATE TABLE IF NOT EXISTS data_metadata (
  id SERIAL PRIMARY KEY,
  dataset_name VARCHAR(100) UNIQUE,
  last_updated TIMESTAMP,
  record_count INTEGER
);