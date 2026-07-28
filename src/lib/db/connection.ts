import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { getDatabasePath, isDev } from "../env.server";
import { ensureDir } from "./migrate";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const dbPath = getDatabasePath();

    // Ensure data directory exists
    try {
      ensureDir(dbPath);
    } catch {
      // Directory may already exist
    }

    const sqlite = new Database(dbPath);

    // Performance pragmas
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    if (isDev()) {
      sqlite.pragma("busy_timeout = 3000");
    }

    dbInstance = drizzle(sqlite, { schema });
  }
  return dbInstance;
}

// For testing / resetting during development
export function closeDb() {
  if (dbInstance) {
    // better-sqlite3 drizzle doesn't expose close easily,
    // but the underlying connection will close when the process exits
    dbInstance = null;
  }
}
