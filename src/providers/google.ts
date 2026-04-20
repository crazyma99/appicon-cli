import type { AppInfo, Store } from '../types.js';
import type { AppProvider } from './types.js';

export class GoogleProvider implements AppProvider {
  readonly store: Store = 'google';
  readonly name = 'Google Play Store';

  private async getGplay() {
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
