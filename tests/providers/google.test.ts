import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../../src/providers/google.js';

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
    vi.mocked(gplay.search).mockResolvedValueOnce([sampleGplayResult] as any);

    const results = await provider.search('WeChat', 'us', 10);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('WeChat');
    expect(results[0].identifier).toBe('com.tencent.mm');
    expect(results[0].store).toBe('google');
  });

  it('looks up an app by appId', async () => {
    vi.mocked(gplay.app).mockResolvedValueOnce(sampleGplayResult as any);

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
