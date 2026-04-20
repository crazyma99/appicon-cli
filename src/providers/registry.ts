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
