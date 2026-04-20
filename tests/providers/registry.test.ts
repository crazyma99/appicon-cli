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
