#!/usr/bin/env bash
################################################################################
# deploy-web.sh - Deploy PR-FAQ Assistant to GitHub Pages
#
# SYNOPSIS
#     ./scripts/deploy-web.sh [OPTIONS]
#
# DESCRIPTION
#     Deploys the web application to GitHub Pages with quality checks.
#
#     Steps performed:
#     1. Build CSS and JS bundle
#     2. Run linting (npm run lint)
#     3. Run tests (npm test)
#     4. Verify coverage threshold
#     5. Commit and push to GitHub
#     6. Display deployment URL
#
# OPTIONS
#     --skip-tests    Skip running tests (NOT RECOMMENDED)
#     --skip-lint     Skip linting (NOT RECOMMENDED)
#     -v, --verbose   Show detailed output
#     -h, --help      Display this help message
#
# EXIT CODES
#     0   Deployment successful
#     1   Deployment failed (linting, tests, or push failed)
#
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Source common library if it exists
if [[ -f "${SCRIPT_DIR}/lib/common.sh" ]]; then
  # shellcheck source=lib/common.sh
  source "${SCRIPT_DIR}/lib/common.sh"
  HAS_COMMON=1
else
  HAS_COMMON=0
fi

# shellcheck source=lib/symlinks.sh
source "${SCRIPT_DIR}/lib/symlinks.sh"

# Colors (fallback if common.sh not available)
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_NAME="PR-FAQ Assistant"
GITHUB_USER="bordenet"
GITHUB_REPO="pr-faq-assistant"
GITHUB_PAGES_URL="https://bordenet.github.io/pr-faq-assistant/"

# Flags
SKIP_TESTS=false
SKIP_LINT=false
VERBOSE=false

print_header() {
  echo -e "${BLUE}==>${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

show_help() {
  sed -n '2,/^$/p' "$0" | sed 's/^# \?//'
}

cd "$PROJECT_DIR"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PR-FAQ Assistant - Web Deployment                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check git status
print_header "Checking git status"
if ! git diff-index --quiet HEAD --; then
  print_error "Working directory has uncommitted changes"
  echo "Commit or stash changes before deploying"
  exit 1
fi
print_success "Working directory clean"

# Note: one-pager doesn't require a build step (no Tailwind/esbuild)
print_header "Checking project files"
print_success "Project files ready (no build required)"

# Linting
if [[ "$SKIP_LINT" == "false" ]]; then
  print_header "Running linting"
  if [[ "$VERBOSE" == "true" ]]; then
    npm run lint || { print_error "Linting failed"; exit 1; }
  else
    npm run lint >/dev/null 2>&1 || { print_error "Linting failed. Run 'npm run lint' to see errors."; exit 1; }
  fi
  print_success "Linting passed"
else
  print_warning "Skipping linting (--skip-lint flag)"
fi

# Tests (unless skipped)
if [[ "$SKIP_TESTS" == "false" ]]; then
  print_header "Running unit tests"
  if [[ "$VERBOSE" == "true" ]]; then
    npm test || { print_error "Unit tests failed"; exit 1; }
  else
    npm test >/dev/null 2>&1 || { print_error "Unit tests failed. Run 'npm test' to see errors."; exit 1; }
  fi
  print_success "Unit tests passed"

  print_header "Checking coverage"
  if [[ "$VERBOSE" == "true" ]]; then
    npm run test:coverage || print_warning "Coverage threshold not met"
  else
    npm run test:coverage >/dev/null 2>&1 || print_warning "Coverage threshold not met"
  fi
else
  print_warning "Skipping tests (--skip-tests flag)"
fi

# Replace symlinks with real files for GitHub Pages
replace_symlinks_with_real_files || exit 1

# Set up trap to restore symlinks on failure
trap 'restore_symlinks' EXIT

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo ""
echo "Deployment info:"
echo "  Branch: $CURRENT_BRANCH"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "  Date: $(date)"
echo ""

# Create deployment commit (no interactive prompt - scripts should be non-interactive)
print_header "Creating deployment commit"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
if [[ "$VERBOSE" == "true" ]]; then
  git add -A
  git commit -m "Deploy: $TIMESTAMP" || print_success "No changes to commit"
else
  git add -A >/dev/null 2>&1
  git commit -m "Deploy: $TIMESTAMP" >/dev/null 2>&1 || print_success "No changes to commit"
fi

# Push to origin
print_header "Pushing to GitHub"
if [[ "$VERBOSE" == "true" ]]; then
  git push origin "$CURRENT_BRANCH" || { print_error "Failed to push to GitHub"; exit 1; }
else
  git push origin "$CURRENT_BRANCH" >/dev/null 2>&1 || { print_error "Failed to push to GitHub"; exit 1; }
fi
print_success "Push successful"

# Restore symlinks for local development
restore_symlinks
trap - EXIT

# Summary
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  📦 Project: $PROJECT_NAME"
echo "  🔗 URL: $GITHUB_PAGES_URL"
echo ""
echo "Note: GitHub Pages may take 1-2 minutes to fully update."
echo "Check deployment status: https://github.com/$GITHUB_USER/$GITHUB_REPO/deployments"
echo ""
