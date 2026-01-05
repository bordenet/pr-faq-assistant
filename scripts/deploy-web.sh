#!/usr/bin/env bash
################################################################################
# deploy-web.sh - Deploy PR-FAQ Assistant to GitHub Pages
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

################################################################################
# Configuration
################################################################################

PROJECT_NAME="PR-FAQ Assistant"
GITHUB_USER="bordenet"
GITHUB_REPO="pr-faq-assistant"
GITHUB_PAGES_URL="https://bordenet.github.io/pr-faq-assistant/"

SKIP_TESTS=false
SKIP_LINT=false
export VERBOSE=false

################################################################################
# Functions
################################################################################

show_help() {
    cat << 'EOF'
NAME
    deploy-web.sh - Deploy PR-FAQ Assistant to GitHub Pages

SYNOPSIS
    ./scripts/deploy-web.sh [OPTIONS]

OPTIONS
    --skip-tests    Skip running tests (NOT RECOMMENDED)
    --skip-lint     Skip linting (NOT RECOMMENDED)
    -v, --verbose   Show detailed output
    -h, --help      Display this help message

EOF
}

run_lint() {
    log_step "Running linter"
    
    if [[ "$SKIP_LINT" == "true" ]]; then
        log_warning "Skipping lint (--skip-lint flag)"
        return 0
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        npm run lint || { log_error "Linting failed"; return 1; }
    else
        npm run lint >/dev/null 2>&1 || { log_error "Linting failed. Run 'npm run lint' to see errors."; return 1; }
    fi
    
    log_step_done "Linting passed"
}

run_tests() {
    log_step "Running tests"
    
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests (--skip-tests flag)"
        return 0
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        npm test || { log_error "Tests failed"; return 1; }
    else
        npm test >/dev/null 2>&1 || { log_error "Tests failed. Run 'npm test' to see errors."; return 1; }
    fi
    
    log_step_done "Tests passed"
}

deploy_to_github() {
    log_step "Deploying to GitHub"
    
    if git diff --quiet && git diff --cached --quiet; then
        log_info "No changes to commit"
    else
        if [[ "$VERBOSE" == "true" ]]; then
            git add .
        else
            git add . >/dev/null 2>&1
        fi
        
        local commit_msg="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        if [[ "$VERBOSE" == "true" ]]; then
            git commit -m "$commit_msg" || true
        else
            git commit -m "$commit_msg" >/dev/null 2>&1 || true
        fi
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        git push origin main || { log_error "Failed to push to GitHub"; return 1; }
    else
        git push origin main >/dev/null 2>&1 || { log_error "Failed to push to GitHub"; return 1; }
    fi
    
    log_step_done "Pushed to GitHub"
}

verify_deployment() {
    log_step "Verifying deployment"
    log_info "Waiting for GitHub Pages to update..."
    sleep 5
    
    if curl -s -o /dev/null -w "%{http_code}" "$GITHUB_PAGES_URL" | grep -q "200"; then
        log_step_done "Deployment verified"
    else
        log_warning "Site may still be deploying. Check manually in a few minutes."
    fi
}

################################################################################
# Main
################################################################################

main() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests) SKIP_TESTS=true; shift ;;
            --skip-lint) SKIP_LINT=true; shift ;;
            -v|--verbose) VERBOSE=true; shift ;;
            -h|--help) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; exit 1 ;;
        esac
    done
    
    log_header "Deploying $PROJECT_NAME"
    start_timer
    
    run_lint || exit 1
    run_tests || exit 1
    deploy_to_github || exit 1
    verify_deployment
    
    stop_timer
    echo ""
    log_success "Deployment complete!"
    echo ""
    echo "  📦 Project: $PROJECT_NAME"
    echo "  🔗 URL: $GITHUB_PAGES_URL"
    echo "  ⏱️  $(show_elapsed_time)"
    echo ""
}

main "$@"

