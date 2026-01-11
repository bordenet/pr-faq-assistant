#!/usr/bin/env bash
# pr-faq-assistant - Install Git Hooks
#
# PURPOSE: Install pre-commit hooks for quality gates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installing Git Hooks for pr-faq-assistant"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .git directory exists
if [[ ! -d "$REPO_ROOT/.git" ]]; then
    echo "❌ Not a git repository"
    echo "Run: git init"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create pre-commit hook
echo "Creating pre-commit hook..."

cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pre-Commit Quality Gate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Node.js
if ! command -v node &>/dev/null; then
    echo "⚠️  Node.js not found - skipping quality checks"
    exit 0
fi

# Check if node_modules exists
if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
    echo "⚠️  node_modules not found - skipping quality checks"
    echo "Run: npm install"
    exit 0
fi

# Run linter
echo "Running linter..."
if ! npm run lint --silent; then
    echo ""
    echo "❌ Linting failed!"
    echo "Fix errors or run: npm run lint:fix"
    echo ""
    echo "To bypass this check (not recommended): git commit --no-verify"
    exit 1
fi
echo "✅ Linting passed"

echo ""
echo "✅ Pre-commit checks passed!"
echo ""

exit 0
EOF

chmod +x "$HOOKS_DIR/pre-commit"
echo "✅ Pre-commit hook installed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The following checks will run on every commit:"
echo "  • ESLint (code quality)"
echo ""
echo "To bypass hooks in emergencies: git commit --no-verify"
echo "⚠️  Only use --no-verify when absolutely necessary!"
echo ""
