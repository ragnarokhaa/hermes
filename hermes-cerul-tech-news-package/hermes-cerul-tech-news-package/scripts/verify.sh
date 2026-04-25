#!/usr/bin/env bash
set -euo pipefail

if ! command -v hermes >/dev/null 2>&1; then
  echo "hermes command not found. Install Hermes first or add it to PATH."
  exit 1
fi

echo "Checking Cerul MCP..."
hermes mcp test cerul

echo
echo "Checking skill registration..."
hermes skills list | grep -E "cerul-tech-news-verifier|media"
