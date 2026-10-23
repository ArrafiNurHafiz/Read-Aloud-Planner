import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://arrafi:postgres@localhost:5432/taskforge'
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
