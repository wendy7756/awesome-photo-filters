#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-wendy7756/awesome-photo-filters}"
REF="${2:-main}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
INSTALLER="$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py"

if [[ ! -f "$INSTALLER" ]]; then
  echo "Codex skill installer not found at:" >&2
  echo "  $INSTALLER" >&2
  echo "Install Codex first, or set CODEX_HOME." >&2
  exit 1
fi

python3 "$INSTALLER" \
  --repo "$REPO" \
  --ref "$REF" \
  --path skills/awesome-photo-filters skills/local-photo-filters skills/photo-abstract-editorial skills/finger-frame

echo "Installed awesome-photo-filters skills into $CODEX_HOME/skills/"
echo "Available on your next Codex turn."
