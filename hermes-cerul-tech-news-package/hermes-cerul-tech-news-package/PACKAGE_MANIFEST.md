# Package Manifest

## Root Files

- `README.md`: install, verification, and GitHub upload instructions.
- `.env.example`: local-only Cerul key template. Copy to `.env`; do not commit real keys.
- `.gitignore`: excludes local secrets, dependency folders, caches, and build output.

## Hermes Agent

- `hermes-agent/`: Hermes Agent source snapshot copied from the local installation.
- Removed from the snapshot: `.git`, `node_modules`, `venv`, `__pycache__`, `.env*`, and bytecode files.
- Added to the source snapshot:
  - `hermes-agent/skills/media/cerul-tech-news-verifier/SKILL.md`
  - updated `hermes-agent/skills/media/DESCRIPTION.md`

## Cerul MCP

- `config/cerul-mcp.yaml.example`: MCP server snippet for Cerul hosted MCP:
  - server name: `cerul`
  - endpoint template: `https://api.cerul.ai/mcp?apiKey=${CERUL_API_KEY}`
  - exposed tools: `cerul_search`, `cerul_usage`

## Skills

- `skills/media/cerul-tech-news-verifier/SKILL.md`: standalone installable Hermes skill.

## Scripts

- `scripts/install.sh`: installs the Cerul MCP config and skill into `~/.hermes`.
- `scripts/verify.sh`: verifies `hermes mcp test cerul` and skill registration.
