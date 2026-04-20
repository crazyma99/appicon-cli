import type { Command } from 'commander';
import type { Store } from '../types.js';
import { detectStore, resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { formatAppInfo } from '../utils/format.js';
import type { IconVariant } from '../utils/format.js';
import { createSpinner } from 'nanospinner';

const STANDARD_SIZES = [64, 128, 256, 512, 1024];

export function registerInfoCommand(program: Command): void {
  program
    .command('info <identifier>')
    .description('View APP details and icon URLs')
    .option('-s, --store <store>', 'Store: apple, google, custom')
    .option('-c, --country <code>', 'Country/region code', 'us')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, opts: { store?: string; country: string; json?: boolean }) => {
      const config = loadConfig();
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
          spinner?.error({ text: `App "${identifier}" not found.` });
          if (opts.json) {
            console.log(JSON.stringify({ error: 'App not found' }));
          }
          process.exitCode = 1;
          return;
        }

        const maxSize = app.store === 'apple' ? 1024 : 512;
        const iconUrls: IconVariant[] = STANDARD_SIZES
          .filter((s) => s <= maxSize)
          .map((size) => ({
            size,
            url: provider!.getIconUrl(app!.iconUrl, size),
          }));

        spinner?.success({ text: app.name });

        if (opts.json) {
          console.log(JSON.stringify({ ...app, iconUrls }, null, 2));
        } else {
          console.log(formatAppInfo(app, iconUrls));
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        process.exitCode = 1;
      }
    });
}
