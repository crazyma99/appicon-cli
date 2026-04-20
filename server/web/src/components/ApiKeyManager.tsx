import { useEffect, useState } from 'react';
import { api, type ApiKey } from '../api';
import { useApp } from '../i18n';

export function ApiKeyManager() {
  const { t } = useApp();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadKeys = () => api.listKeys().then(setKeys);

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const key = await api.createKey(newKeyName.trim());
      setKeys([key, ...keys]);
      setNewKeyName('');
      setCopiedKey(key.key);
      navigator.clipboard.writeText(key.key);
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(t('keys.confirmDelete'))) return;
    await api.deleteKey(key);
    loadKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('keys.title')}</h1>
        <p className="text-text-2 text-sm mt-1">{t('keys.subtitle')}</p>
      </div>

      <div className="bg-surface-1 border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">{t('keys.createTitle')}</h2>
        <div className="flex gap-3">
          <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder={t('keys.placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent" />
          <button onClick={handleCreate} disabled={creating || !newKeyName.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            {creating ? '...' : t('keys.create')}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.key} className="bg-surface-1 border border-border rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{k.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono text-text-2 bg-surface-2 rounded px-2 py-0.5 truncate max-w-xs">{k.key}</code>
                <button onClick={() => copyKey(k.key)} className="text-xs text-accent hover:text-accent-hover cursor-pointer shrink-0">
                  {copiedKey === k.key ? t('keys.copied') : t('keys.copy')}
                </button>
              </div>
            </div>
            <div className="text-xs text-text-2 shrink-0">{new Date(k.created_at + 'Z').toLocaleDateString()}</div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${k.enabled ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
              {k.enabled ? t('keys.active') : t('keys.disabled')}
            </span>
            <button onClick={() => handleDelete(k.key)} className="text-text-2 hover:text-danger text-sm cursor-pointer shrink-0" title="Delete">✕</button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-surface-1 border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">{t('keys.usage')}</h2>
        <div className="bg-surface-2 rounded-lg p-4 font-mono text-xs text-text-1 space-y-1">
          <div className="text-text-2">{t('keys.usageComment1')}</div>
          <div><span className="text-accent">appicon</span> config add-source --name local --url <span className="text-success">http://localhost:3000/api/icons</span> --key <span className="text-warning">YOUR_API_KEY</span></div>
          <div className="text-text-2 mt-2">{t('keys.usageComment2')}</div>
          <div>curl -H <span className="text-warning">"X-API-Key: YOUR_API_KEY"</span> http://localhost:3000/api/icons/search?q=test</div>
        </div>
      </div>
    </div>
  );
}
