# Hermes Cerul Tech News Verification Package

This package bundles a Hermes Agent source snapshot, a Cerul MCP configuration template, and a Hermes skill for checking whether technology-news claims in videos are true, false, misleading, or unsupported.

## Contents

- `hermes-agent/`: Hermes Agent source snapshot, with local-only runtime artifacts removed.
- `config/cerul-mcp.yaml.example`: Cerul MCP configuration template.
- `skills/media/cerul-tech-news-verifier/SKILL.md`: workflow instructions for timestamped video fact checking.
- `scripts/install.sh`: installs the Cerul MCP config and skill into `~/.hermes`.
- `scripts/verify.sh`: verifies MCP connection and skill registration.

## Security

Do not commit your real Cerul API key. This repository intentionally uses `${CERUL_API_KEY}` in templates and reads the real key from an environment variable or local `.env` file.

## Install On A Machine With Hermes

```bash
cd hermes-cerul-tech-news-package
cp .env.example .env
# Edit .env and set CERUL_API_KEY=cerul_xxx
scripts/install.sh
scripts/verify.sh
```

Or pass the key directly without creating `.env`:

```bash
CERUL_API_KEY=cerul_xxx scripts/install.sh
scripts/verify.sh
```

Restart Hermes after installation, or run `/reload-mcp` in an active Hermes session.

## Expected Hermes Tool Names

After restart, Hermes should expose:

- `mcp_cerul_cerul_search`
- `mcp_cerul_cerul_usage`

For user questions like "这个视频里的某条科技新闻是不是假消息？", Hermes should call Cerul search and return:

- verdict: `正确`, `错误`, `误导`, or `证据不足`
- source video title and URL
- timestamp range
- evidence from transcript or on-screen information
- timestamp frame image from Cerul `keyframe_url`

## GitHub Upload

This folder is ready to become a GitHub repository:

```bash
cd hermes-cerul-tech-news-package
git init
git add .
git commit -m "Add Hermes Cerul MCP package"
```

Check that no secret is committed before pushing:

```bash
grep -R "cerul_[A-Za-z0-9]" .
```
