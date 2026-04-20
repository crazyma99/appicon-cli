import Table from 'cli-table3';
import pc from 'picocolors';
import type { AppInfo } from '../types.js';

export interface IconVariant {
  size: number;
  url: string;
}

export function formatSearchResults(results: AppInfo[]): string {
  if (results.length === 0) {
    return pc.yellow('  No results found.');
  }

  const table = new Table({
    head: ['#', 'Name', 'Identifier', 'Developer', 'Store', 'Rating'].map((h) => pc.cyan(h)),
    style: { head: [], border: [] },
  });

  results.forEach((app, i) => {
    table.push([
      pc.gray(String(i + 1)),
      app.name,
      pc.dim(app.identifier),
      app.developer,
      storeLabel(app.store),
      app.rating ? String(app.rating.toFixed(1)) : '-',
    ]);
  });

  return table.toString();
}

export function formatAppInfo(app: AppInfo, iconUrls: IconVariant[]): string {
  const lines: string[] = [
    '',
    `  ${pc.bold('App Name:')}     ${app.name}`,
    `  ${pc.bold('Identifier:')}   ${app.identifier}`,
    `  ${pc.bold('Developer:')}    ${app.developer}`,
    `  ${pc.bold('Store:')}        ${storeLabel(app.store)}`,
    `  ${pc.bold('Rating:')}       ${app.rating ? `${app.rating.toFixed(1)}/5` : '-'}`,
  ];

  if (app.genre) lines.push(`  ${pc.bold('Genre:')}        ${app.genre}`);
  if (app.price) lines.push(`  ${pc.bold('Price:')}        ${app.price}`);

  if (iconUrls.length > 0) {
    lines.push('');
    lines.push(`  ${pc.bold('Icon URLs:')}`);
    for (const icon of iconUrls) {
      lines.push(`    ${pc.cyan(`${icon.size}x${icon.size}:`)}  ${pc.dim(icon.url)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function formatError(message: string): string {
  return `  ${pc.red('Error:')} ${message}`;
}

export function formatSuccess(message: string): string {
  return `  ${pc.green('Success:')} ${message}`;
}

function storeLabel(store: string): string {
  switch (store) {
    case 'apple': return pc.white('Apple');
    case 'google': return pc.green('Google');
    case 'custom': return pc.magenta('Custom');
    default: return store;
  }
}
