export type Store = 'apple' | 'google' | 'custom';
export type StoreFilter = Store | 'all';
export type ImageFormat = 'png' | 'jpg' | 'webp';

export interface AppInfo {
  id: string;
  name: string;
  identifier: string;
  developer: string;
  store: Store;
  sourceName?: string;
  storeUrl: string;
  iconUrl: string;
  rating?: number;
  genre?: string;
  description?: string;
  version?: string;
  price?: string;
}

export interface SearchOptions {
  store: StoreFilter;
  country: string;
  limit: number;
}

export interface DownloadOptions {
  store?: Store;
  sizes: number[];
  format: ImageFormat;
  output: string;
  country: string;
}

export interface DownloadResult {
  app: string;
  identifier: string;
  store: Store;
  files: Array<{
    size: number;
    format: ImageFormat;
    path: string;
  }>;
}

export interface CustomSourceConfig {
  name: string;
  url: string;
  apiKey: string;
  priority: number;
  enabled: boolean;
}

export interface AppIconConfig {
  sources: CustomSourceConfig[];
  defaults: {
    sizes: number[];
    format: ImageFormat;
    country: string;
  };
  searchPriority: string[];
  cache: {
    dir: string;
    ttl: number;
  };
}
