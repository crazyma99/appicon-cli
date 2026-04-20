import type { Command } from 'commander';
import { loadConfig, saveConfig, addSource, removeSource, getConfigPath } from '../utils/config.js';
import { formatSuccess, formatError } from '../utils/format.js';
import pc from 'picocolors';

export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage configuration and custom data sources');

  configCmd
    .command('add-source')
    .description('Add a custom icon API source')
    .requiredOption('--name <name>', 'Source name')
    .requiredOption('--url <url>', 'API base URL')
    .requiredOption('--key <key>', 'API key')
    .option('--priority <n>', 'Priority (lower = higher)', '1')
    .action((opts: { name: string; url: string; key: string; priority: string }) => {
      try {
        let config = loadConfig();
        config = addSource(config, {
          name: opts.name,
          url: opts.url.replace(/\/$/, ''),
          apiKey: opts.key,
          priority: parseInt(opts.priority, 10),
          enabled: true,
        });
        saveConfig(config);
        console.log(formatSuccess(`Added source "${opts.name}".`));
      } catch (error: any) {
        console.error(formatError(error.message));
        process.exitCode = 1;
      }
    });

  configCmd
    .command('remove-source')
    .description('Remove a custom icon API source')
    .requiredOption('--name <name>', 'Source name')
    .action((opts: { name: string }) => {
      try {
        let config = loadConfig();
        config = removeSource(config, opts.name);
        saveConfig(config);
        console.log(formatSuccess(`Removed source "${opts.name}".`));
      } catch (error: any) {
        console.error(formatError(error.message));
        process.exitCode = 1;
      }
    });

  configCmd
    .command('list-sources')
    .description('List all configured sources')
    .action(() => {
      const config = loadConfig();
      if (config.sources.length === 0) {
        console.log('  No custom sources configured.');
        return;
      }
      console.log('');
      for (const s of config.sources) {
        const status = s.enabled ? pc.green('enabled') : pc.red('disabled');
        console.log(`  ${pc.bold(s.name)} [${status}]`);
        console.log(`    URL:      ${s.url}`);
        console.log(`    Priority: ${s.priority}`);
        console.log('');
      }
    });

  configCmd
    .command('set-priority')
    .description('Set store search priority (comma-separated)')
    .argument('<order>', 'Priority order, e.g. "custom,apple,google"')
    .action((order: string) => {
      const config = loadConfig();
      config.searchPriority = order.split(',').map((s) => s.trim());
      saveConfig(config);
      console.log(formatSuccess(`Search priority set to: ${config.searchPriority.join(' → ')}`));
    });

  configCmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const config = loadConfig();
      console.log(`\n  Config file: ${pc.dim(getConfigPath())}\n`);
      console.log(JSON.stringify(config, null, 2));
      console.log('');
    });
}
