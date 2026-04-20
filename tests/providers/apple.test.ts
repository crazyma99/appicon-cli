import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppleProvider } from '../../src/providers/apple.js';

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
