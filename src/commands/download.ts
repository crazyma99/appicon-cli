import type { Command } from 'commander';
import type { Store, ImageFormat, DownloadResult } from '../types.js';
import { detectStore, resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { downloadMultipleSizes } from '../utils/image.js';
import { createSpinner } from 'nanospinner';
import path from 'node:path';

export function registerDownloadCommand(program: Command): void {
  program
    .command('download <identifier>')
    .description('Download APP icon by package name or bundle ID')
    .option('-s, --store <store>', 'Store: apple, google, custom')
    .option('--size <size>', 'Icon size in px', '512')
    .option('--sizes <sizes>', 'Multiple sizes, comma-separated (e.g. "64,128,256,512")')
    .option('-f, --format <format>', 'Output format: png, jpg, webp', 'png')
    .option('-o, --output <dir>', 'Output directory', '.')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, opts: {
      store?: string;
      size: string;
      sizes?: string;
      format: string;
      output: string;
      country: string;
      json?: boolean;
    }) => {
      const config = loadConfig();
      const format = opts.format as ImageFormat;
      const sizes = opts.sizes
        ? opts.sizes.split(',').map((s) => parseInt(s.trim(), 10))
        : [parseInt(opts.size, 10)];
      const outputDir = path.resolve(opts.output);

      const spinner = opts.json ? null : createSpinner('Looking up app...').start();

      try {
        const storesToTry: Store[] = opts.store
          ? [opts.store as Store]
          : detectStore(identifier);

        let app = null;
        let provider = null;

        for (const store of storesToTry) {
          const providers = resolveProviders(store, config.sources);
          for (const p of providers) {
            const result = await p.lookup(identifier, opts.country);
            if (result) {
              app = result;
              provider = p;
              break;
            }
          }
          if (app) break;
        }

        if (!app || !provider) {
          spinner?.error({ text: `App "${identifier}" not found in any store.` });
          if (opts.json) {
            console.log(JSON.stringify({ error: 'App not found' }));
          }
          process.exitCode = 1;
          return;
        }

        spinner?.update({ text: `Downloading ${app.name} icon...` });

        const iconUrl = provider.getIconUrl(app.iconUrl, Math.max(...sizes));
        const files = await downloadMultipleSizes(iconUrl, outputDir, app.name, sizes, format);

        const result: DownloadResult = {
          app: app.name,
          identifier: app.identifier,
          store: app.store,
          files,
        };

        spinner?.success({ text: `Downloaded ${app.name} icon (${files.length} file${files.length > 1 ? 's' : ''}).` });

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          for (const f of files) {
            console.log(`  ${f.size}x${f.size} → ${f.path}`);
          }
          console.log('');
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        if (opts.json) {
          console.log(JSON.stringify({ error: error.message }));
        }
        process.exitCode = 1;
      }
    });
}
