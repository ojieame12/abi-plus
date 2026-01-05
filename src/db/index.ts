import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create a SQL client using Neon's serverless driver
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle ORM instance
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from './schema';
