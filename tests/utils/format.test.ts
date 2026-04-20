import { describe, it, expect } from 'vitest';
import { formatSearchResults, formatAppInfo, formatError, formatSuccess } from '../../src/utils/format.js';
import type { AppInfo } from '../../src/types.js';

const sampleApp: AppInfo = {
  id: '1',
  name: 'WeChat',
  identifier: 'com.tencent.xin',
  developer: 'WeChat',
  store: 'apple',
  storeUrl: 'https://apps.apple.com/app/id836500024',
  iconUrl: 'https://example.com/icon.png',
  rating: 4.7,
  genre: 'Social',
};

describe('format', () => {
  it('formats search results as table string', () => {
    const output = formatSearchResults([sampleApp]);
    expect(output).toContain('WeChat');
    expect(output).toContain('com.tencent.xin');
  });

  it('formats empty search results', () => {
    const output = formatSearchResults([]);
    expect(output).toContain('No results');
  });

  it('formats app info', () => {
    const output = formatAppInfo(sampleApp, [
      { size: 256, url: 'https://example.com/256.png' },
      { size: 512, url: 'https://example.com/512.png' },
    ]);
    expect(output).toContain('WeChat');
    expect(output).toContain('256x256');
    expect(output).toContain('512x512');
  });

  it('formats error message', () => {
    const output = formatError('Something went wrong');
    expect(output).toContain('Something went wrong');
  });

  it('formats success message', () => {
    const output = formatSuccess('Done!');
    expect(output).toContain('Done!');
  });
});
