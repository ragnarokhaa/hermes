#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
CONFIG_FILE="$HERMES_HOME/config.yaml"
SKILLS_DIR="$HERMES_HOME/skills"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

CERUL_API_KEY="${CERUL_API_KEY:-${1:-}}"
if [ -z "$CERUL_API_KEY" ]; then
  echo "Missing CERUL_API_KEY."
  echo "Usage: CERUL_API_KEY=cerul_xxx scripts/install.sh"
  echo "   or: scripts/install.sh cerul_xxx"
  exit 1
fi

mkdir -p "$HERMES_HOME" "$SKILLS_DIR/media"

if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" <<'YAML'
model:
  default: gpt-5.4
  provider: openai-codex
toolsets:
  - hermes-cli
YAML
fi

cp -R "$ROOT_DIR/skills/media/cerul-tech-news-verifier" "$SKILLS_DIR/media/"

python3 - "$CONFIG_FILE" "$CERUL_API_KEY" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
api_key = sys.argv[2]
text = path.read_text() if path.exists() else ""
lines = text.splitlines()

cerul_block = [
    "  cerul:",
    f'    url: "https://api.cerul.ai/mcp?apiKey={api_key}"',
    "    enabled: true",
    "    timeout: 120",
    "    connect_timeout: 30",
    "    request_interval: 2.2",
    "    tools:",
    "      include:",
    "      - cerul_search",
    "      - cerul_usage",
    "      resources: false",
    "      prompts: false",
]

if "mcp_servers:" not in text:
    new_text = text.rstrip() + "\n" + "mcp_servers:\n" + "\n".join(cerul_block) + "\n"
    path.write_text(new_text)
    sys.exit(0)

out = []
i = 0
inserted = False
while i < len(lines):
    line = lines[i]
    if line.startswith("mcp_servers:"):
        out.append(line)
        i += 1
        while i < len(lines):
            current = lines[i]
            if current and not current.startswith(" ") and not current.startswith("-"):
                if not inserted:
                    out.extend(cerul_block)
                    inserted = True
                break
            if current.startswith("  cerul:"):
                out.extend(cerul_block)
                inserted = True
                i += 1
                while i < len(lines) and (lines[i].startswith("    ") or lines[i].strip() == ""):
                    i += 1
                continue
            out.append(current)
            i += 1
        continue
    out.append(line)
    i += 1

if not inserted:
    out.extend(cerul_block)

path.write_text("\n".join(out).rstrip() + "\n")
PY

echo "Installed Cerul MCP config into $CONFIG_FILE"
echo "Installed skill into $SKILLS_DIR/media/cerul-tech-news-verifier"
echo "Restart Hermes or run /reload-mcp in an active Hermes session."
