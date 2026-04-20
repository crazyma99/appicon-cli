import { useState, useRef } from 'react';
import { api } from '../api';

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
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
      setError('Icon file, ID, and name are required.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeIn 0.2s ease-out both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Upload Icon</h2>
          <button onClick={onClose} className="text-text-2 hover:text-text-0 cursor-pointer text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-hover'
            }`}
          >
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <img src={preview} alt="Preview" className="w-20 h-20 rounded-xl object-contain bg-surface-2 p-1" />
                <span className="text-sm text-text-1">{file?.name}</span>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2 opacity-30">↑</div>
                <div className="text-sm text-text-2">Drop image here or click to browse</div>
                <div className="text-xs text-text-2 mt-1">PNG, JPG, WebP &middot; Max 10MB</div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">ID *</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="my-app-icon"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My App"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">Package Name</label>
              <input
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.example.app"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">Developer</label>
              <input
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="Developer name"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Social"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="social, messaging"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-0 placeholder-text-2 outline-none focus:border-accent"
              />
            </div>
          </div>

          {error && (
            <div className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-1 hover:text-text-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
