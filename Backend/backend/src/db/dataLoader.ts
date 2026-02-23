import axios from 'axios';
import { pool } from './connection';
import { QUERIES } from './queries';
import { GeoJSONFeature } from '../types';

const SF_OPEN_DATA_URL = 'https://data.sfgov.org/resource/yhqp-riqs.geojson';
const EST_STREET_WIDTH_METERS = 10.00;

// Calls sfdata api to get street sweeping data, minor transformations and loads it to our db
export async function loadStreetSweepingData(): Promise<number> {
  const client = await pool.connect();

  try {
    console.log('Fetching data from SF Open Data...');

    const headers: any = {};
    if (process.env.DATASF_APP_TOKEN) {
      headers['X-App-Token'] = process.env.DATASF_APP_TOKEN;
    }

    const results = await axios.get(SF_OPEN_DATA_URL, {
      params: {
        $limit: 50000, // 37878 rows as of 2/2/26
      },
      headers
    });

    const features: GeoJSONFeature[] = results.data.features;

    await client.query('BEGIN'); //starts a db transaction

    //Clear existing data
    await client.query('DELETE FROM street_sweeping');

    // Loop through 'features' and insert row by row into database
    let insertedCount = 0;
    for (const feature of features) {
      try {
        const {properties: props, geometry} = feature;

        // Skip if no geometry or wrong type
        if (!geometry || geometry.type !== 'LineString') {
          continue;
        }

        const wkt = coordinatesToWKT(geometry.coordinates);
        const params = [
          props.corridor,
          props.fullname,
          props.weekday,
          props.cnn,
          props.cnnrightleft,
          props.blocksweepid,
          props.blockside,
          props.limits,
          props.fromhour ? parseInt(props.fromhour) : null,
          props.tohour ? parseInt(props.tohour) : null,
          props.holidays === '1',
          props.week1 === '1',
          props.week2 === '1',
          props.week3 === '1',
          props.week4 === '1',
          props.week5 === '1',
          wkt,
          EST_STREET_WIDTH_METERS
        ];

        await client.query(
          QUERIES.insertStreetSweeping,
          params
        );
        insertedCount++;
      } catch (error) {
        console.error('Error inserting feature: ', error, feature)
      }
    }

    await client.query(QUERIES.insertMetaData, ['street_sweeping', insertedCount])

    await client.query('COMMIT') //ends transaction

    console.log(`Data loaded successfully.
    Uploaded ${insertedCount} from ${features.length} features in api response`);

    return insertedCount; // Return count of inserted records
  } catch (error) {
    //Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error loading data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to convert GeoJSON coordinates to WellKnowText format
// takes [[lon, lat], [lon, lat], ...] and makes it "LINESTRING(lon lat, lon lat, ...)"
function coordinatesToWKT(coordinates: number[][]): string {
  const wktCoordinates = coordinates
  .map(([lon, lat]) => `${lon} ${lat}`)
  .join(', ')
  return `LINESTRING(${wktCoordinates})`
}

//simply checks if there are any rows in the street sweeping table
export async function needsDataLoad(): Promise<boolean> {
  const client = await pool.connect();

  try {
    const result = await client.query(QUERIES.checkLastUpdatedAndRowCount, ['street_sweeping']);
    const {last_updated, record_count: count} = (result.rows[0]);
    const daysSinceUpdate = daysSinceDate(new Date(last_updated))
    console.log('days since update: ', daysSinceUpdate)
    return (parseInt(count) < 100 || daysSinceUpdate > 5);
  } catch (error) {
    console.error('Error checking data:', error);
    return true; // If error, assume we need data
  } finally {
    client.release();
  }
}

function daysSinceDate(date: Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.abs(Date.now() - date.getTime()) / MS_PER_DAY;
}