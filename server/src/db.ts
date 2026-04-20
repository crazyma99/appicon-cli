import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'appicon.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'icons'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS icons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    package_name TEXT,
    bundle_id TEXT,
    developer TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS icon_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon_id TEXT NOT NULL REFERENCES icons(id) ON DELETE CASCADE,
    size INTEGER NOT NULL,
    format TEXT DEFAULT 'png',
    file_path TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_icons_name ON icons(name);
  CREATE INDEX IF NOT EXISTS idx_icons_package ON icons(package_name);
  CREATE INDEX IF NOT EXISTS idx_icons_bundle ON icons(bundle_id);
  CREATE INDEX IF NOT EXISTS idx_icon_files_icon_id ON icon_files(icon_id);
`);

// Insert default API key if not exists
const defaultKey = db.prepare('SELECT key FROM api_keys WHERE key = ?').get('default-dev-key');
if (!defaultKey) {
  db.prepare('INSERT INTO api_keys (key, name) VALUES (?, ?)').run('default-dev-key', 'Default Development Key');
}

// --- Icon CRUD ---

export interface IconRow {
  id: string;
  name: string;
  package_name: string | null;
  bundle_id: string | null;
  developer: string | null;
  category: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface IconFileRow {
  id: number;
  icon_id: string;
  size: number;
  format: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

export function searchIcons(query: string, limit: number = 20): IconRow[] {
  const pattern = `%${query}%`;
  return db.prepare(`
    SELECT * FROM icons
    WHERE name LIKE ? OR package_name LIKE ? OR bundle_id LIKE ? OR category LIKE ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(pattern, pattern, pattern, pattern, limit) as IconRow[];
}

export function getIcon(id: string): IconRow | undefined {
  return db.prepare('SELECT * FROM icons WHERE id = ?').get(id) as IconRow | undefined;
}

export function getIconFiles(iconId: string): IconFileRow[] {
  return db.prepare('SELECT * FROM icon_files WHERE icon_id = ? ORDER BY size ASC').all(iconId) as IconFileRow[];
}

export function getIconFile(iconId: string, size: number): IconFileRow | undefined {
  return db.prepare('SELECT * FROM icon_files WHERE icon_id = ? AND size = ?').get(iconId, size) as IconFileRow | undefined;
}

export function createIcon(data: {
  id: string;
  name: string;
  package_name?: string;
  bundle_id?: string;
  developer?: string;
  category?: string;
  tags?: string[];
}): IconRow {
  db.prepare(`
    INSERT INTO icons (id, name, package_name, bundle_id, developer, category, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.name,
    data.package_name || null,
    data.bundle_id || null,
    data.developer || null,
    data.category || null,
    JSON.stringify(data.tags || [])
  );
  return getIcon(data.id)!;
}

export function updateIcon(id: string, data: {
  name?: string;
  package_name?: string;
  bundle_id?: string;
  developer?: string;
  category?: string;
  tags?: string[];
}): IconRow | undefined {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.package_name !== undefined) { fields.push('package_name = ?'); values.push(data.package_name); }
  if (data.bundle_id !== undefined) { fields.push('bundle_id = ?'); values.push(data.bundle_id); }
  if (data.developer !== undefined) { fields.push('developer = ?'); values.push(data.developer); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

  if (fields.length === 0) return getIcon(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE icons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getIcon(id);
}

export function deleteIcon(id: string): boolean {
  const result = db.prepare('DELETE FROM icons WHERE id = ?').run(id);
  return result.changes > 0;
}

export function addIconFile(iconId: string, size: number, format: string, filePath: string, fileSize: number): void {
  db.prepare(`
    INSERT INTO icon_files (icon_id, size, format, file_path, file_size)
    VALUES (?, ?, ?, ?, ?)
  `).run(iconId, size, format, filePath, fileSize);
}

export function listAllIcons(limit: number = 100, offset: number = 0): { icons: IconRow[]; total: number } {
  const total = (db.prepare('SELECT COUNT(*) as count FROM icons').get() as any).count;
  const icons = db.prepare('SELECT * FROM icons ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, offset) as IconRow[];
  return { icons, total };
}

// --- Stats ---

export function getStats(): {
  totalIcons: number;
  totalFiles: number;
  totalSize: number;
  categories: Array<{ category: string; count: number }>;
  recentIcons: IconRow[];
} {
  const totalIcons = (db.prepare('SELECT COUNT(*) as c FROM icons').get() as any).c;
  const totalFiles = (db.prepare('SELECT COUNT(*) as c FROM icon_files').get() as any).c;
  const totalSize = (db.prepare('SELECT COALESCE(SUM(file_size), 0) as s FROM icon_files').get() as any).s;
  const categories = db.prepare(`
    SELECT COALESCE(category, 'Uncategorized') as category, COUNT(*) as count
    FROM icons GROUP BY category ORDER BY count DESC
  `).all() as Array<{ category: string; count: number }>;
  const recentIcons = db.prepare('SELECT * FROM icons ORDER BY created_at DESC LIMIT 5').all() as IconRow[];

  return { totalIcons, totalFiles, totalSize, categories, recentIcons };
}

// --- API Keys ---

export interface ApiKeyRow {
  key: string;
  name: string;
  enabled: number;
  created_at: string;
}

export function validateApiKey(key: string): boolean {
  const row = db.prepare('SELECT key FROM api_keys WHERE key = ? AND enabled = 1').get(key);
  return !!row;
}

export function listApiKeys(): ApiKeyRow[] {
  return db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all() as ApiKeyRow[];
}

export function createApiKey(name: string): ApiKeyRow {
  const key = crypto.randomUUID();
  db.prepare('INSERT INTO api_keys (key, name) VALUES (?, ?)').run(key, name);
  return db.prepare('SELECT * FROM api_keys WHERE key = ?').get(key) as ApiKeyRow;
}

export function deleteApiKey(key: string): boolean {
  const result = db.prepare('DELETE FROM api_keys WHERE key = ?').run(key);
  return result.changes > 0;
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function getIconsDir(): string {
  return path.join(DATA_DIR, 'icons');
}

export default db;
