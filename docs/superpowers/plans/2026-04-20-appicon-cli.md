# appicon-cli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that searches and downloads APP icons from Apple App Store, Google Play, and custom API servers, with JSON output for Claude Code integration.

**Architecture:** Commander-based CLI with a Provider abstraction layer (Apple/Google/Custom). Each provider implements `search/lookup/getIconUrl`. Utils handle image processing (sharp), file caching, config management, and terminal formatting. All commands support `--json` for programmatic use.

**Tech Stack:** Node.js 18+, TypeScript 5.5+, commander 12.x, tsup 8.x, sharp 0.33.x, google-play-scraper, picocolors, nanospinner, cli-table3

---

## File Structure

```
appicon-cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts                  # CLI entry, commander setup
│   ├── types.ts                  # Shared type definitions
│   ├── providers/
│   │   ├── types.ts              # AppProvider interface
│   │   ├── apple.ts              # Apple iTunes API provider
│   │   ├── google.ts             # Google Play scraper provider
│   │   ├── custom.ts             # Custom REST API provider
│   │   └── registry.ts           # Provider registry & resolution
│   ├── commands/
│   │   ├── search.ts             # search command
│   │   ├── download.ts           # download command
│   │   ├── info.ts               # info command
│   │   ├── batch.ts              # batch command
│   │   └── config.ts             # config command
│   └── utils/
│       ├── image.ts              # Icon download & resize via sharp
│       ├── cache.ts              # File-based JSON cache with TTL
│       ├── config.ts             # ~/.appicon/config.json read/write
│       └── format.ts             # Terminal table/color formatting
└── tests/
    ├── providers/
    │   ├── apple.test.ts
    │   ├── google.test.ts
    │   ├── custom.test.ts
    │   └── registry.test.ts
    ├── commands/
    │   ├── search.test.ts
    │   ├── download.test.ts
    │   ├── info.test.ts
    │   ├── batch.test.ts
    │   └── config.test.ts
    └── utils/
        ├── image.test.ts
        ├── cache.test.ts
        ├── config.test.ts
        └── format.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/mi/appicon-cli
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "appicon-cli",
  "version": "0.1.0",
  "description": "Search and download APP icons from Apple App Store, Google Play, and custom servers",
  "type": "module",
  "bin": {
    "appicon": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "keywords": ["app-icon", "cli", "apple", "google-play", "figma"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "cli-table3": "^0.6.5",
    "commander": "^12.1.0",
    "google-play-scraper": "^9.1.1",
    "nanospinner": "^1.2.2",
    "picocolors": "^1.1.1",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "tsup": "^8.3.5",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['google-play-scraper', 'sharp'],
  noExternal: ['commander', 'picocolors', 'nanospinner', 'cli-table3'],
});
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
*.tgz
.DS_Store
```

- [ ] **Step 6: Install dependencies and verify build**

```bash
npm install
npx tsc --noEmit  # Should pass (no source files yet, that's fine)
```

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts .gitignore package-lock.json
git commit -m "chore: scaffold project with TypeScript, tsup, commander"
```

---

### Task 2: Type Definitions & Provider Interface

**Files:**
- Create: `src/types.ts`
- Create: `src/providers/types.ts`

- [ ] **Step 1: Create src/types.ts**

```typescript
export type Store = 'apple' | 'google' | 'custom';
export type StoreFilter = Store | 'all';
export type ImageFormat = 'png' | 'jpg' | 'webp';

export interface AppInfo {
  id: string;
  name: string;
  identifier: string;
  developer: string;
  store: Store;
  sourceName?: string;
  storeUrl: string;
  iconUrl: string;
  rating?: number;
  genre?: string;
  description?: string;
  version?: string;
  price?: string;
}

export interface SearchOptions {
  store: StoreFilter;
  country: string;
  limit: number;
}

export interface DownloadOptions {
  store?: Store;
  sizes: number[];
  format: ImageFormat;
  output: string;
  country: string;
}

export interface DownloadResult {
  app: string;
  identifier: string;
  store: Store;
  files: Array<{
    size: number;
    format: ImageFormat;
    path: string;
  }>;
}

export interface CustomSourceConfig {
  name: string;
  url: string;
  apiKey: string;
  priority: number;
  enabled: boolean;
}

export interface AppIconConfig {
  sources: CustomSourceConfig[];
  defaults: {
    sizes: number[];
    format: ImageFormat;
    country: string;
  };
  searchPriority: string[];
  cache: {
    dir: string;
    ttl: number;
  };
}
```

- [ ] **Step 2: Create src/providers/types.ts**

```typescript
import type { AppInfo, Store } from '../types.js';

export interface AppProvider {
  readonly store: Store;
  readonly name: string;
  search(term: string, country: string, limit: number): Promise<AppInfo[]>;
  lookup(identifier: string, country: string): Promise<AppInfo | null>;
  getIconUrl(baseIconUrl: string, size: number): string;
}
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```
Expected: PASS (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/providers/types.ts
git commit -m "feat: add type definitions and provider interface"
```

---

### Task 3: Utils — Config Module

**Files:**
- Create: `src/utils/config.ts`
- Create: `tests/utils/config.test.ts`

- [ ] **Step 1: Write tests for config module**

```typescript
// tests/utils/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, saveConfig, addSource, removeSource, getDefaultConfig } from '../../src/utils/config.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TEST_DIR = path.join(os.tmpdir(), 'appicon-test-' + Date.now());
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'config.json');

describe('config', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('returns default config when no file exists', () => {
    const config = loadConfig(path.join(TEST_DIR, 'nonexistent.json'));
    expect(config.sources).toEqual([]);
    expect(config.defaults.format).toBe('png');
    expect(config.defaults.country).toBe('us');
    expect(config.defaults.sizes).toEqual([512]);
    expect(config.searchPriority).toEqual(['custom', 'apple', 'google']);
  });

  it('saves and loads config', () => {
    const config = getDefaultConfig();
    config.defaults.country = 'cn';
    saveConfig(config, TEST_CONFIG_PATH);
    const loaded = loadConfig(TEST_CONFIG_PATH);
    expect(loaded.defaults.country).toBe('cn');
  });

  it('adds a custom source', () => {
    const config = getDefaultConfig();
    const updated = addSource(config, {
      name: 'test-source',
      url: 'https://example.com/api',
      apiKey: 'key123',
      priority: 1,
      enabled: true,
    });
    expect(updated.sources).toHaveLength(1);
    expect(updated.sources[0].name).toBe('test-source');
  });

  it('rejects duplicate source name', () => {
    let config = getDefaultConfig();
    config = addSource(config, {
      name: 'test-source',
      url: 'https://example.com/api',
      apiKey: 'key123',
      priority: 1,
      enabled: true,
    });
    expect(() =>
      addSource(config, {
        name: 'test-source',
        url: 'https://other.com/api',
        apiKey: 'key456',
        priority: 2,
        enabled: true,
      })
    ).toThrow('already exists');
  });

  it('removes a source by name', () => {
    let config = getDefaultConfig();
    config = addSource(config, {
      name: 'test-source',
      url: 'https://example.com/api',
      apiKey: 'key123',
      priority: 1,
      enabled: true,
    });
    const updated = removeSource(config, 'test-source');
    expect(updated.sources).toHaveLength(0);
  });

  it('throws when removing nonexistent source', () => {
    const config = getDefaultConfig();
    expect(() => removeSource(config, 'nope')).toThrow('not found');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/config.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement config module**

```typescript
// src/utils/config.ts
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AppIconConfig, CustomSourceConfig } from '../types.js';

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.appicon');
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, 'config.json');

export function getDefaultConfig(): AppIconConfig {
  return {
    sources: [],
    defaults: {
      sizes: [512],
      format: 'png',
      country: 'us',
    },
    searchPriority: ['custom', 'apple', 'google'],
    cache: {
      dir: getCacheDir(),
      ttl: 86400,
    },
  };
}

function getCacheDir(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'appicon-cli');
  }
  if (platform === 'win32') {
    return path.join(os.env?.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'appicon-cli', 'Cache');
  }
  return path.join(os.homedir(), '.cache', 'appicon-cli');
}

export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): AppIconConfig {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: AppIconConfig, configPath: string = DEFAULT_CONFIG_PATH): void {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addSource(config: AppIconConfig, source: CustomSourceConfig): AppIconConfig {
  if (config.sources.some((s) => s.name === source.name)) {
    throw new Error(`Source "${source.name}" already exists`);
  }
  return { ...config, sources: [...config.sources, source] };
}

export function removeSource(config: AppIconConfig, name: string): AppIconConfig {
  const idx = config.sources.findIndex((s) => s.name === name);
  if (idx === -1) {
    throw new Error(`Source "${name}" not found`);
  }
  const sources = [...config.sources];
  sources.splice(idx, 1);
  return { ...config, sources };
}

export function getConfigPath(): string {
  return DEFAULT_CONFIG_PATH;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/config.test.ts
```
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/config.ts tests/utils/config.test.ts
git commit -m "feat: add config module with load/save/add/remove source"
```

---

### Task 4: Utils — Cache Module

**Files:**
- Create: `src/utils/cache.ts`
- Create: `tests/utils/cache.test.ts`

- [ ] **Step 1: Write tests for cache module**

```typescript
// tests/utils/cache.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Cache } from '../../src/utils/cache.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TEST_CACHE_DIR = path.join(os.tmpdir(), 'appicon-cache-test-' + Date.now());

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(TEST_CACHE_DIR, 60); // 60 seconds TTL
  });

  afterEach(() => {
    fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
  });

  it('returns undefined for missing key', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('stores and retrieves data', () => {
    const data = { results: [{ name: 'WeChat' }] };
    cache.set('wechat-search', data);
    expect(cache.get('wechat-search')).toEqual(data);
  });

  it('returns undefined for expired entries', () => {
    const expiredCache = new Cache(TEST_CACHE_DIR, 0); // 0 second TTL
    expiredCache.set('key', { data: true });
    // Entry is immediately expired with TTL=0
    expect(expiredCache.get('key')).toBeUndefined();
  });

  it('clears all cache', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('handles special characters in keys', () => {
    cache.set('search:微信/wechat?q=1', { found: true });
    expect(cache.get('search:微信/wechat?q=1')).toEqual({ found: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/cache.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement cache module**

```typescript
// src/utils/cache.ts
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
      if (age > this.ttlSeconds) {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/cache.test.ts
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/cache.ts tests/utils/cache.test.ts
git commit -m "feat: add file-based cache with TTL support"
```

---

### Task 5: Utils — Format Module

**Files:**
- Create: `src/utils/format.ts`
- Create: `tests/utils/format.test.ts`

- [ ] **Step 1: Write tests for format module**

```typescript
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatSearchResults, formatAppInfo, formatError, formatSuccess } from '../../src/utils/format.js';
import type { AppInfo } from '../../src/types.js';

const sampleApp: AppInfo = {
  id: '1',
  name: 'WeChat',
  identifier: 'com.tencent.xin',
  developer: 'WeChat',
  store: 'apple',
  storeUrl: 'https://apps.apple.com/app/id836500024',
  iconUrl: 'https://example.com/icon.png',
  rating: 4.7,
  genre: 'Social',
};

describe('format', () => {
  it('formats search results as table string', () => {
    const output = formatSearchResults([sampleApp]);
    expect(output).toContain('WeChat');
    expect(output).toContain('com.tencent.xin');
    expect(output).toContain('apple');
  });

  it('formats empty search results', () => {
    const output = formatSearchResults([]);
    expect(output).toContain('No results');
  });

  it('formats app info', () => {
    const output = formatAppInfo(sampleApp, [
      { size: 256, url: 'https://example.com/256.png' },
      { size: 512, url: 'https://example.com/512.png' },
    ]);
    expect(output).toContain('WeChat');
    expect(output).toContain('256x256');
    expect(output).toContain('512x512');
  });

  it('formats error message', () => {
    const output = formatError('Something went wrong');
    expect(output).toContain('Something went wrong');
  });

  it('formats success message', () => {
    const output = formatSuccess('Done!');
    expect(output).toContain('Done!');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/format.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement format module**

```typescript
// src/utils/format.ts
import Table from 'cli-table3';
import pc from 'picocolors';
import type { AppInfo } from '../types.js';

export interface IconVariant {
  size: number;
  url: string;
}

export function formatSearchResults(results: AppInfo[]): string {
  if (results.length === 0) {
    return pc.yellow('  No results found.');
  }

  const table = new Table({
    head: ['#', 'Name', 'Identifier', 'Developer', 'Store', 'Rating'].map((h) => pc.cyan(h)),
    style: { head: [], border: [] },
  });

  results.forEach((app, i) => {
    table.push([
      pc.gray(String(i + 1)),
      app.name,
      pc.dim(app.identifier),
      app.developer,
      storeLabel(app.store),
      app.rating ? String(app.rating.toFixed(1)) : '-',
    ]);
  });

  return table.toString();
}

export function formatAppInfo(app: AppInfo, iconUrls: IconVariant[]): string {
  const lines: string[] = [
    '',
    `  ${pc.bold('App Name:')}     ${app.name}`,
    `  ${pc.bold('Identifier:')}   ${app.identifier}`,
    `  ${pc.bold('Developer:')}    ${app.developer}`,
    `  ${pc.bold('Store:')}        ${storeLabel(app.store)}`,
    `  ${pc.bold('Rating:')}       ${app.rating ? `${app.rating.toFixed(1)}/5` : '-'}`,
  ];

  if (app.genre) lines.push(`  ${pc.bold('Genre:')}        ${app.genre}`);
  if (app.price) lines.push(`  ${pc.bold('Price:')}        ${app.price}`);

  if (iconUrls.length > 0) {
    lines.push('');
    lines.push(`  ${pc.bold('Icon URLs:')}`);
    for (const icon of iconUrls) {
      lines.push(`    ${pc.cyan(`${icon.size}x${icon.size}:`)}  ${pc.dim(icon.url)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function formatError(message: string): string {
  return `  ${pc.red('Error:')} ${message}`;
}

export function formatSuccess(message: string): string {
  return `  ${pc.green('Success:')} ${message}`;
}

function storeLabel(store: string): string {
  switch (store) {
    case 'apple': return pc.white('Apple');
    case 'google': return pc.green('Google');
    case 'custom': return pc.magenta('Custom');
    default: return store;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/format.test.ts
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/format.ts tests/utils/format.test.ts
git commit -m "feat: add terminal formatting with tables and colors"
```

---

### Task 6: Utils — Image Module

**Files:**
- Create: `src/utils/image.ts`
- Create: `tests/utils/image.test.ts`

- [ ] **Step 1: Write tests for image module**

```typescript
// tests/utils/image.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeFilename, buildOutputPath } from '../../src/utils/image.js';

describe('image utils', () => {
  it('sanitizes filenames with special characters', () => {
    expect(sanitizeFilename('WeChat / 微信')).toBe('WeChat___');
    expect(sanitizeFilename('App:Name')).toBe('App_Name');
  });

  it('sanitizes filenames with spaces', () => {
    expect(sanitizeFilename('My App Name')).toBe('My_App_Name');
  });

  it('builds correct output path', () => {
    const p = buildOutputPath('/tmp/icons', 'WeChat', 512, 'png');
    expect(p).toBe('/tmp/icons/WeChat_512x512.png');
  });

  it('builds output path with different format', () => {
    const p = buildOutputPath('/tmp', 'App', 256, 'webp');
    expect(p).toBe('/tmp/App_256x256.webp');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/image.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement image module**

```typescript
// src/utils/image.ts
import fs from 'node:fs';
import path from 'node:path';
import type { ImageFormat } from '../types.js';

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function buildOutputPath(outputDir: string, appName: string, size: number, format: ImageFormat): string {
  const safeName = sanitizeFilename(appName);
  return path.join(outputDir, `${safeName}_${size}x${size}.${format}`);
}

export async function downloadIcon(
  url: string,
  outputPath: string,
  size: number,
  format: ImageFormat
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download icon: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  try {
    const sharp = (await import('sharp')).default;
    await sharp(buffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat(format, { quality: 90 })
      .toFile(outputPath);
  } catch {
    // Fallback: save raw file if sharp is not available
    fs.writeFileSync(outputPath, buffer);
  }

  return outputPath;
}

export async function downloadMultipleSizes(
  url: string,
  outputDir: string,
  appName: string,
  sizes: number[],
  format: ImageFormat
): Promise<Array<{ size: number; format: ImageFormat; path: string }>> {
  const results: Array<{ size: number; format: ImageFormat; path: string }> = [];

  for (const size of sizes) {
    const outputPath = buildOutputPath(outputDir, appName, size, format);
    await downloadIcon(url, outputPath, size, format);
    results.push({ size, format, path: outputPath });
  }

  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/image.test.ts
```
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/image.ts tests/utils/image.test.ts
git commit -m "feat: add image download and resize utilities"
```

---

### Task 7: Apple Provider

**Files:**
- Create: `src/providers/apple.ts`
- Create: `tests/providers/apple.test.ts`

- [ ] **Step 1: Write tests for Apple provider**

```typescript
// tests/providers/apple.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppleProvider } from '../../src/providers/apple.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sampleItunesResponse = {
  resultCount: 1,
  results: [
    {
      trackId: 836500024,
      trackName: 'WeChat',
      bundleId: 'com.tencent.xin',
      sellerName: 'WeChat',
      artworkUrl512: 'https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/icon/512x512bb.jpg',
      averageUserRating: 4.7,
      primaryGenreName: 'Social Networking',
      trackViewUrl: 'https://apps.apple.com/app/id836500024',
      formattedPrice: 'Free',
      version: '8.0.0',
    },
  ],
};

describe('AppleProvider', () => {
  let provider: AppleProvider;

  beforeEach(() => {
    provider = new AppleProvider();
    mockFetch.mockReset();
  });

  it('has correct store and name', () => {
    expect(provider.store).toBe('apple');
    expect(provider.name).toBe('Apple App Store');
  });

  it('searches for apps', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleItunesResponse),
    });

    const results = await provider.search('WeChat', 'us', 10);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('WeChat');
    expect(results[0].identifier).toBe('com.tencent.xin');
    expect(results[0].store).toBe('apple');
    expect(results[0].rating).toBe(4.7);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('itunes.apple.com/search?term=WeChat')
    );
  });

  it('looks up an app by bundleId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleItunesResponse),
    });

    const result = await provider.lookup('com.tencent.xin', 'us');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('WeChat');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('itunes.apple.com/lookup?bundleId=com.tencent.xin')
    );
  });

  it('looks up an app by trackId (numeric)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleItunesResponse),
    });

    const result = await provider.lookup('836500024', 'us');
    expect(result).not.toBeNull();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('itunes.apple.com/lookup?id=836500024')
    );
  });

  it('returns null when lookup finds nothing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ resultCount: 0, results: [] }),
    });

    const result = await provider.lookup('com.nonexistent', 'us');
    expect(result).toBeNull();
  });

  it('adjusts icon URL size', () => {
    const baseUrl = 'https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/icon/100x100bb.jpg';
    const url1024 = provider.getIconUrl(baseUrl, 1024);
    expect(url1024).toContain('1024x1024bb');
    expect(url1024).not.toContain('100x100bb');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/providers/apple.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement Apple provider**

```typescript
// src/providers/apple.ts
import type { AppInfo, Store } from '../types.js';
import type { AppProvider } from './types.js';

interface ItunesResult {
  trackId: number;
  trackName: string;
  bundleId: string;
  sellerName: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  averageUserRating?: number;
  primaryGenreName?: string;
  trackViewUrl: string;
  formattedPrice?: string;
  version?: string;
  description?: string;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

export class AppleProvider implements AppProvider {
  readonly store: Store = 'apple';
  readonly name = 'Apple App Store';

  async search(term: string, country: string, limit: number): Promise<AppInfo[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&country=${country}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }
    const data: ItunesResponse = await response.json();
    return data.results.map((r) => this.mapResult(r));
  }

  async lookup(identifier: string, country: string): Promise<AppInfo | null> {
    const isNumeric = /^\d+$/.test(identifier);
    const param = isNumeric ? `id=${identifier}` : `bundleId=${encodeURIComponent(identifier)}`;
    const url = `https://itunes.apple.com/lookup?${param}&country=${country}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }
    const data: ItunesResponse = await response.json();
    if (data.resultCount === 0) return null;
    return this.mapResult(data.results[0]);
  }

  getIconUrl(baseIconUrl: string, size: number): string {
    return baseIconUrl.replace(/\d+x\d+bb/, `${size}x${size}bb`);
  }

  private mapResult(r: ItunesResult): AppInfo {
    return {
      id: String(r.trackId),
      name: r.trackName,
      identifier: r.bundleId,
      developer: r.sellerName,
      store: 'apple',
      storeUrl: r.trackViewUrl,
      iconUrl: r.artworkUrl512 || r.artworkUrl100 || '',
      rating: r.averageUserRating,
      genre: r.primaryGenreName,
      price: r.formattedPrice,
      version: r.version,
      description: r.description,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/providers/apple.test.ts
```
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/providers/apple.ts tests/providers/apple.test.ts
git commit -m "feat: add Apple App Store provider with iTunes API"
```

---

### Task 8: Google Provider

**Files:**
- Create: `src/providers/google.ts`
- Create: `tests/providers/google.test.ts`

- [ ] **Step 1: Write tests for Google provider**

```typescript
// tests/providers/google.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../../src/providers/google.js';

// Mock google-play-scraper
vi.mock('google-play-scraper', () => ({
  default: {
    search: vi.fn(),
    app: vi.fn(),
  },
}));

import gplay from 'google-play-scraper';

const sampleGplayResult = {
  appId: 'com.tencent.mm',
  title: 'WeChat',
  developer: 'Tencent',
  icon: 'https://play-lh.googleusercontent.com/AbCdEfG',
  score: 4.3,
  genre: 'Communication',
  url: 'https://play.google.com/store/apps/details?id=com.tencent.mm',
  free: true,
  priceText: 'Free',
  version: '8.0.0',
  summary: 'Chat app',
};

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider();
    vi.mocked(gplay.search).mockReset();
    vi.mocked(gplay.app).mockReset();
  });

  it('has correct store and name', () => {
    expect(provider.store).toBe('google');
    expect(provider.name).toBe('Google Play Store');
  });

  it('searches for apps', async () => {
    vi.mocked(gplay.search).mockResolvedValueOnce([sampleGplayResult]);

    const results = await provider.search('WeChat', 'us', 10);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('WeChat');
    expect(results[0].identifier).toBe('com.tencent.mm');
    expect(results[0].store).toBe('google');
  });

  it('looks up an app by appId', async () => {
    vi.mocked(gplay.app).mockResolvedValueOnce(sampleGplayResult);

    const result = await provider.lookup('com.tencent.mm', 'us');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('WeChat');
  });

  it('returns null when lookup fails', async () => {
    vi.mocked(gplay.app).mockRejectedValueOnce(new Error('App not found'));

    const result = await provider.lookup('com.nonexistent', 'us');
    expect(result).toBeNull();
  });

  it('adjusts icon URL size with =s parameter', () => {
    const baseUrl = 'https://play-lh.googleusercontent.com/AbCdEfG';
    expect(provider.getIconUrl(baseUrl, 512)).toBe(baseUrl + '=s512');
  });

  it('replaces existing =s parameter', () => {
    const baseUrl = 'https://play-lh.googleusercontent.com/AbCdEfG=s64';
    expect(provider.getIconUrl(baseUrl, 256)).toBe('https://play-lh.googleusercontent.com/AbCdEfG=s256');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/providers/google.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement Google provider**

```typescript
// src/providers/google.ts
import type { AppInfo, Store } from '../types.js';
import type { AppProvider } from './types.js';

export class GoogleProvider implements AppProvider {
  readonly store: Store = 'google';
  readonly name = 'Google Play Store';

  private async getGplay() {
    // google-play-scraper is CJS, use dynamic import
    const mod = await import('google-play-scraper');
    return mod.default || mod;
  }

  async search(term: string, country: string, limit: number): Promise<AppInfo[]> {
    const gplay = await this.getGplay();
    const results = await gplay.search({ term, num: limit, lang: 'en', country });
    return results.map((r: any) => this.mapResult(r));
  }

  async lookup(identifier: string, country: string): Promise<AppInfo | null> {
    try {
      const gplay = await this.getGplay();
      const result = await gplay.app({ appId: identifier, country, lang: 'en' });
      return this.mapResult(result);
    } catch {
      return null;
    }
  }

  getIconUrl(baseIconUrl: string, size: number): string {
    // Remove existing =s parameter if present
    const cleaned = baseIconUrl.replace(/=s\d+$/, '');
    return `${cleaned}=s${size}`;
  }

  private mapResult(r: any): AppInfo {
    return {
      id: r.appId,
      name: r.title,
      identifier: r.appId,
      developer: r.developer,
      store: 'google',
      storeUrl: r.url,
      iconUrl: r.icon || '',
      rating: r.score,
      genre: r.genre,
      price: r.priceText || (r.free ? 'Free' : undefined),
      version: r.version,
      description: r.summary || r.description,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/providers/google.test.ts
```
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/providers/google.ts tests/providers/google.test.ts
git commit -m "feat: add Google Play Store provider with scraper"
```

---

### Task 9: Custom Provider

**Files:**
- Create: `src/providers/custom.ts`
- Create: `tests/providers/custom.test.ts`

- [ ] **Step 1: Write tests for Custom provider**

```typescript
// tests/providers/custom.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomProvider } from '../../src/providers/custom.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sourceConfig = {
  name: 'my-icons',
  url: 'https://icons.example.com/api',
  apiKey: 'test-key',
  priority: 1,
  enabled: true,
};

const sampleSearchResponse = {
  results: [
    {
      id: 'custom-wechat',
      name: 'WeChat',
      packageName: 'com.tencent.mm',
      bundleId: 'com.tencent.xin',
      developer: 'Tencent',
      category: 'Social',
      iconUrl: 'https://icons.example.com/icons/wechat/512.png',
      sizes: [64, 128, 256, 512],
    },
  ],
  total: 1,
};

const sampleDetailResponse = {
  id: 'custom-wechat',
  name: 'WeChat',
  packageName: 'com.tencent.mm',
  bundleId: 'com.tencent.xin',
  developer: 'Tencent',
  category: 'Social',
  icons: {
    '64': 'https://icons.example.com/icons/wechat/64.png',
    '512': 'https://icons.example.com/icons/wechat/512.png',
  },
};

describe('CustomProvider', () => {
  let provider: CustomProvider;

  beforeEach(() => {
    provider = new CustomProvider(sourceConfig);
    mockFetch.mockReset();
  });

  it('has correct store and name', () => {
    expect(provider.store).toBe('custom');
    expect(provider.name).toBe('my-icons');
  });

  it('searches with correct URL and API key header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleSearchResponse),
    });

    const results = await provider.search('WeChat', 'us', 10);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('WeChat');
    expect(results[0].sourceName).toBe('my-icons');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://icons.example.com/api/search?q=WeChat&limit=10',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      })
    );
  });

  it('looks up an app by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDetailResponse),
    });

    const result = await provider.lookup('custom-wechat', 'us');
    expect(result).not.toBeNull();
    expect(result!.identifier).toBe('custom-wechat');
  });

  it('returns null on lookup failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

    const result = await provider.lookup('nonexistent', 'us');
    expect(result).toBeNull();
  });

  it('returns iconUrl as-is from getIconUrl', () => {
    const url = 'https://icons.example.com/icons/wechat/512.png';
    expect(provider.getIconUrl(url, 512)).toBe(url);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/providers/custom.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement Custom provider**

```typescript
// src/providers/custom.ts
import type { AppInfo, Store, CustomSourceConfig } from '../types.js';
import type { AppProvider } from './types.js';

export class CustomProvider implements AppProvider {
  readonly store: Store = 'custom';
  readonly name: string;
  private config: CustomSourceConfig;

  constructor(config: CustomSourceConfig) {
    this.name = config.name;
    this.config = config;
  }

  async search(term: string, _country: string, limit: number): Promise<AppInfo[]> {
    const url = `${this.config.url}/search?q=${encodeURIComponent(term)}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'X-API-Key': this.config.apiKey },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((r: any) => this.mapResult(r));
  }

  async lookup(identifier: string, _country: string): Promise<AppInfo | null> {
    const url = `${this.config.url}/icons/${encodeURIComponent(identifier)}`;
    const response = await fetch(url, {
      headers: { 'X-API-Key': this.config.apiKey },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return this.mapLookupResult(data);
  }

  getIconUrl(baseIconUrl: string, _size: number): string {
    // Custom servers provide direct URLs per size, no transformation needed
    return baseIconUrl;
  }

  private mapResult(r: any): AppInfo {
    return {
      id: r.id,
      name: r.name,
      identifier: r.id,
      developer: r.developer || '',
      store: 'custom',
      sourceName: this.name,
      storeUrl: '',
      iconUrl: r.iconUrl || '',
      genre: r.category,
    };
  }

  private mapLookupResult(r: any): AppInfo {
    const icons = r.icons || {};
    const sizes = Object.keys(icons).map(Number).sort((a, b) => b - a);
    const largestUrl = sizes.length > 0 ? icons[String(sizes[0])] : '';

    return {
      id: r.id,
      name: r.name,
      identifier: r.id,
      developer: r.developer || '',
      store: 'custom',
      sourceName: this.name,
      storeUrl: '',
      iconUrl: largestUrl,
      genre: r.category,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/providers/custom.test.ts
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/providers/custom.ts tests/providers/custom.test.ts
git commit -m "feat: add Custom API provider for user-configured servers"
```

---

### Task 10: Provider Registry

**Files:**
- Create: `src/providers/registry.ts`
- Create: `tests/providers/registry.test.ts`

- [ ] **Step 1: Write tests for registry**

```typescript
// tests/providers/registry.test.ts
import { describe, it, expect } from 'vitest';
import { detectStore, resolveProviders } from '../../src/providers/registry.js';

describe('detectStore', () => {
  it('detects reverse domain as google-first', () => {
    expect(detectStore('com.tencent.mm')).toEqual(['google', 'apple', 'custom']);
  });

  it('detects numeric as apple track ID', () => {
    expect(detectStore('836500024')).toEqual(['apple']);
  });

  it('detects other identifiers as search-all', () => {
    expect(detectStore('custom-wechat')).toEqual(['custom', 'apple', 'google']);
  });
});

describe('resolveProviders', () => {
  it('returns apple provider for store=apple', () => {
    const providers = resolveProviders('apple', []);
    expect(providers).toHaveLength(1);
    expect(providers[0].store).toBe('apple');
  });

  it('returns google provider for store=google', () => {
    const providers = resolveProviders('google', []);
    expect(providers).toHaveLength(1);
    expect(providers[0].store).toBe('google');
  });

  it('returns all providers for store=all', () => {
    const providers = resolveProviders('all', []);
    expect(providers.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/providers/registry.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement registry**

```typescript
// src/providers/registry.ts
import type { Store, StoreFilter, CustomSourceConfig } from '../types.js';
import type { AppProvider } from './types.js';
import { AppleProvider } from './apple.js';
import { GoogleProvider } from './google.js';
import { CustomProvider } from './custom.js';

const appleProvider = new AppleProvider();
const googleProvider = new GoogleProvider();

export function detectStore(identifier: string): Store[] {
  if (/^\d+$/.test(identifier)) {
    return ['apple'];
  }
  if (/^[a-z][a-z0-9]*\.[a-z]/i.test(identifier)) {
    return ['google', 'apple', 'custom'];
  }
  return ['custom', 'apple', 'google'];
}

export function resolveProviders(
  storeFilter: StoreFilter,
  customSources: CustomSourceConfig[]
): AppProvider[] {
  const customProviders = customSources
    .filter((s) => s.enabled)
    .map((s) => new CustomProvider(s));

  if (storeFilter === 'all') {
    return [...customProviders, appleProvider, googleProvider];
  }
  if (storeFilter === 'apple') return [appleProvider];
  if (storeFilter === 'google') return [googleProvider];
  if (storeFilter === 'custom') return customProviders;
  return [appleProvider, googleProvider, ...customProviders];
}

export function getProviderForStore(
  store: Store,
  customSources: CustomSourceConfig[]
): AppProvider | null {
  if (store === 'apple') return appleProvider;
  if (store === 'google') return googleProvider;
  if (store === 'custom') {
    const sources = customSources.filter((s) => s.enabled);
    return sources.length > 0 ? new CustomProvider(sources[0]) : null;
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/providers/registry.test.ts
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/providers/registry.ts tests/providers/registry.test.ts
git commit -m "feat: add provider registry with auto-detection"
```

---

### Task 11: search Command

**Files:**
- Create: `src/commands/search.ts`

- [ ] **Step 1: Implement search command**

```typescript
// src/commands/search.ts
import type { Command } from 'commander';
import type { StoreFilter } from '../types.js';
import { resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { formatSearchResults } from '../utils/format.js';
import { Cache } from '../utils/cache.js';
import { createSpinner } from 'nanospinner';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <keyword>')
    .description('Search APP icons across stores')
    .option('-s, --store <store>', 'Store to search: apple, google, custom, all', 'all')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('-l, --limit <number>', 'Max results per store', '10')
    .option('--json', 'Output as JSON')
    .action(async (keyword: string, opts: { store: string; country: string; limit: string; json?: boolean }) => {
      const config = loadConfig();
      const cache = new Cache(config.cache.dir, config.cache.ttl);
      const storeFilter = opts.store as StoreFilter;
      const limit = parseInt(opts.limit, 10);
      const providers = resolveProviders(storeFilter, config.sources);

      const cacheKey = `search:${keyword}:${storeFilter}:${opts.country}:${limit}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        if (opts.json) {
          console.log(JSON.stringify(cached));
        } else {
          console.log(formatSearchResults(cached.results));
          console.log(`\n  Found ${cached.total} results (cached).\n`);
        }
        return;
      }

      const spinner = opts.json ? null : createSpinner(`Searching for "${keyword}"...`).start();

      try {
        const allResults = await Promise.allSettled(
          providers.map((p) => p.search(keyword, opts.country, limit))
        );

        const results = allResults
          .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
          .flatMap((r) => r.value);

        const output = { results, total: results.length };
        cache.set(cacheKey, output);

        spinner?.success({ text: `Found ${results.length} results.` });

        if (opts.json) {
          console.log(JSON.stringify(output, null, 2));
        } else {
          console.log(formatSearchResults(results));
          console.log(`\n  Found ${results.length} results across ${providers.length} stores.\n`);
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        process.exitCode = 1;
      }
    });
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/search.ts
git commit -m "feat: add search command with multi-store and caching"
```

---

### Task 12: download Command

**Files:**
- Create: `src/commands/download.ts`

- [ ] **Step 1: Implement download command**

```typescript
// src/commands/download.ts
import type { Command } from 'commander';
import type { Store, ImageFormat, DownloadResult } from '../types.js';
import { detectStore, resolveProviders, getProviderForStore } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { downloadMultipleSizes } from '../utils/image.js';
import { formatError, formatSuccess } from '../utils/format.js';
import { createSpinner } from 'nanospinner';
import path from 'node:path';

export function registerDownloadCommand(program: Command): void {
  program
    .command('download <identifier>')
    .description('Download APP icon by package name or bundle ID')
    .option('-s, --store <store>', 'Store: apple, google, custom')
    .option('--size <size>', 'Icon size in px', '512')
    .option('--sizes <sizes>', 'Multiple sizes, comma-separated (e.g. "64,128,256,512")')
    .option('-f, --format <format>', 'Output format: png, jpg, webp', 'png')
    .option('-o, --output <dir>', 'Output directory', '.')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, opts: {
      store?: string;
      size: string;
      sizes?: string;
      format: string;
      output: string;
      country: string;
      json?: boolean;
    }) => {
      const config = loadConfig();
      const format = opts.format as ImageFormat;
      const sizes = opts.sizes
        ? opts.sizes.split(',').map((s) => parseInt(s.trim(), 10))
        : [parseInt(opts.size, 10)];
      const outputDir = path.resolve(opts.output);

      const spinner = opts.json ? null : createSpinner('Looking up app...').start();

      try {
        // Determine which stores to try
        const storesToTry: Store[] = opts.store
          ? [opts.store as Store]
          : detectStore(identifier);

        let app = null;
        let provider = null;

        for (const store of storesToTry) {
          const providers = resolveProviders(store, config.sources);
          for (const p of providers) {
            const result = await p.lookup(identifier, opts.country);
            if (result) {
              app = result;
              provider = p;
              break;
            }
          }
          if (app) break;
        }

        if (!app || !provider) {
          spinner?.error({ text: `App "${identifier}" not found in any store.` });
          if (opts.json) {
            console.log(JSON.stringify({ error: 'App not found' }));
          }
          process.exitCode = 1;
          return;
        }

        spinner?.update({ text: `Downloading ${app.name} icon...` });

        const iconUrl = provider.getIconUrl(app.iconUrl, Math.max(...sizes));
        const files = await downloadMultipleSizes(iconUrl, outputDir, app.name, sizes, format);

        const result: DownloadResult = {
          app: app.name,
          identifier: app.identifier,
          store: app.store,
          files,
        };

        spinner?.success({ text: `Downloaded ${app.name} icon (${files.length} file${files.length > 1 ? 's' : ''}).` });

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          for (const f of files) {
            console.log(`  ${f.size}x${f.size} → ${f.path}`);
          }
          console.log('');
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        if (opts.json) {
          console.log(JSON.stringify({ error: error.message }));
        }
        process.exitCode = 1;
      }
    });
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/download.ts
git commit -m "feat: add download command with multi-size and format support"
```

---

### Task 13: info Command

**Files:**
- Create: `src/commands/info.ts`

- [ ] **Step 1: Implement info command**

```typescript
// src/commands/info.ts
import type { Command } from 'commander';
import type { Store } from '../types.js';
import { detectStore, resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { formatAppInfo } from '../utils/format.js';
import type { IconVariant } from '../utils/format.js';
import { createSpinner } from 'nanospinner';

const STANDARD_SIZES = [64, 128, 256, 512, 1024];

export function registerInfoCommand(program: Command): void {
  program
    .command('info <identifier>')
    .description('View APP details and icon URLs')
    .option('-s, --store <store>', 'Store: apple, google, custom')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, opts: { store?: string; country: string; json?: boolean }) => {
      const config = loadConfig();
      const spinner = opts.json ? null : createSpinner('Looking up app...').start();

      try {
        const storesToTry: Store[] = opts.store
          ? [opts.store as Store]
          : detectStore(identifier);

        let app = null;
        let provider = null;

        for (const store of storesToTry) {
          const providers = resolveProviders(store, config.sources);
          for (const p of providers) {
            const result = await p.lookup(identifier, opts.country);
            if (result) {
              app = result;
              provider = p;
              break;
            }
          }
          if (app) break;
        }

        if (!app || !provider) {
          spinner?.error({ text: `App "${identifier}" not found.` });
          if (opts.json) {
            console.log(JSON.stringify({ error: 'App not found' }));
          }
          process.exitCode = 1;
          return;
        }

        // Build icon URLs for standard sizes
        const maxSize = app.store === 'apple' ? 1024 : 512;
        const iconUrls: IconVariant[] = STANDARD_SIZES
          .filter((s) => s <= maxSize)
          .map((size) => ({
            size,
            url: provider!.getIconUrl(app!.iconUrl, size),
          }));

        spinner?.success({ text: app.name });

        if (opts.json) {
          console.log(JSON.stringify({ ...app, iconUrls }, null, 2));
        } else {
          console.log(formatAppInfo(app, iconUrls));
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        process.exitCode = 1;
      }
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/info.ts
git commit -m "feat: add info command for app details and icon URLs"
```

---

### Task 14: batch Command

**Files:**
- Create: `src/commands/batch.ts`

- [ ] **Step 1: Implement batch command**

```typescript
// src/commands/batch.ts
import type { Command } from 'commander';
import type { Store, ImageFormat, DownloadResult } from '../types.js';
import { resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { downloadMultipleSizes } from '../utils/image.js';
import { createSpinner } from 'nanospinner';
import fs from 'node:fs';
import path from 'node:path';

interface BatchEntry {
  identifier: string;
  store?: Store;
  sizes?: number[];
}

export function registerBatchCommand(program: Command): void {
  program
    .command('batch <file>')
    .description('Batch download icons from a JSON or CSV file')
    .option('-f, --format <format>', 'Output format: png, jpg, webp', 'png')
    .option('-o, --output <dir>', 'Output directory', '.')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('--json', 'Output as JSON')
    .action(async (file: string, opts: { format: string; output: string; country: string; json?: boolean }) => {
      const config = loadConfig();
      const format = opts.format as ImageFormat;
      const outputDir = path.resolve(opts.output);
      const defaultSizes = config.defaults.sizes;

      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exitCode = 1;
        return;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries = filePath.endsWith('.csv') ? parseCsv(raw) : parseJson(raw);

      const spinner = opts.json ? null : createSpinner(`Processing ${entries.length} apps...`).start();
      const results: DownloadResult[] = [];
      const errors: Array<{ identifier: string; error: string }> = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const sizes = entry.sizes || defaultSizes;
        spinner?.update({ text: `[${i + 1}/${entries.length}] ${entry.identifier}` });

        try {
          const store = entry.store || 'all';
          const providers = resolveProviders(store as any, config.sources);

          let app = null;
          let provider = null;

          for (const p of providers) {
            const result = await p.lookup(entry.identifier, opts.country);
            if (result) {
              app = result;
              provider = p;
              break;
            }
          }

          if (!app || !provider) {
            errors.push({ identifier: entry.identifier, error: 'Not found' });
            continue;
          }

          const iconUrl = provider.getIconUrl(app.iconUrl, Math.max(...sizes));
          const files = await downloadMultipleSizes(iconUrl, outputDir, app.name, sizes, format);
          results.push({ app: app.name, identifier: app.identifier, store: app.store, files });
        } catch (error: any) {
          errors.push({ identifier: entry.identifier, error: error.message });
        }
      }

      spinner?.success({ text: `Done: ${results.length} succeeded, ${errors.length} failed.` });

      if (opts.json) {
        console.log(JSON.stringify({ results, errors }, null, 2));
      } else {
        for (const r of results) {
          console.log(`  ${r.app}: ${r.files.length} file(s) downloaded`);
        }
        for (const e of errors) {
          console.log(`  ${e.identifier}: ${e.error}`);
        }
        console.log('');
      }
    });
}

function parseJson(raw: string): BatchEntry[] {
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function parseCsv(raw: string): BatchEntry[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  // Skip header
  return lines.slice(1).map((line) => {
    const [identifier, store, sizesStr] = line.split(',').map((s) => s.trim());
    const sizes = sizesStr ? sizesStr.split(';').map(Number) : undefined;
    return { identifier, store: store as Store | undefined, sizes };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/batch.ts
git commit -m "feat: add batch command for bulk icon downloads"
```

---

### Task 15: config Command

**Files:**
- Create: `src/commands/config.ts`

- [ ] **Step 1: Implement config command**

```typescript
// src/commands/config.ts
import type { Command } from 'commander';
import { loadConfig, saveConfig, addSource, removeSource, getConfigPath } from '../utils/config.js';
import { formatSuccess, formatError } from '../utils/format.js';
import pc from 'picocolors';

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage configuration and custom data sources');

  configCmd
    .command('add-source')
    .description('Add a custom icon API source')
    .requiredOption('--name <name>', 'Source name')
    .requiredOption('--url <url>', 'API base URL')
    .requiredOption('--key <key>', 'API key')
    .option('--priority <n>', 'Priority (lower = higher)', '1')
    .action((opts: { name: string; url: string; key: string; priority: string }) => {
      try {
        let config = loadConfig();
        config = addSource(config, {
          name: opts.name,
          url: opts.url.replace(/\/$/, ''),
          apiKey: opts.key,
          priority: parseInt(opts.priority, 10),
          enabled: true,
        });
        saveConfig(config);
        console.log(formatSuccess(`Added source "${opts.name}".`));
      } catch (error: any) {
        console.error(formatError(error.message));
        process.exitCode = 1;
      }
    });

  configCmd
    .command('remove-source')
    .description('Remove a custom icon API source')
    .requiredOption('--name <name>', 'Source name')
    .action((opts: { name: string }) => {
      try {
        let config = loadConfig();
        config = removeSource(config, opts.name);
        saveConfig(config);
        console.log(formatSuccess(`Removed source "${opts.name}".`));
      } catch (error: any) {
        console.error(formatError(error.message));
        process.exitCode = 1;
      }
    });

  configCmd
    .command('list-sources')
    .description('List all configured sources')
    .action(() => {
      const config = loadConfig();
      if (config.sources.length === 0) {
        console.log('  No custom sources configured.');
        return;
      }
      console.log('');
      for (const s of config.sources) {
        const status = s.enabled ? pc.green('enabled') : pc.red('disabled');
        console.log(`  ${pc.bold(s.name)} [${status}]`);
        console.log(`    URL:      ${s.url}`);
        console.log(`    Priority: ${s.priority}`);
        console.log('');
      }
    });

  configCmd
    .command('set-priority')
    .description('Set store search priority (comma-separated)')
    .argument('<order>', 'Priority order, e.g. "custom,apple,google"')
    .action((order: string) => {
      const config = loadConfig();
      config.searchPriority = order.split(',').map((s) => s.trim());
      saveConfig(config);
      console.log(formatSuccess(`Search priority set to: ${config.searchPriority.join(' → ')}`));
    });

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const config = loadConfig();
      console.log(`\n  Config file: ${pc.dim(getConfigPath())}\n`);
      console.log(JSON.stringify(config, null, 2));
      console.log('');
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/commands/config.ts
git commit -m "feat: add config command for managing custom sources"
```

---

### Task 16: CLI Entry Point & Final Integration

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create CLI entry point**

```typescript
// src/index.ts
import { Command } from 'commander';
import { registerSearchCommand } from './commands/search.js';
import { registerDownloadCommand } from './commands/download.js';
import { registerInfoCommand } from './commands/info.js';
import { registerBatchCommand } from './commands/batch.js';
import { registerConfigCommand } from './commands/config.js';

const program = new Command();

program
  .name('appicon')
  .description('Search and download APP icons from Apple App Store, Google Play, and custom servers')
  .version('0.1.0');

registerSearchCommand(program);
registerDownloadCommand(program);
registerInfoCommand(program);
registerBatchCommand(program);
registerConfigCommand(program);

program.parse();
```

- [ ] **Step 2: Build the project**

```bash
npm run build
```
Expected: dist/index.js created with shebang

- [ ] **Step 3: Make the binary executable and test help**

```bash
chmod +x dist/index.js
node dist/index.js --help
```
Expected: Shows command list with search, download, info, batch, config

- [ ] **Step 4: Test search command with real API (Apple)**

```bash
node dist/index.js search "WeChat" --store apple --limit 3
```
Expected: Table with WeChat results from Apple App Store

- [ ] **Step 5: Test download command**

```bash
node dist/index.js download com.tencent.xin --store apple --size 256 --output /tmp/appicon-test --json
```
Expected: JSON output with downloaded file path

- [ ] **Step 6: Test info command**

```bash
node dist/index.js info com.tencent.xin --store apple
```
Expected: App details with icon URLs for multiple sizes

- [ ] **Step 7: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with all commands registered"
```

---

### Task 17: npm Link & End-to-End Verification

- [ ] **Step 1: Link globally**

```bash
npm link
```

- [ ] **Step 2: Test global command**

```bash
appicon --version
appicon --help
appicon search "Spotify" --store apple --limit 3
appicon download com.spotify.client --store apple --size 512 --output /tmp/appicon-test
appicon info com.spotify.client --store apple
appicon config show
```
Expected: All commands work correctly

- [ ] **Step 3: Test JSON output for Claude Code integration**

```bash
appicon search "微信" --store apple --country cn --json | head -20
appicon download com.tencent.xin --store apple --size 512 --output /tmp/appicon-test --json
```
Expected: Valid JSON output parseable by Claude Code

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: All tests pass

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete appicon-cli v0.1.0 MVP"
```
