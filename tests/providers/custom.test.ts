import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomProvider } from '../../src/providers/custom.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const sourceConfig = {
  name: 'my-icons',
  url: 'https://icons.example.com/api',
  apiKey: 'test-key',
  priority: 1,
  enabled: true,
};

const sampleSearchResponse = {
  results: [
    {
      id: 'custom-wechat',
      name: 'WeChat',
      packageName: 'com.tencent.mm',
      bundleId: 'com.tencent.xin',
      developer: 'Tencent',
      category: 'Social',
      iconUrl: 'https://icons.example.com/icons/wechat/512.png',
      sizes: [64, 128, 256, 512],
    },
  ],
  total: 1,
};

const sampleDetailResponse = {
  id: 'custom-wechat',
  name: 'WeChat',
  packageName: 'com.tencent.mm',
  bundleId: 'com.tencent.xin',
  developer: 'Tencent',
  category: 'Social',
  icons: {
    '64': 'https://icons.example.com/icons/wechat/64.png',
    '512': 'https://icons.example.com/icons/wechat/512.png',
  },
};

describe('CustomProvider', () => {
  let provider: CustomProvider;

  beforeEach(() => {
    provider = new CustomProvider(sourceConfig);
    mockFetch.mockReset();
  });

  it('has correct store and name', () => {
    expect(provider.store).toBe('custom');
    expect(provider.name).toBe('my-icons');
  });

  it('searches with correct URL and API key header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleSearchResponse),
    });

    const results = await provider.search('WeChat', 'us', 10);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('WeChat');
    expect(results[0].sourceName).toBe('my-icons');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://icons.example.com/api/search?q=WeChat&limit=10',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      })
    );
  });

  it('looks up an app by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleDetailResponse),
    });

    const result = await provider.lookup('custom-wechat', 'us');
    expect(result).not.toBeNull();
    expect(result!.identifier).toBe('custom-wechat');
  });

  it('returns null on lookup failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

    const result = await provider.lookup('nonexistent', 'us');
    expect(result).toBeNull();
  });

  it('returns iconUrl as-is from getIconUrl', () => {
    const url = 'https://icons.example.com/icons/wechat/512.png';
    expect(provider.getIconUrl(url, 512)).toBe(url);
  });
});
