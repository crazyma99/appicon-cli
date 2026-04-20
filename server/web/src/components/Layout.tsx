import type { Page } from '../App';
import { useApp } from '../i18n';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { t, lang, setLang, theme, setTheme } = useApp();

  const NAV_ITEMS: Array<{ id: Page; label: string; icon: string }> = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: '◫' },
    { id: 'icons', label: t('nav.icons'), icon: '⬡' },
    { id: 'keys', label: t('nav.keys'), icon: '⚿' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface-1 border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent text-sm font-bold font-mono">
              AI
            </div>
            <div>
              <div className="text-sm font-semibold text-text-0 tracking-tight">appicon</div>
              <div className="text-[11px] font-mono text-text-2 tracking-wider uppercase">server</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left cursor-pointer ${
                  active
                    ? 'bg-surface-3 text-text-0 font-medium'
                    : 'text-text-1 hover:bg-surface-2 hover:text-text-0'
                }`}
              >
                <span className="text-base opacity-60">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Theme + Lang toggles */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              ● Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-colors ${
                theme === 'light' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              ○ Light
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-colors ${
                lang === 'en' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('zh')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-colors ${
                lang === 'zh' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              中文
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border">
          <div className="text-[11px] font-mono text-text-2">
            v0.1.0 &middot; appicon-server
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-surface-0">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
