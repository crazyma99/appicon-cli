import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { apiKeyAuth } from './middleware/auth.js';
import searchRouter from './routes/search.js';
import iconRouter from './routes/icon.js';
import downloadRouter from './routes/download.js';
import uploadRouter from './routes/upload.js';
import { getStats, listApiKeys, createApiKey, deleteApiKey, listAllIcons, getIconFiles } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// All /api routes require API key (except health)
app.use('/api', apiKeyAuth);

// Icon routes
app.use('/api/icons', searchRouter);
app.use('/api/icons', uploadRouter);
app.use('/api/icons', downloadRouter);
app.use('/api/icons', iconRouter);

// Stats
app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

// List all icons (for Web UI)
app.get('/api/icons-list', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const { icons, total } = listAllIcons(limit, offset);

  const results = icons.map((icon) => {
    const files = getIconFiles(icon.id);
    return {
      ...icon,
      tags: JSON.parse(icon.tags || '[]'),
      files: files.map((f) => ({ size: f.size, format: f.format })),
    };
  });

  res.json({ results, total, limit, offset });
});

// API Key management
app.get('/api/keys', (_req, res) => {
  res.json(listApiKeys());
});

app.post('/api/keys', (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Field "name" is required.' });
    return;
  }
  const key = createApiKey(name);
  res.status(201).json(key);
});

app.delete('/api/keys/:key', (req, res) => {
  const deleted = deleteApiKey(req.params.key);
  if (!deleted) {
    res.status(404).json({ error: 'API key not found' });
    return;
  }
  res.json({ success: true });
});

// Serve SPA static files (if built)
const publicDir = path.join(import.meta.dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  appicon-server running at http://localhost:${PORT}`);
  console.log(`  API:    http://localhost:${PORT}/api/health`);
  console.log(`  Web UI: http://localhost:${PORT}\n`);
  console.log(`  Default API Key: default-dev-key\n`);
});
