import { useState, useRef } from 'react';
import { api } from '../api';
import { useApp } from '../i18n';

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const { t } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!name) {
      const n = f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      setName(n);
      if (!id) setId(n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !id || !name) {
      setError(t('upload.required'));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('icon', file);
      formData.append('id', id);
      formData.append('name', name);
      if (packageName) formData.append('packageName', packageName);
      if (developer) formData.append('developer', developer);
      if (category) formData.append('category', category);
      if (tags) formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      await api.uploadIcon(formData);
      onUploaded();
    } catch (e: any) {
      setError(e.message);
    }
    setUploading(false);
  };

  const fields: Array<{ key: string; label: string; value: string; set: (v: string) => void; placeholder: string; required?: boolean }> = [
    { key: 'id', label: t('upload.id') + ' *', value: id, set: setId, placeholder: 'my-app-icon', required: true },
    { key: 'name', label: t('upload.name') + ' *', value: name, set: setName, placeholder: 'My App', required: true },
    { key: 'pkg', label: t('upload.packageName'), value: packageName, set: setPackageName, placeholder: 'com.example.app' },
    { key: 'dev', label: t('upload.developer'), value: developer, set: setDeveloper, placeholder: 'Developer name' },
    { key: 'cat', label: t('upload.category'), value: category, set: setCategory, placeholder: 'Social' },
    { key: 'tags', label: t('upload.tags'), value: tags, set: setTags, placeholder: 'social, messaging' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeIn 0.2s ease-out both' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t('upload.title')}</h2>
          <button onClick={onClose} className="text-text-2 hover:text-text-0 cursor-pointer text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-hover'}`}>
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <img src={preview} alt="Preview" className="w-20 h-20 rounded-xl object-contain bg-surface-2 p-1" />
                <span className="text-sm text-text-1">{file?.name}</span>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2 opacity-30">↑</div>
                <div className="text-sm text-text-2">{t('upload.drop')}</div>
                <div className="text-xs text-text-2 mt-1">{t('upload.dropHint')}</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-mono text-text-2 mb-1">{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent" />
              </div>
            ))}
          </div>
          {error && <div className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-1 hover:text-text-0 cursor-pointer">{t('upload.cancel')}</button>
          <button onClick={handleSubmit} disabled={uploading}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            {uploading ? t('upload.uploading') : t('upload.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
