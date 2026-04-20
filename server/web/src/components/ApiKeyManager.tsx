import { useEffect, useState } from 'react';
import { api, type ApiKey } from '../api';

export function ApiKeyManager() {
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
    } catch {
      // ignore
    }
    setCreating(false);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
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
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-text-2 text-sm mt-1">Manage authentication keys for API access</p>
      </div>

      {/* Create new key */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">Create New Key</h2>
        <div className="flex gap-3">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., production, claude-code)"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Key list */}
      <div className="space-y-2">
        {keys.map((k) => (
          <div
            key={k.key}
            className="bg-surface-1 border border-border rounded-xl px-5 py-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{k.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono text-text-2 bg-surface-2 rounded px-2 py-0.5 truncate max-w-xs">
                  {k.key}
                </code>
                <button
                  onClick={() => copyKey(k.key)}
                  className="text-xs text-accent hover:text-accent-hover cursor-pointer shrink-0"
                >
                  {copiedKey === k.key ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="text-xs text-text-2 shrink-0">
              {new Date(k.created_at + 'Z').toLocaleDateString()}
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${k.enabled ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
              {k.enabled ? 'active' : 'disabled'}
            </span>
            <button
              onClick={() => handleDelete(k.key)}
              className="text-text-2 hover:text-danger text-sm cursor-pointer shrink-0"
              title="Delete key"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Usage instructions */}
      <div className="mt-8 bg-surface-1 border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Usage</h2>
        <div className="bg-surface-2 rounded-lg p-4 font-mono text-xs text-text-1 space-y-1">
          <div className="text-text-2"># Use with appicon CLI</div>
          <div>
            <span className="text-accent">appicon</span> config add-source --name local --url <span className="text-success">http://localhost:3000/api/icons</span> --key <span className="text-warning">YOUR_API_KEY</span>
          </div>
          <div className="text-text-2 mt-2"># Use with curl</div>
          <div>
            curl -H <span className="text-warning">"X-API-Key: YOUR_API_KEY"</span> http://localhost:3000/api/icons/search?q=test
          </div>
        </div>
      </div>
    </div>
  );
}
