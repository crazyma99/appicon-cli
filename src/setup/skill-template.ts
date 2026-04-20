import type { PlatformConfig } from './platforms.js';

export function generateSkillContent(config: PlatformConfig): string {
  const isPrompt = config.filename === 'PROMPT.md';
  const label = isPrompt ? 'Workflow' : 'Skill';

  const frontmatter = `---
name: appicon
description: "Search and download APP icons from Apple App Store, Google Play, and custom servers. Use when the user needs app icons, logo assets, or wants to fill icons into Figma designs. Triggers: app icon, download icon, search icon, 图标, 应用图标, appicon."
---`;

  return `${frontmatter}

# appicon — APP Icon ${label}

Search and download APP icons from Apple App Store, Google Play, and custom API servers via the \`appicon\` CLI.

## When to Use

Activate this ${label.toLowerCase()} when the user:
- Asks for app icons, app logos, or store icon assets
- Wants to search for an app by name (e.g., "find the WeChat icon")
- Needs to download app icons in specific sizes or formats
- Is building a design that requires real app icons (competitive analysis, app showcase, etc.)
- Mentions Figma design with app icons
- Says keywords: icon, app icon, 图标, 应用图标, logo, appicon

## Available Commands

### Search
\`\`\`bash
appicon search "<keyword>" [--store apple|google|custom|all] [--country us] [--limit 10] [--json]
\`\`\`
Search for apps across Apple App Store, Google Play, and custom servers.

### Download
\`\`\`bash
appicon download <identifier> [--store apple|google|custom] [--size 512] [--sizes 64,128,256,512] [--format png|jpg|webp] [--output ./icons] [--json]
\`\`\`
Download app icon by bundle ID, package name, or track ID. Auto-detects the store.

### Info
\`\`\`bash
appicon info <identifier> [--store apple|google|custom] [--json]
\`\`\`
View app details and icon URLs at all available sizes.

### Batch Download
\`\`\`bash
appicon batch <file.json|file.csv> [--format png] [--output ./icons] [--json]
\`\`\`
Batch download icons from a JSON or CSV file.

## JSON Output

All commands support \`--json\` for structured output. Always use \`--json\` when you need to parse results programmatically.

**Search result:**
\`\`\`json
{
  "results": [
    { "name": "WeChat", "identifier": "com.tencent.xin", "store": "apple", "iconUrl": "..." }
  ],
  "total": 1
}
\`\`\`

**Download result:**
\`\`\`json
{
  "app": "WeChat",
  "identifier": "com.tencent.xin",
  "store": "apple",
  "files": [
    { "size": 512, "format": "png", "path": "/tmp/icons/WeChat_512x512.png" }
  ]
}
\`\`\`

## Common Workflows

### Search and download an icon
\`\`\`bash
appicon search "Spotify" --store apple --json
appicon download com.spotify.client --size 512 --output ./icons --json
\`\`\`

### Download multiple sizes for design work
\`\`\`bash
appicon download com.tencent.xin --sizes 64,128,256,512 --output ./icons
\`\`\`

### Figma integration (with Figma MCP)
1. Search: \`appicon search "WeChat" --json\`
2. Download: \`appicon download com.tencent.xin --size 512 --output /tmp/icons --json\`
3. Use Figma MCP to place the downloaded icon into the design

### Chinese app search
\`\`\`bash
appicon search "微信" --store apple --country cn --json
\`\`\`

## Data Sources

| Source | Identifier Format | Max Size |
|--------|-------------------|----------|
| Apple App Store | Bundle ID or numeric Track ID | 1024x1024 |
| Google Play | Package name (com.xxx.xxx) | 512x512 |
| Custom Server | Custom ID | Depends on server |

## Tips

- Use \`--json\` flag whenever parsing output programmatically
- Apple icons support up to 1024px, Google Play up to 512px
- The CLI auto-detects which store to query based on identifier format
- Configure custom icon servers with \`appicon config add-source\`
`;
}
