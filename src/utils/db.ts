import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

import { singleton } from './singleton';

const sqlite = new Database('sqlite.db');

// Hard-code a unique key, so we can look up the client when this module gets re-imported
export const db = singleton('drizzle', () => drizzle(sqlite));
