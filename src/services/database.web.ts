import type { Conversation, Message } from '@/types/api';
import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;
const DB_KEY = 'easytalk_sqlite_db';

async function getDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Try to restore from IndexedDB
  const saved = await loadFromIndexedDB();
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      token TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER NOT NULL,
      token TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (token, id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_token_timestamp
    ON messages (token, timestamp DESC);
  `);

  return db;
}

async function persist(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data.buffer as ArrayBuffer);
}

function loadFromIndexedDB(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('easytalk_storage', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('sqlite');
    };
    request.onsuccess = () => {
      const tx = request.result.transaction('sqlite', 'readonly');
      const store = tx.objectStore('sqlite');
      const get = store.get(DB_KEY);
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

function saveToIndexedDB(data: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('easytalk_storage', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('sqlite');
    };
    request.onsuccess = () => {
      const tx = request.result.transaction('sqlite', 'readwrite');
      const store = tx.objectStore('sqlite');
      store.put(data, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export { getDatabase };

export async function upsertConversations(
  conversations: Conversation[],
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();

  for (const conv of conversations) {
    database.run(
      'INSERT OR REPLACE INTO conversations (token, data, updated_at) VALUES (?, ?, ?)',
      [conv.token, JSON.stringify(conv), now],
    );
  }
  await persist();
}

export async function getCachedConversations(): Promise<Conversation[]> {
  const database = await getDatabase();
  const results = database.exec(
    'SELECT data FROM conversations ORDER BY updated_at DESC',
  );
  if (results.length === 0) return [];
  return results[0].values.map((row) => JSON.parse(row[0] as string));
}

export async function upsertMessages(
  token: string,
  messages: Message[],
): Promise<void> {
  const database = await getDatabase();

  for (const msg of messages) {
    database.run(
      'INSERT OR REPLACE INTO messages (id, token, data, timestamp) VALUES (?, ?, ?, ?)',
      [msg.id, token, JSON.stringify(msg), msg.timestamp],
    );
  }
  await persist();
}

export async function getCachedMessages(
  token: string,
  limit = 50,
  beforeId?: number,
): Promise<Message[]> {
  const database = await getDatabase();

  let query = 'SELECT data FROM messages WHERE token = ?';
  const params: (string | number)[] = [token];

  if (beforeId !== undefined) {
    query += ' AND id < ?';
    params.push(beforeId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const results = database.exec(query, params);
  if (results.length === 0) return [];
  return results[0].values.map((row) => JSON.parse(row[0] as string));
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  database.run('DELETE FROM conversations');
  database.run('DELETE FROM messages');
  await persist();
}
