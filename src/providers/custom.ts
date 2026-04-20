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
