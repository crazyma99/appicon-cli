import type { Command } from 'commander';
import type { Store, ImageFormat, DownloadResult } from '../types.js';
import { resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { downloadMultipleSizes } from '../utils/image.js';
import { createSpinner } from 'nanospinner';
import { t } from '../utils/i18n.js';
import fs from 'node:fs';
import path from 'node:path';

interface BatchEntry {
  identifier: string;
  store?: Store;
  sizes?: number[];
}

export function registerBatchCommand(program: Command): void {
  program
    .command('batch <file>')
    .description(t('batch.description'))
    .option('-f, --format <format>', t('batch.format'), 'png')
    .option('-o, --output <dir>', t('batch.output'), '.')
    .option('-c, --country <code>', t('batch.country'), 'us')
    .option('--json', t('batch.json'))
    .action(async (file: string, opts: { format: string; output: string; country: string; json?: boolean }) => {
      const config = loadConfig();
      const format = opts.format as ImageFormat;
      const outputDir = path.resolve(opts.output);
      const defaultSizes = config.defaults.sizes;

      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exitCode = 1;
        return;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries = filePath.endsWith('.csv') ? parseCsv(raw) : parseJson(raw);

      const spinner = opts.json ? null : createSpinner(`Processing ${entries.length} apps...`).start();
      const results: DownloadResult[] = [];
      const errors: Array<{ identifier: string; error: string }> = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const sizes = entry.sizes || defaultSizes;
        spinner?.update({ text: `[${i + 1}/${entries.length}] ${entry.identifier}` });

        try {
          const store = entry.store || 'all';
          const providers = resolveProviders(store as any, config.sources);

          let app = null;
          let provider = null;

          for (const p of providers) {
            const result = await p.lookup(entry.identifier, opts.country);
            if (result) {
              app = result;
              provider = p;
              break;
            }
          }

          if (!app || !provider) {
            errors.push({ identifier: entry.identifier, error: 'Not found' });
            continue;
          }

          const iconUrl = provider.getIconUrl(app.iconUrl, Math.max(...sizes));
          const files = await downloadMultipleSizes(iconUrl, outputDir, app.name, sizes, format);
          results.push({ app: app.name, identifier: app.identifier, store: app.store, files });
        } catch (error: any) {
          errors.push({ identifier: entry.identifier, error: error.message });
        }
      }

      spinner?.success({ text: `Done: ${results.length} succeeded, ${errors.length} failed.` });

      if (opts.json) {
        console.log(JSON.stringify({ results, errors }, null, 2));
      } else {
        for (const r of results) {
          console.log(`  ${r.app}: ${r.files.length} file(s) downloaded`);
        }
        for (const e of errors) {
          console.log(`  ${e.identifier}: ${e.error}`);
        }
        console.log('');
      }
    });
}

function parseJson(raw: string): BatchEntry[] {
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function parseCsv(raw: string): BatchEntry[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const [identifier, store, sizesStr] = line.split(',').map((s) => s.trim());
    const sizes = sizesStr ? sizesStr.split(';').map(Number) : undefined;
    return { identifier, store: store as Store | undefined, sizes };
  });
}
