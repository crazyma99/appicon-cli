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
