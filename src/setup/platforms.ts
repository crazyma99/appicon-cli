export type Platform =
  | 'claude' | 'cursor' | 'windsurf' | 'antigravity'
  | 'copilot' | 'kiro' | 'codex' | 'qoder';

export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  root: string;
  skillPath: string;
  filename: string;
  detectDir: string;
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  claude: {
    platform: 'claude',
    displayName: 'Claude Code',
    root: '.claude',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.claude',
  },
  cursor: {
    platform: 'cursor',
    displayName: 'Cursor',
    root: '.cursor',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.cursor',
  },
  windsurf: {
    platform: 'windsurf',
    displayName: 'Windsurf',
    root: '.windsurf',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.windsurf',
  },
  antigravity: {
    platform: 'antigravity',
    displayName: 'Antigravity',
    root: '.agents',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.agents',
  },
  copilot: {
    platform: 'copilot',
    displayName: 'GitHub Copilot',
    root: '.github',
    skillPath: 'prompts/appicon',
    filename: 'PROMPT.md',
    detectDir: '.github',
  },
  kiro: {
    platform: 'kiro',
    displayName: 'Kiro',
    root: '.kiro',
    skillPath: 'steering/appicon',
    filename: 'SKILL.md',
    detectDir: '.kiro',
  },
  codex: {
    platform: 'codex',
    displayName: 'Codex',
    root: '.codex',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.codex',
  },
  qoder: {
    platform: 'qoder',
    displayName: 'Qoder',
    root: '.qoder',
    skillPath: 'skills/appicon',
    filename: 'SKILL.md',
    detectDir: '.qoder',
  },
};

export const ALL_PLATFORMS = Object.keys(PLATFORMS) as Platform[];
