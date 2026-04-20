import { Command } from 'commander';
import { registerSearchCommand } from './commands/search.js';
import { registerDownloadCommand } from './commands/download.js';
import { registerInfoCommand } from './commands/info.js';
import { registerBatchCommand } from './commands/batch.js';
import { registerConfigCommand } from './commands/config.js';

const program = new Command();

program
  .name('appicon')
  .description('Search and download APP icons from Apple App Store, Google Play, and custom servers')
  .version('0.1.0');

registerSearchCommand(program);
registerDownloadCommand(program);
registerInfoCommand(program);
registerBatchCommand(program);
registerConfigCommand(program);

program.parse();
