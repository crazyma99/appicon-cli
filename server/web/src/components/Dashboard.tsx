import { useEffect, useState } from 'react';
import { api, type Stats } from '../api';
import { useApp } from '../i18n';
import type { Page } from '../App';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="text-danger bg-danger/10 border border-danger/20 rounded-xl px-5 py-4 text-sm">
        {t('dash.loadError')}: {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-text-2 text-sm animate-pulse">{t('common.loading')}</div>;
  }

  const statCards = [
    { label: t('dash.totalIcons'), value: stats.totalIcons, accent: 'text-accent' },
    { label: t('dash.iconFiles'), value: stats.totalFiles, accent: 'text-success' },
    { label: t('dash.storage'), value: formatBytes(stats.totalSize), accent: 'text-warning' },
    { label: t('dash.categories'), value: stats.categories.length, accent: 'text-purple-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('dash.title')}</h1>
        <p className="text-text-2 text-sm mt-1">{t('dash.subtitle')}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="bg-surface-1 border border-border rounded-xl p-5 hover:border-border-hover transition-colors"
            style={{ animationDelay: `${i * 60}ms`, animation: 'fadeIn 0.4s ease-out both' }}
          >
            <div className="text-[11px] font-mono text-text-2 uppercase tracking-wider mb-2">{card.label}</div>
            <div className={`text-2xl font-bold font-mono ${card.accent}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">{t('dash.categories')}</h2>
          {stats.categories.length === 0 ? (
            <p className="text-text-2 text-sm">{t('dash.noIcons')}</p>
          ) : (
            <div className="space-y-2.5">
              {stats.categories.map((cat) => {
                const pct = stats.totalIcons > 0 ? (cat.count / stats.totalIcons) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-1">{cat.category}</span>
                      <span className="font-mono text-text-2 text-xs">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold">{t('dash.recentIcons')}</h2>
            <button onClick={() => onNavigate('icons')} className="text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer">
              {t('dash.viewAll')}
            </button>
          </div>
          {stats.recentIcons.length === 0 ? (
            <p className="text-text-2 text-sm">{t('dash.noIconsHint')}</p>
          ) : (
            <div className="space-y-2">
              {stats.recentIcons.map((icon) => (
                <div key={icon.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-surface-3 border border-border overflow-hidden flex items-center justify-center">
                    <img src={`/api/icons/${icon.id}/download?size=64`} alt={icon.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{icon.name}</div>
                    <div className="text-[11px] font-mono text-text-2">{icon.id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-surface-1 border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">{t('dash.quickStart')}</h2>
        <div className="bg-surface-2 rounded-lg p-4 font-mono text-xs text-text-1 space-y-1 overflow-x-auto">
          <div className="text-text-2">{t('dash.quickStartComment1')}</div>
          <div>
            <span className="text-accent">appicon</span> config add-source --name local --url <span className="text-success">http://localhost:3000/api/icons</span> --key <span className="text-warning">default-dev-key</span>
          </div>
          <div className="text-text-2 mt-2">{t('dash.quickStartComment2')}</div>
          <div>
            <span className="text-accent">appicon</span> search "icon-name" --store custom
          </div>
        </div>
      </div>
    </div>
  );
}
