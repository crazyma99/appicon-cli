import fs from 'node:fs';
import path from 'node:path';
import { PLATFORMS, type Platform } from './platforms.js';

export function detectPlatforms(cwd: string = process.cwd()): Platform[] {
  const detected: Platform[] = [];
  for (const [key, config] of Object.entries(PLATFORMS)) {
    if (fs.existsSync(path.join(cwd, config.detectDir))) {
      detected.push(key as Platform);
    }
  }
  return detected;
}
