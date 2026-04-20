import type { AppInfo, Store } from '../types.js';

export interface AppProvider {
  readonly store: Store;
  readonly name: string;
  search(term: string, country: string, limit: number): Promise<AppInfo[]>;
  lookup(identifier: string, country: string): Promise<AppInfo | null>;
  getIconUrl(baseIconUrl: string, size: number): string;
}
