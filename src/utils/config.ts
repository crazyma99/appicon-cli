import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AppIconConfig, CustomSourceConfig } from '../types.js';

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.appicon');
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, 'config.json');

export function getDefaultConfig(): AppIconConfig {
  return {
    sources: [],
    defaults: {
      sizes: [512],
      format: 'png',
      country: 'us',
    },
    searchPriority: ['custom', 'apple', 'google'],
    cache: {
      dir: getCacheDir(),
      ttl: 86400,
    },
  };
}

function getCacheDir(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'appicon-cli');
  }
  if (platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'appicon-cli',
      'Cache'
    );
  }
  return path.join(os.homedir(), '.cache', 'appicon-cli');
}

export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): AppIconConfig {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: AppIconConfig, configPath: string = DEFAULT_CONFIG_PATH): void {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function addSource(config: AppIconConfig, source: CustomSourceConfig): AppIconConfig {
  if (config.sources.some((s) => s.name === source.name)) {
    throw new Error(`Source "${source.name}" already exists`);
  }
  return { ...config, sources: [...config.sources, source] };
}

export function removeSource(config: AppIconConfig, name: string): AppIconConfig {
  const idx = config.sources.findIndex((s) => s.name === name);
  if (idx === -1) {
    throw new Error(`Source "${name}" not found`);
  }
  const sources = [...config.sources];
  sources.splice(idx, 1);
  return { ...config, sources };
}

export function getConfigPath(): string {
  return DEFAULT_CONFIG_PATH;
}
