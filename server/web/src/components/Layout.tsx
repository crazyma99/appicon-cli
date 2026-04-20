import type { Page } from '../App';

const NAV_ITEMS: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫' },
  { id: 'icons', label: 'Icons', icon: '⬡' },
  { id: 'keys', label: 'API Keys', icon: '⚿' },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
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

        <div className="p-4 border-t border-border">
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
