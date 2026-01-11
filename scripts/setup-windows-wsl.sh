#!/usr/bin/env bash
# pr-faq-assistant - Windows WSL Setup Script

set -euo pipefail

# Determine repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Detect WSL
if ! grep -qi microsoft /proc/version 2>/dev/null; then
    echo "⚠️  Not running on Windows WSL"
    echo "Detected: $(uname -a)"
    read -r -p "Continue anyway? [y/N]: " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
fi

echo "🚀 pr-faq-assistant - WSL Setup"
echo ""

# Run Linux setup (WSL uses same package management)
exec "$SCRIPT_DIR/setup-linux.sh" "$@"
