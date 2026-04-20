import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

export class Cache {
  private dir: string;
  private ttlSeconds: number;

  constructor(dir: string, ttlSeconds: number = 86400) {
    this.dir = dir;
    this.ttlSeconds = ttlSeconds;
  }

  private keyToPath(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.dir, `${hash}.json`);
  }

  get<T = unknown>(key: string): T | undefined {
    const filePath = this.keyToPath(key);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = (Date.now() - entry.timestamp) / 1000;
      if (age >= this.ttlSeconds) {
        fs.unlinkSync(filePath);
        return undefined;
      }
      return entry.data;
    } catch {
      return undefined;
    }
  }

  set<T = unknown>(key: string, data: T): void {
    fs.mkdirSync(this.dir, { recursive: true });
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    fs.writeFileSync(this.keyToPath(key), JSON.stringify(entry), 'utf-8');
  }

  clear(): void {
    try {
      const files = fs.readdirSync(this.dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.dir, file));
        }
      }
    } catch {
      // Directory might not exist
    }
  }
}
