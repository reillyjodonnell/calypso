import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/*',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
} satisfies Config;
