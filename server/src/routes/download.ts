import { Router } from 'express';
import { getIcon, getIconFile, getIconsDir } from '../db.js';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();

// GET /api/icons/:id/download?size=512
router.get('/:id/download', (req, res) => {
  const icon = getIcon(req.params.id);
  if (!icon) {
    res.status(404).json({ error: 'Icon not found' });
    return;
  }

  const size = parseInt(req.query.size as string) || 512;
  const file = getIconFile(icon.id, size);

  if (!file) {
    res.status(404).json({ error: `No icon file at size ${size}` });
    return;
  }

  const filePath = path.resolve(getIconsDir(), file.file_path);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Icon file missing from disk' });
    return;
  }

  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
  };

  res.setHeader('Content-Type', mimeMap[file.format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${icon.id}_${size}x${size}.${file.format}"`);
  fs.createReadStream(filePath).pipe(res);
});

export default router;
