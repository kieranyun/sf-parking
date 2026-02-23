import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()'); // Simple query to test connection
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('DB connection pool closed')
  } catch (error) {
    console.error('error closing db connection: ', error);
    throw error;
  }
}