import type { Command } from 'commander';
import type { StoreFilter } from '../types.js';
import { resolveProviders } from '../providers/registry.js';
import { loadConfig } from '../utils/config.js';
import { formatSearchResults } from '../utils/format.js';
import { Cache } from '../utils/cache.js';
import { createSpinner } from 'nanospinner';
import { t } from '../utils/i18n.js';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <keyword>')
    .description(t('search.description'))
    .option('-s, --store <store>', t('search.store'), 'all')
    .option('-c, --country <code>', t('search.country'), 'us')
    .option('-l, --limit <number>', t('search.limit'), '10')
    .option('--json', t('search.json'))
    .action(async (keyword: string, opts: { store: string; country: string; limit: string; json?: boolean }) => {
      const config = loadConfig();
      const cache = new Cache(config.cache.dir, config.cache.ttl);
      const storeFilter = opts.store as StoreFilter;
      const limit = parseInt(opts.limit, 10);
      const providers = resolveProviders(storeFilter, config.sources);

      const cacheKey = `search:${keyword}:${storeFilter}:${opts.country}:${limit}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        if (opts.json) {
          console.log(JSON.stringify(cached));
        } else {
          console.log(formatSearchResults(cached.results));
          console.log(`\n  Found ${cached.total} results (cached).\n`);
        }
        return;
      }

      const spinner = opts.json ? null : createSpinner(`Searching for "${keyword}"...`).start();

      try {
        const allResults = await Promise.allSettled(
          providers.map((p) => p.search(keyword, opts.country, limit))
        );

        const results = allResults
          .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
          .flatMap((r) => r.value);

        const output = { results, total: results.length };
        cache.set(cacheKey, output);

        spinner?.success({ text: `Found ${results.length} results.` });

        if (opts.json) {
          console.log(JSON.stringify(output, null, 2));
        } else {
          console.log(formatSearchResults(results));
          console.log(`\n  Found ${results.length} results across ${providers.length} stores.\n`);
        }
      } catch (error: any) {
        spinner?.error({ text: error.message });
        process.exitCode = 1;
      }
    });
}
