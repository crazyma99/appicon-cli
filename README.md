# appicon-cli

[![npm version](https://img.shields.io/npm/v/appicon-cli.svg)](https://www.npmjs.com/package/appicon-cli)
[![license](https://img.shields.io/github/license/crazyma99/appicon-cli.svg)](https://github.com/crazyma99/appicon-cli/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/appicon-cli.svg)](https://nodejs.org)
[![GitHub stars](https://img.shields.io/github/stars/crazyma99/appicon-cli.svg?style=social)](https://github.com/crazyma99/appicon-cli)

> 🔍 Search and download APP icons from Apple App Store, Google Play, and custom servers. Built for [Claude Code](https://claude.com/claude-code) + Figma MCP workflows.

[English](#english) | [中文](#中文)

---

## English

### Install

```bash
npm install -g appicon-cli
```

Requires Node.js >= 18.

### Commands

#### Search

```bash
appicon search "WeChat"
appicon search "微信" --store apple --country cn --limit 5
appicon search "Spotify" --store google --json
```

| Option | Default | Description |
|--------|---------|-------------|
| `-s, --store` | `all` | `apple`, `google`, `custom`, `all` |
| `-c, --country` | `us` | Country/region code |
| `-l, --limit` | `10` | Max results per store |
| `--json` | | JSON output for programmatic use |

#### Download

```bash
appicon download com.tencent.xin --size 512
appicon download com.spotify.client --sizes 64,128,256,512 --output ./icons
appicon download com.tencent.mm --format webp --json
```

| Option | Default | Description |
|--------|---------|-------------|
| `-s, --store` | auto | `apple`, `google`, `custom` |
| `--size` | `512` | Icon size in px |
| `--sizes` | | Multiple sizes, comma-separated |
| `-f, --format` | `png` | `png`, `jpg`, `webp` |
| `-o, --output` | `.` | Output directory |
| `--json` | | JSON output with file paths |

#### Info

```bash
appicon info com.tencent.xin --store apple
appicon info 553834731 --json
```

#### Batch Download

```bash
appicon batch apps.json --output ./icons --sizes 256,512
```

#### Config

```bash
appicon config add-source --name my-icons --url https://icons.example.com/api --key YOUR_KEY
appicon config list-sources
appicon config remove-source --name my-icons
appicon config set-priority "custom,apple,google"
appicon config show
```

### Custom Server

Deploy your own icon library with [appicon-server](https://github.com/crazyma99/appicon-server) — includes REST API + Web UI management console.

### Claude Code + Figma Integration

```bash
# Claude Code calls appicon to search and download icons
appicon search "微信" --json
appicon download com.tencent.xin --size 512 --output /tmp/icons --json

# Then uses Figma MCP to fill icons into the design
```

All commands support `--json` for structured output that Claude Code can parse directly.

### AI IDE Setup

Use the `setup` command to register appicon-cli as a skill/tool in your AI-powered IDE. Supports 8 platforms:

| Platform | Command |
|----------|---------|
| Claude Code | `appicon setup claude` |
| Cursor | `appicon setup cursor` |
| Windsurf | `appicon setup windsurf` |
| Antigravity | `appicon setup antigravity` |
| GitHub Copilot | `appicon setup copilot` |
| Kiro | `appicon setup kiro` |
| Codex | `appicon setup codex` |
| Qoder | `appicon setup qoder` |

```bash
appicon setup claude     # Configure for Claude Code
appicon setup --all      # Configure all platforms
appicon setup            # Interactive selection
appicon setup --remove   # Remove skill
```

### i18n

Help text auto-detects language from system `LANG` environment variable:
- Chinese systems (`LANG=zh_CN.*`) → Chinese help
- Other systems → English help

### Data Sources

| Source | Method | Max Icon Size |
|--------|--------|--------------|
| Apple App Store | iTunes Search/Lookup API | 1024x1024 |
| Google Play Store | google-play-scraper | 512x512 |
| Custom Server | REST API (user-deployed) | Depends on server |

---

## 中文

### 安装

```bash
npm install -g appicon-cli
```

需要 Node.js >= 18。

### 命令

#### 搜索

```bash
appicon search "微信"
appicon search "WeChat" --store apple --country cn --limit 5
appicon search "Spotify" --json
```

#### 下载

```bash
appicon download com.tencent.xin --size 512
appicon download com.spotify.client --sizes 64,128,256,512 --output ./icons
appicon download com.tencent.mm --format webp --json
```

#### 查看详情

```bash
appicon info com.tencent.xin --store apple
```

#### 批量下载

```bash
appicon batch apps.json --output ./icons
```

#### 配置管理

```bash
# 添加自定义数据源
appicon config add-source --name my-icons --url https://icons.example.com/api --key YOUR_KEY

# 查看配置
appicon config show
```

### 自建图标服务器

使用 [appicon-server](https://github.com/crazyma99/appicon-server) 部署你自己的图标库，包含 REST API + Web 管理后台。

### Claude Code + Figma 工作流

```bash
# Claude Code 调用 appicon 搜索下载图标
appicon search "微信" --json
appicon download com.tencent.xin --size 512 --output /tmp/icons --json

# 然后通过 Figma MCP 将图标填充到设计稿
```

所有命令支持 `--json` 输出结构化数据，Claude Code 可直接解析。

### AI IDE 配置

使用 `setup` 命令将 appicon-cli 注册为 AI IDE 的技能/工具。支持 8 个平台：

| 平台 | 命令 |
|------|------|
| Claude Code | `appicon setup claude` |
| Cursor | `appicon setup cursor` |
| Windsurf | `appicon setup windsurf` |
| Antigravity | `appicon setup antigravity` |
| GitHub Copilot | `appicon setup copilot` |
| Kiro | `appicon setup kiro` |
| Codex | `appicon setup codex` |
| Qoder | `appicon setup qoder` |

```bash
appicon setup claude     # 配置 Claude Code
appicon setup --all      # 配置所有平台
appicon setup            # 交互式选择
appicon setup --remove   # 移除技能
```

### 帮助文本国际化

根据系统 `LANG` 环境变量自动检测语言：
- 中文系统 (`LANG=zh_CN.*`) → 中文帮助
- 其他系统 → 英文帮助

---

## Related

- [appicon-server](https://github.com/crazyma99/appicon-server) — Self-hosted icon API server with Web UI
- [appicon-cli-docs](https://crazyma99.github.io/appicon-cli-docs/) — Documentation site

## License

MIT
