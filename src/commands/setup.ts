import type { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import pc from 'picocolors';
import { PLATFORMS, ALL_PLATFORMS, type Platform } from '../setup/platforms.js';
import { detectPlatforms } from '../setup/detect.js';
import { generateSkillContent } from '../setup/skill-template.js';
import { t } from '../utils/i18n.js';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup [platform]')
    .description(t('setup.description'))
    .option('--all', t('setup.all'))
    .option('--global', t('setup.global'))
    .option('--remove', t('setup.remove'))
    .action(async (platform: string | undefined, opts: { all?: boolean; global?: boolean; remove?: boolean }) => {
      const baseDir = opts.global ? os.homedir() : process.cwd();

      // Determine target platforms
      let targets: Platform[];

      if (opts.all) {
        targets = [...ALL_PLATFORMS];
      } else if (platform) {
        if (!(platform in PLATFORMS)) {
          console.error(pc.red(`  Unknown platform: ${platform}`));
          console.log(`  ${pc.dim('Available:')} ${ALL_PLATFORMS.join(', ')}`);
          process.exitCode = 1;
          return;
        }
        targets = [platform as Platform];
      } else {
        // Interactive: show list and let user pick
        const detected = detectPlatforms(baseDir);
        targets = await interactiveSelect(detected);
        if (targets.length === 0) {
          console.log(pc.yellow('  No platform selected.'));
          return;
        }
      }

      if (opts.remove) {
        removeSkills(baseDir, targets);
      } else {
        installSkills(baseDir, targets, !!opts.global);
      }
    });
}

function installSkills(baseDir: string, targets: Platform[], isGlobal: boolean): void {
  const modeLabel = isGlobal ? pc.dim(' (global)') : '';
  console.log('');

  for (const platformKey of targets) {
    const config = PLATFORMS[platformKey];
    const skillDir = path.join(baseDir, config.root, config.skillPath);
    const filePath = path.join(skillDir, config.filename);

    fs.mkdirSync(skillDir, { recursive: true });
    const content = generateSkillContent(config);
    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(`  ${pc.green('+')} ${pc.bold(config.displayName)}${modeLabel}`);
    console.log(`    ${pc.dim(path.relative(baseDir, filePath))}`);
  }

  console.log('');
  console.log(pc.green('  Skill installed successfully!'));
  console.log('');
  console.log(pc.bold('  Next steps:'));
  console.log(pc.dim('  1. Restart your AI coding assistant'));
  console.log(pc.dim('  2. Try: "Search for the WeChat app icon and download it"'));
  console.log('');
}

function removeSkills(baseDir: string, targets: Platform[]): void {
  console.log('');

  for (const platformKey of targets) {
    const config = PLATFORMS[platformKey];
    const skillDir = path.join(baseDir, config.root, config.skillPath);

    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
      console.log(`  ${pc.red('-')} ${pc.bold(config.displayName)}`);
      console.log(`    ${pc.dim(path.relative(baseDir, skillDir))}`);
    } else {
      console.log(`  ${pc.dim('~')} ${config.displayName} ${pc.dim('(not installed)')}`);
    }
  }

  console.log('');
  console.log(pc.green('  Skill removed.'));
  console.log('');
}

async function interactiveSelect(detected: Platform[]): Promise<Platform[]> {
  // Show a numbered list for selection (no extra deps needed)
  console.log('');
  console.log(pc.bold('  Select AI assistant to configure:'));
  console.log('');

  const choices = ALL_PLATFORMS.map((key, i) => {
    const config = PLATFORMS[key];
    const isDetected = detected.includes(key);
    const marker = isDetected ? pc.green(' (detected)') : '';
    return { key, label: `  ${pc.dim(`${i + 1}.`)} ${config.displayName}${marker}` };
  });

  // Add "all" option
  choices.push({ key: 'all' as Platform, label: `  ${pc.dim(`${choices.length + 1}.`)} ${pc.bold('All platforms')}` });

  choices.forEach((c) => console.log(c.label));
  console.log('');

  // Read from stdin
  const answer = await readLine(`  ${pc.cyan('Enter number(s)')} ${pc.dim('(comma-separated, e.g. 1,3)')}: `);
  const nums = answer.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));

  const selected: Platform[] = [];
  for (const num of nums) {
    if (num === choices.length) {
      // "All" selected
      return [...ALL_PLATFORMS];
    }
    const idx = num - 1;
    if (idx >= 0 && idx < ALL_PLATFORMS.length) {
      selected.push(ALL_PLATFORMS[idx]);
    }
  }

  return selected;
}

function readLine(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.once('data', (chunk) => {
      data = chunk.toString().trim();
      resolve(data);
    });
    process.stdin.resume();
  });
}
