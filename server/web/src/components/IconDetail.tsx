import { useEffect, useState } from 'react';
import { api, type IconDetail as IconDetailType, getApiKey } from '../api';
import { useApp } from '../i18n';

interface IconDetailProps {
  iconId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}

export function IconDetail({ iconId, onClose, onDelete, onUpdated }: IconDetailProps) {
  const { t } = useApp();
  const [icon, setIcon] = useState<IconDetailType | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', packageName: '', developer: '', category: '', tags: '' });

  useEffect(() => {
    api.getIcon(iconId).then((data) => {
      setIcon(data);
      setForm({
        name: data.name,
        packageName: data.packageName || '',
        developer: data.developer || '',
        category: data.category || '',
        tags: data.tags.join(', '),
      });
    });
  }, [iconId]);

  const handleSave = async () => {
    await api.updateIcon(iconId, {
      name: form.name,
      packageName: form.packageName || null,
      developer: form.developer || null,
      category: form.category || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditing(false);
    onUpdated();
    api.getIcon(iconId).then(setIcon);
  };

  if (!icon) return null;

  const sizes = Object.keys(icon.icons).map(Number).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeIn 0.2s ease-out both' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{icon.name}</h2>
          <button onClick={onClose} className="text-text-2 hover:text-text-0 cursor-pointer text-xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          <div className="flex items-end gap-4 mb-6 pb-6 border-b border-border overflow-x-auto">
            {sizes.map((size) => {
              const displaySize = Math.min(size, 128);
              return (
                <div key={size} className="flex flex-col items-center gap-2 shrink-0">
                  <div className="rounded-xl bg-surface-2 border border-border overflow-hidden flex items-center justify-center"
                    style={{ width: displaySize, height: displaySize }}>
                    <img src={`${icon.icons[String(size)]}${icon.icons[String(size)].includes('?') ? '&' : '?'}key=${getApiKey()}`}
                      alt={`${size}px`} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-mono text-text-2">{size}px</span>
                </div>
              );
            })}
          </div>

          {editing ? (
            <div className="space-y-3">
              {(['name', 'packageName', 'developer', 'category', 'tags'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-mono text-text-2 mb-1">{field}</label>
                  <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 outline-none focus:border-accent" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg cursor-pointer">{t('detail.save')}</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-text-2 text-sm cursor-pointer">{t('detail.cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <InfoRow label="ID" value={icon.id} mono />
              <InfoRow label="Name" value={icon.name} />
              <InfoRow label="Package" value={icon.packageName || '-'} mono />
              <InfoRow label="Bundle ID" value={icon.bundleId || '-'} mono />
              <InfoRow label="Developer" value={icon.developer || '-'} />
              <InfoRow label="Category" value={icon.category || '-'} />
              <InfoRow label="Tags" value={icon.tags.length > 0 ? icon.tags.join(', ') : '-'} />
              <InfoRow label="Created" value={icon.createdAt} />

              <div className="pt-3 mt-3 border-t border-border">
                <div className="text-xs font-mono text-text-2 mb-2">{t('detail.downloadUrls')}</div>
                {sizes.map((size) => (
                  <div key={size} className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-mono text-text-2 w-12">{size}px</span>
                    <code className="flex-1 text-text-1 bg-surface-2 rounded px-2 py-1 truncate text-[11px]">{icon.icons[String(size)]}</code>
                    <button onClick={() => navigator.clipboard.writeText(window.location.origin + icon.icons[String(size)])}
                      className="text-accent hover:text-accent-hover cursor-pointer shrink-0" title={t('detail.copyUrl')}>⎘</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between">
          <button onClick={() => onDelete(iconId)} className="px-3 py-1.5 text-danger hover:bg-danger/10 text-sm rounded-lg transition-colors cursor-pointer">{t('detail.delete')}</button>
          <div className="flex gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 bg-surface-3 hover:bg-surface-4 text-sm rounded-lg transition-colors cursor-pointer">{t('detail.edit')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-mono text-text-2 w-20 shrink-0">{label}</span>
      <span className={`text-sm text-text-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
