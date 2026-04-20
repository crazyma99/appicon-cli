import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Cache } from '../../src/utils/cache.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TEST_CACHE_DIR = path.join(os.tmpdir(), 'appicon-cache-test-' + Date.now());

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(TEST_CACHE_DIR, 60);
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
    const expiredCache = new Cache(TEST_CACHE_DIR, 0);
    expiredCache.set('key', { data: true });
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
