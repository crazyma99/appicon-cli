import os from 'node:os';

type Lang = 'zh' | 'en';

const messages = {
  // Program
  'program.description': {
    en: 'Search and download APP icons from Apple App Store, Google Play, and custom servers',
    zh: '从 Apple App Store、Google Play 和自定义服务器搜索和下载 APP 图标',
  },

  // search command
  'search.description': {
    en: 'Search APP icons across stores',
    zh: '跨商店搜索 APP 图标',
  },
  'search.store': {
    en: 'Store to search: apple, google, custom, all',
    zh: '搜索范围：apple, google, custom, all',
  },
  'search.country': {
    en: 'Country/region code',
    zh: '国家/地区代码',
  },
  'search.limit': {
    en: 'Max results per store',
    zh: '每个数据源最大结果数',
  },
  'search.json': {
    en: 'Output as JSON',
    zh: '以 JSON 格式输出',
  },

  // download command
  'download.description': {
    en: 'Download APP icon by package name or bundle ID',
    zh: '通过包名或 Bundle ID 下载 APP 图标',
  },
  'download.store': {
    en: 'Store: apple, google, custom',
    zh: '数据源：apple, google, custom',
  },
  'download.size': {
    en: 'Icon size in px',
    zh: '图标尺寸（像素）',
  },
  'download.sizes': {
    en: 'Multiple sizes, comma-separated (e.g. "64,128,256,512")',
    zh: '多尺寸，逗号分隔（如 "64,128,256,512"）',
  },
  'download.format': {
    en: 'Output format: png, jpg, webp',
    zh: '输出格式：png, jpg, webp',
  },
  'download.output': {
    en: 'Output directory',
    zh: '输出目录',
  },
  'download.country': {
    en: 'Country/region code',
    zh: '国家/地区代码',
  },
  'download.json': {
    en: 'Output as JSON',
    zh: '以 JSON 格式输出',
  },

  // info command
  'info.description': {
    en: 'View APP details and icon URLs',
    zh: '查看 APP 详情及图标 URL',
  },
  'info.store': {
    en: 'Store: apple, google, custom',
    zh: '数据源：apple, google, custom',
  },
  'info.country': {
    en: 'Country/region code',
    zh: '国家/地区代码',
  },
  'info.json': {
    en: 'Output as JSON',
    zh: '以 JSON 格式输出',
  },

  // batch command
  'batch.description': {
    en: 'Batch download icons from a JSON or CSV file',
    zh: '从 JSON 或 CSV 文件批量下载图标',
  },
  'batch.format': {
    en: 'Output format: png, jpg, webp',
    zh: '输出格式：png, jpg, webp',
  },
  'batch.output': {
    en: 'Output directory',
    zh: '输出目录',
  },
  'batch.country': {
    en: 'Country/region code',
    zh: '国家/地区代码',
  },
  'batch.json': {
    en: 'Output as JSON',
    zh: '以 JSON 格式输出',
  },

  // config command
  'config.description': {
    en: 'Manage configuration and custom data sources',
    zh: '管理配置和自定义数据源',
  },
  'config.addSource': {
    en: 'Add a custom icon API source',
    zh: '添加自定义图标 API 数据源',
  },
  'config.removeSource': {
    en: 'Remove a custom icon API source',
    zh: '删除自定义图标 API 数据源',
  },
  'config.listSources': {
    en: 'List all configured sources',
    zh: '列出所有已配置的数据源',
  },
  'config.setPriority': {
    en: 'Set store search priority (comma-separated)',
    zh: '设置商店搜索优先级（逗号分隔）',
  },
  'config.show': {
    en: 'Show current configuration',
    zh: '查看当前完整配置',
  },
  'config.sourceName': {
    en: 'Source name',
    zh: '数据源名称',
  },
  'config.sourceUrl': {
    en: 'API base URL',
    zh: 'API 基础 URL',
  },
  'config.sourceKey': {
    en: 'API key',
    zh: 'API 密钥',
  },
  'config.priority': {
    en: 'Priority (lower = higher)',
    zh: '优先级（数字越小越优先）',
  },
} as const;

type MessageKey = keyof typeof messages;

function detectLang(): Lang {
  const env = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  if (env.startsWith('zh')) return 'zh';
  return 'en';
}

let currentLang: Lang = detectLang();

export function t(key: MessageKey): string {
  const entry = messages[key];
  return entry[currentLang] || entry['en'];
}

export function getLang(): Lang {
  return currentLang;
}
