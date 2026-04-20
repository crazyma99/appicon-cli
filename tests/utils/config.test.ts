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
