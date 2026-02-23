export const QUERIES = {
  streetSweepingTableExists:
    `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'street_sweeping'
      );
    `,

  checkRowCount: `SELECT COUNT(*) FROM street_sweeping`,

  checkLastUpdatedAndRowCount: `select last_updated, record_count from data_metadata where dataset_name = $1`,

  insertStreetSweeping:
  `
    INSERT INTO street_sweeping
      (corridor, fullname, weekday, cnn, cnnrightleft, blocksweepid,
       blockside, limits, fromhour, tohour, holidays,
       week1, week2, week3, week4, week5, curbline)
    VALUES
      ($1, $2, $3, $4, $5::char, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      ST_Transform(
        ST_OffsetCurve(
          ST_Transform(ST_GeomFromText($17, 4326), 32610),
          CASE
            WHEN $5 = 'L' THEN $18::double precision
            WHEN $5 = 'R' THEN -($18::double precision)
          END
        ),
        4326
    ))
  `,

  insertMetaData:
  `
  INSERT INTO data_metadata
    (dataset_name, last_updated, record_count)
  VALUES
    ($1, NOW(), $2)
  ON CONFLICT (dataset_name) DO UPDATE SET
    last_updated = NOW(),
    record_count = $2
  `,

  getSweepingSchedulesByCoordinates:
  `WITH point AS (
    SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326) as car
  )
  SELECT
    cnn,
    corridor,
    limits,
    blockside,
    weekday,
    week1,
    week2,
    week3,
    week4,
    week5,
    fromhour,
    tohour,
    holidays,
    ST_AsGeoJSON(curbline) as curbline,
    ST_Distance(curbline::geography, p.car::geography) as distance_meters
  FROM street_sweeping, point p
  WHERE curbline && ST_Expand(p.car, 0.005)
    AND ST_DWithin(curbline::geography, p.car::geography, $3)
  ORDER BY distance_meters
  LIMIT 8`,
// $1 = longitude, $2 = latitude, $3 = accuracy radius

  upsertParkedVehicle:
  `INSERT INTO parked_vehicles (device_id, is_parked, latitude, longitude, parked_at, updated_at)
   VALUES ($1, true, $2, $3, $4, NOW())
   ON CONFLICT (device_id) DO UPDATE SET
     is_parked = true,
     latitude = $2,
     longitude = $3,
     parked_at = $4,
     updated_at = NOW()`,

  markVehicleUnparked:
  `UPDATE parked_vehicles
   SET is_parked = false, unparked_at = $2, updated_at = NOW()
   WHERE device_id = $1`,

  getParkedVehicle:
  `SELECT * FROM parked_vehicles WHERE device_id = $1`,

  upsertPushToken:
  `INSERT INTO push_tokens (push_token, device_id)
   VALUES ($1, $2)
   ON CONFLICT (push_token) DO UPDATE SET
     device_id = $2`,

  getTokensForDevice:
  `SELECT push_token FROM push_tokens WHERE device_id = $1`,
}
