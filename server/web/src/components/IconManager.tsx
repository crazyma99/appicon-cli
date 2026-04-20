import { useEffect, useState, useCallback } from 'react';
import { api, type IconItem, getApiKey } from '../api';
import { useApp } from '../i18n';
import { UploadModal } from './UploadModal';
import { IconDetail } from './IconDetail';

export function IconManager() {
  const { t } = useApp();
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const loadIcons = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim()) {
        const data = await api.searchIcons(search);
        setIcons(data.results.map((r: any) => ({
          id: r.id, name: r.name, package_name: r.packageName, bundle_id: r.bundleId,
          developer: r.developer, category: r.category, tags: [],
          files: (r.sizes || []).map((s: number) => ({ size: s, format: 'png' })),
          created_at: '', updated_at: '',
        })));
        setTotal(data.total);
      } else {
        const data = await api.listIcons();
        setIcons(data.results);
        setTotal(data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadIcons, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadIcons]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('detail.confirmDelete', id))) return;
    await api.deleteIcon(id);
    setSelectedId(null);
    loadIcons();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('icons.title')}</h1>
          <p className="text-text-2 text-sm mt-1">{t('icons.count', total)}</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          {t('icons.upload')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('icons.search')}
            className="w-full bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-0 cursor-pointer">✕</button>
          )}
        </div>
        <div className="flex bg-surface-1 border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-0'}`}>▦</button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-surface-3 text-text-0' : 'text-text-2 hover:text-text-0'}`}>☰</button>
        </div>
      </div>

      {loading ? (
        <div className="text-text-2 text-sm animate-pulse py-12 text-center">{t('icons.loading')}</div>
      ) : icons.length === 0 ? (
        <div className="text-center py-16 bg-surface-1 border border-border rounded-xl">
          <div className="text-4xl mb-3 opacity-30">⬡</div>
          <div className="text-text-2 text-sm">{t('icons.noIcons')}</div>
          <button onClick={() => setShowUpload(true)} className="mt-3 text-accent text-sm hover:text-accent-hover cursor-pointer">{t('icons.uploadFirst')}</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {icons.map((icon) => (
            <button key={icon.id} onClick={() => setSelectedId(icon.id)}
              className={`bg-surface-1 border rounded-xl p-4 text-left cursor-pointer transition-all duration-150 hover:border-border-hover hover:bg-surface-2 group ${selectedId === icon.id ? 'border-accent ring-1 ring-accent/30' : 'border-border'}`}>
              <div className="aspect-square rounded-lg bg-surface-2 border border-border mb-3 overflow-hidden flex items-center justify-center">
                <img src={`/api/icons/${icon.id}/download?size=256&key=${getApiKey()}`} alt={icon.name}
                  className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="text-sm font-medium truncate">{icon.name}</div>
              <div className="text-[11px] font-mono text-text-2 truncate">{icon.id}</div>
              {icon.category && (
                <div className="mt-1.5">
                  <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-surface-3 rounded text-text-2">{icon.category}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {icons.map((icon) => (
            <button key={icon.id} onClick={() => setSelectedId(icon.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left cursor-pointer transition-colors ${selectedId === icon.id ? 'bg-accent/10 border border-accent/30' : 'hover:bg-surface-1 border border-transparent'}`}>
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border overflow-hidden shrink-0">
                <img src={`/api/icons/${icon.id}/download?size=64&key=${getApiKey()}`} alt={icon.name} className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{icon.name}</div>
                <div className="text-[11px] font-mono text-text-2">{icon.id}</div>
              </div>
              <div className="text-xs text-text-2">{icon.developer}</div>
              {icon.category && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-2 rounded text-text-2">{icon.category}</span>}
              <div className="text-[11px] font-mono text-text-2">{icon.files.map(f => f.size).join('/')}</div>
            </button>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); loadIcons(); }} />}
      {selectedId && <IconDetail iconId={selectedId} onClose={() => setSelectedId(null)} onDelete={handleDelete} onUpdated={loadIcons} />}
    </div>
  );
}
