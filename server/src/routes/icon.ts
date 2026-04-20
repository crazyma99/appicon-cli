import { Router } from 'express';
import { getIcon, getIconFiles, updateIcon, deleteIcon, getIconsDir } from '../db.js';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();

// GET /api/icons/:id
router.get('/:id', (req, res) => {
  const icon = getIcon(req.params.id);
  if (!icon) {
    res.status(404).json({ error: 'Icon not found' });
    return;
  }

  const files = getIconFiles(icon.id);
  const icons: Record<string, string> = {};
  for (const f of files) {
    icons[String(f.size)] = `/api/icons/${icon.id}/download?size=${f.size}`;
  }

  res.json({
    id: icon.id,
    name: icon.name,
    packageName: icon.package_name,
    bundleId: icon.bundle_id,
    developer: icon.developer,
    category: icon.category,
    tags: JSON.parse(icon.tags || '[]'),
    icons,
    createdAt: icon.created_at,
    updatedAt: icon.updated_at,
  });
});

// PUT /api/icons/:id
router.put('/:id', (req, res) => {
  const existing = getIcon(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Icon not found' });
    return;
  }

  const updated = updateIcon(req.params.id, {
    name: req.body.name,
    package_name: req.body.packageName,
    bundle_id: req.body.bundleId,
    developer: req.body.developer,
    category: req.body.category,
    tags: req.body.tags,
  });

  res.json(updated);
});

// DELETE /api/icons/:id
router.delete('/:id', (req, res) => {
  const icon = getIcon(req.params.id);
  if (!icon) {
    res.status(404).json({ error: 'Icon not found' });
    return;
  }

  // Delete icon files from disk
  const iconDir = path.join(getIconsDir(), req.params.id);
  if (fs.existsSync(iconDir)) {
    fs.rmSync(iconDir, { recursive: true, force: true });
  }

  deleteIcon(req.params.id);
  res.json({ success: true });
});

export default router;
