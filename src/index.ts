import { Command } from 'commander';
import { registerSearchCommand } from './commands/search.js';
import { registerDownloadCommand } from './commands/download.js';
import { registerInfoCommand } from './commands/info.js';
import { registerBatchCommand } from './commands/batch.js';
import { registerConfigCommand } from './commands/config.js';
import { registerSetupCommand } from './commands/setup.js';
import { t } from './utils/i18n.js';

const program = new Command();

program
  .name('appicon')
  .description(t('program.description'))
  .version('0.1.0');

registerSearchCommand(program);
registerDownloadCommand(program);
registerInfoCommand(program);
registerBatchCommand(program);
registerConfigCommand(program);
registerSetupCommand(program);

program.parse();
