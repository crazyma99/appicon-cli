import { describe, it, expect } from 'vitest';
import { sanitizeFilename, buildOutputPath } from '../../src/utils/image.js';

describe('image utils', () => {
  it('sanitizes filenames with special characters', () => {
    expect(sanitizeFilename('WeChat / 微信')).toBe('WeChat_____');
    expect(sanitizeFilename('App:Name')).toBe('App_Name');
  });

  it('sanitizes filenames with spaces', () => {
    expect(sanitizeFilename('My App Name')).toBe('My_App_Name');
  });

  it('builds correct output path', () => {
    const p = buildOutputPath('/tmp/icons', 'WeChat', 512, 'png');
    expect(p).toBe('/tmp/icons/WeChat_512x512.png');
  });

  it('builds output path with different format', () => {
    const p = buildOutputPath('/tmp', 'App', 256, 'webp');
    expect(p).toBe('/tmp/App_256x256.webp');
  });
});
