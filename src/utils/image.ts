import fs from 'node:fs';
import path from 'node:path';
import type { ImageFormat } from '../types.js';

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function buildOutputPath(outputDir: string, appName: string, size: number, format: ImageFormat): string {
  const safeName = sanitizeFilename(appName);
  return path.join(outputDir, `${safeName}_${size}x${size}.${format}`);
}

export async function downloadIcon(
  url: string,
  outputPath: string,
  size: number,
  format: ImageFormat
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download icon: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  try {
    const sharp = (await import('sharp')).default;
    await sharp(buffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFormat(format, { quality: 90 })
      .toFile(outputPath);
  } catch {
    // Fallback: save raw file if sharp is not available
    fs.writeFileSync(outputPath, buffer);
  }

  return outputPath;
}

export async function downloadMultipleSizes(
  url: string,
  outputDir: string,
  appName: string,
  sizes: number[],
  format: ImageFormat
): Promise<Array<{ size: number; format: ImageFormat; path: string }>> {
  const results: Array<{ size: number; format: ImageFormat; path: string }> = [];

  for (const size of sizes) {
    const outputPath = buildOutputPath(outputDir, appName, size, format);
    await downloadIcon(url, outputPath, size, format);
    results.push({ size, format, path: outputPath });
  }

  return results;
}
