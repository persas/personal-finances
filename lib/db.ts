import Database from 'better-sqlite3';
import path from 'path';
import { initSchema } from './schema';

const DB_PATH = path.join(process.cwd(), 'data', 'finances.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

export function query<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

export function run(sql: string, ...params: unknown[]): Database.RunResult {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
}

export function get<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): T | undefined {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.get(...params) as T | undefined;
}
