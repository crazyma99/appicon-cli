import { Router } from 'express';
import { searchIcons, getIconFiles, listAllIcons } from '../db.js';

const router = Router();

// GET /api/icons/search?q=keyword&limit=20
router.get('/search', (req, res) => {
  const query = (req.query.q as string) || '';
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  if (!query) {
    const { icons, total } = listAllIcons(limit);
    const results = icons.map((icon) => {
      const files = getIconFiles(icon.id);
      const sizes = files.map((f) => f.size);
      const largestFile = files[files.length - 1];
      return {
        id: icon.id,
        name: icon.name,
        packageName: icon.package_name,
        bundleId: icon.bundle_id,
        developer: icon.developer,
        category: icon.category,
        iconUrl: largestFile ? `/api/icons/${icon.id}/download?size=${largestFile.size}` : '',
        sizes,
      };
    });
    res.json({ results, total });
    return;
  }

  const icons = searchIcons(query, limit);
  const results = icons.map((icon) => {
    const files = getIconFiles(icon.id);
    const sizes = files.map((f) => f.size);
    const largestFile = files[files.length - 1];
    return {
      id: icon.id,
      name: icon.name,
      packageName: icon.package_name,
      bundleId: icon.bundle_id,
      developer: icon.developer,
      category: icon.category,
      iconUrl: largestFile ? `/api/icons/${icon.id}/download?size=${largestFile.size}` : '',
      sizes,
    };
  });

  res.json({ results, total: results.length });
});

export default router;
