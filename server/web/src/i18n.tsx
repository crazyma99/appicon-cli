import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';
export type Theme = 'dark' | 'light';

const messages: Record<string, Record<Lang, string>> = {
  // Nav
  'nav.dashboard': { en: 'Dashboard', zh: '仪表盘' },
  'nav.icons': { en: 'Icons', zh: '图标' },
  'nav.keys': { en: 'API Keys', zh: 'API 密钥' },

  // Dashboard
  'dash.title': { en: 'Dashboard', zh: '仪表盘' },
  'dash.subtitle': { en: 'Overview of your icon library', zh: '图标库概览' },
  'dash.totalIcons': { en: 'Total Icons', zh: '图标总数' },
  'dash.iconFiles': { en: 'Icon Files', zh: '图标文件' },
  'dash.storage': { en: 'Storage', zh: '存储占用' },
  'dash.categories': { en: 'Categories', zh: '分类' },
  'dash.recentIcons': { en: 'Recent Icons', zh: '最近上传' },
  'dash.viewAll': { en: 'View all →', zh: '查看全部 →' },
  'dash.noIcons': { en: 'No icons yet', zh: '暂无图标' },
  'dash.noIconsHint': { en: 'No icons yet. Upload your first icon!', zh: '暂无图标，上传你的第一个图标吧！' },
  'dash.quickStart': { en: 'Quick Start', zh: '快速开始' },
  'dash.quickStartComment1': { en: '# Configure appicon CLI to use this server', zh: '# 配置 appicon CLI 使用此服务器' },
  'dash.quickStartComment2': { en: '# Then search and download', zh: '# 然后搜索和下载' },
  'dash.loadError': { en: 'Failed to load stats', zh: '加载统计数据失败' },

  // Icons
  'icons.title': { en: 'Icons', zh: '图标管理' },
  'icons.count': { en: '{0} icons in library', zh: '图标库中共 {0} 个图标' },
  'icons.upload': { en: '+ Upload', zh: '+ 上传' },
  'icons.search': { en: 'Search icons...', zh: '搜索图标...' },
  'icons.noIcons': { en: 'No icons yet', zh: '暂无图标' },
  'icons.uploadFirst': { en: 'Upload your first icon', zh: '上传你的第一个图标' },
  'icons.loading': { en: 'Loading...', zh: '加载中...' },

  // Upload
  'upload.title': { en: 'Upload Icon', zh: '上传图标' },
  'upload.drop': { en: 'Drop image here or click to browse', zh: '拖拽图片到此处或点击浏览' },
  'upload.dropHint': { en: 'PNG, JPG, WebP · Max 10MB', zh: 'PNG, JPG, WebP · 最大 10MB' },
  'upload.id': { en: 'ID', zh: '标识' },
  'upload.name': { en: 'Name', zh: '名称' },
  'upload.packageName': { en: 'Package Name', zh: '包名' },
  'upload.developer': { en: 'Developer', zh: '开发者' },
  'upload.category': { en: 'Category', zh: '分类' },
  'upload.tags': { en: 'Tags', zh: '标签' },
  'upload.cancel': { en: 'Cancel', zh: '取消' },
  'upload.submit': { en: 'Upload', zh: '上传' },
  'upload.uploading': { en: 'Uploading...', zh: '上传中...' },
  'upload.required': { en: 'Icon file, ID, and name are required.', zh: '图标文件、标识和名称为必填项。' },

  // Detail
  'detail.downloadUrls': { en: 'Download URLs', zh: '下载链接' },
  'detail.delete': { en: 'Delete', zh: '删除' },
  'detail.edit': { en: 'Edit', zh: '编辑' },
  'detail.save': { en: 'Save', zh: '保存' },
  'detail.cancel': { en: 'Cancel', zh: '取消' },
  'detail.copyUrl': { en: 'Copy URL', zh: '复制链接' },
  'detail.confirmDelete': { en: 'Delete icon "{0}"?', zh: '确定删除图标「{0}」？' },

  // API Keys
  'keys.title': { en: 'API Keys', zh: 'API 密钥' },
  'keys.subtitle': { en: 'Manage authentication keys for API access', zh: '管理 API 访问认证密钥' },
  'keys.createTitle': { en: 'Create New Key', zh: '创建新密钥' },
  'keys.placeholder': { en: 'Key name (e.g., production, claude-code)', zh: '密钥名称（如 production, claude-code）' },
  'keys.create': { en: 'Create', zh: '创建' },
  'keys.copy': { en: 'Copy', zh: '复制' },
  'keys.copied': { en: '✓ Copied', zh: '✓ 已复制' },
  'keys.active': { en: 'active', zh: '启用' },
  'keys.disabled': { en: 'disabled', zh: '禁用' },
  'keys.usage': { en: 'Usage', zh: '使用方法' },
  'keys.usageComment1': { en: '# Use with appicon CLI', zh: '# 配合 appicon CLI 使用' },
  'keys.usageComment2': { en: '# Use with curl', zh: '# 配合 curl 使用' },
  'keys.confirmDelete': { en: 'Delete this API key? This cannot be undone.', zh: '确定删除此 API 密钥？此操作不可撤销。' },

  // Common
  'common.loading': { en: 'Loading...', zh: '加载中...' },
};

interface AppState {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const AppContext = createContext<AppState>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('appicon-lang') as Lang) || (navigator.language.startsWith('zh') ? 'zh' : 'en')
  );
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('appicon-theme') as Theme) || 'dark'
  );

  useEffect(() => {
    localStorage.setItem('appicon-lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('appicon-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const t = (key: string, ...args: (string | number)[]): string => {
    const entry = messages[key];
    if (!entry) return key;
    let text = entry[lang] || entry['en'];
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, String(arg));
    });
    return text;
  };

  return (
    <AppContext.Provider value={{ lang, theme, setLang, setTheme, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
