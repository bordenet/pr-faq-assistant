#!/usr/bin/env bash
################################################################################
# Script Name: setup-macos.sh
################################################################################
# PURPOSE: Set up PR-FAQ Assistant development environment on macOS
# USAGE: ./scripts/setup-macos.sh [OPTIONS]
# PLATFORM: macOS (Apple Silicon and Intel)
################################################################################

set -euo pipefail

# Determine repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Source common library if available
if [[ -f "$SCRIPT_DIR/lib/common.sh" ]]; then
    # shellcheck source=lib/common.sh
    source "$SCRIPT_DIR/lib/common.sh"
else
    # Minimal fallback functions
    log_info() { echo "ℹ️  $*"; }
    log_step() { echo "▶️  $*"; }
    log_step_done() { echo "✅ $*"; }
    log_error() { echo "❌ $*" >&2; }
    die() { log_error "$*"; exit 1; }
fi

################################################################################
# Constants
################################################################################

readonly VERSION="1.0.0"
readonly REQUIRED_NODE_VERSION="18"

################################################################################
# Global Variables
################################################################################

AUTO_CONFIRM=false
export VERBOSE=false

################################################################################
# Functions
################################################################################

show_help() {
    cat << 'EOF'
NAME
    setup-macos.sh - Set up PR-FAQ Assistant development environment

SYNOPSIS
    ./scripts/setup-macos.sh [OPTIONS]

DESCRIPTION
    Sets up development environment including:
    - Node.js (via Homebrew)
    - npm dependencies
    - ESLint and Vitest

OPTIONS
    -y, --yes       Auto-confirm all prompts
    -v, --verbose   Show detailed output
    -h, --help      Display this help message

EXAMPLES
    ./scripts/setup-macos.sh        # Interactive setup
    ./scripts/setup-macos.sh -y     # Non-interactive setup

EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help) show_help; exit 0 ;;
            -y|--yes) AUTO_CONFIRM=true; shift ;;
            -v|--verbose) VERBOSE=true; shift ;;
            *) log_error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

check_homebrew() {
    log_step "Checking Homebrew"
    if ! command -v brew &> /dev/null; then
        die "Homebrew not found. Install from https://brew.sh"
    fi
    log_step_done "Homebrew found"
}

check_node() {
    log_step "Checking Node.js"
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js..."
        brew install node || die "Failed to install Node.js"
    fi
    local node_version
    node_version=$(node --version | sed 's/v//')
    log_info "Node.js version: $node_version"
    log_step_done "Node.js ready"
}

install_dependencies() {
    log_step "Installing npm dependencies"
    npm install || die "Failed to install dependencies"
    log_step_done "Dependencies installed"
}

run_lint() {
    log_step "Running linter"
    npm run lint || die "Linting failed"
    log_step_done "Linting passed"
}

run_tests() {
    log_step "Running tests"
    npm test || die "Tests failed"
    log_step_done "Tests passed"
}

show_summary() {
    echo ""
    echo "✅ Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Start local server: npm run serve"
    echo "  2. Open http://localhost:8080"
    echo "  3. Run tests: npm test"
    echo ""
}

################################################################################
# Main
################################################################################

main() {
    parse_args "$@"
    
    echo "🚀 PR-FAQ Assistant Setup v${VERSION}"
    echo ""
    
    check_homebrew
    check_node
    install_dependencies
    run_lint
    run_tests
    
    show_summary
}

main "$@"

