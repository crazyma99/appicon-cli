import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { createIcon, addIconFile, getIcon, getIconsDir } from '../db.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

const SIZES = [64, 128, 256, 512];

// POST /api/icons/upload
router.post('/upload', upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Use field name "icon".' });
      return;
    }

    const { id, name, packageName, bundleId, developer, category, tags } = req.body;
    if (!id || !name) {
      res.status(400).json({ error: 'Fields "id" and "name" are required.' });
      return;
    }

    if (getIcon(id)) {
      res.status(409).json({ error: `Icon "${id}" already exists.` });
      return;
    }

    // Create icon record
    const icon = createIcon({
      id,
      name,
      package_name: packageName,
      bundle_id: bundleId,
      developer,
      category,
      tags: tags ? JSON.parse(tags) : [],
    });

    // Create icon directory
    const iconDir = path.join(getIconsDir(), id);
    fs.mkdirSync(iconDir, { recursive: true });

    // Generate multiple sizes with sharp
    const sharp = (await import('sharp')).default;
    const buffer = req.file.buffer;

    for (const size of SIZES) {
      const filename = `${size}.png`;
      const filePath = path.join(iconDir, filename);

      await sharp(buffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 90 })
        .toFile(filePath);

      const stats = fs.statSync(filePath);
      addIconFile(id, size, 'png', path.join(id, filename), stats.size);
    }

    res.status(201).json({
      id: icon.id,
      name: icon.name,
      sizes: SIZES,
      message: `Icon "${name}" uploaded with ${SIZES.length} sizes.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
