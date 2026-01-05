#!/usr/bin/env bash
################################################################################
# Common Shell Script Library
################################################################################

# Prevent multiple sourcing
[[ -n "${COMMON_LIB_LOADED:-}" ]] && return 0
readonly COMMON_LIB_LOADED=1

# Repository root detection
if [[ -z "${REPO_ROOT:-}" ]]; then
    COMMON_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REPO_ROOT="$(cd "${COMMON_LIB_DIR}/../.." && pwd)"
fi
readonly REPO_ROOT

################################################################################
# ANSI Color Codes
################################################################################

if [[ -t 1 ]]; then
    readonly COLOR_RED='\033[0;31m'
    readonly COLOR_GREEN='\033[0;32m'
    readonly COLOR_YELLOW='\033[1;33m'
    readonly COLOR_BLUE='\033[0;34m'
    readonly COLOR_BOLD='\033[1m'
    readonly COLOR_RESET='\033[0m'
else
    readonly COLOR_RED=''
    readonly COLOR_GREEN=''
    readonly COLOR_YELLOW=''
    readonly COLOR_BLUE=''
    readonly COLOR_BOLD=''
    readonly COLOR_RESET=''
fi

################################################################################
# Timer Functions
################################################################################

SCRIPT_START_TIME=$(date +%s)

start_timer() {
    SCRIPT_START_TIME=$(date +%s)
}

stop_timer() {
    :
}

format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    printf "%02d:%02d:%02d" "$hours" "$minutes" "$secs"
}

show_elapsed_time() {
    local elapsed=$(($(date +%s) - SCRIPT_START_TIME))
    echo "Total time: $(format_duration $elapsed)"
}

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${COLOR_BLUE}ℹ️  $*${COLOR_RESET}"
}

log_step() {
    echo -e "${COLOR_BOLD}▶️  $*${COLOR_RESET}"
}

log_step_done() {
    echo -e "${COLOR_GREEN}✅ $*${COLOR_RESET}"
}

log_success() {
    echo -e "${COLOR_GREEN}🎉 $*${COLOR_RESET}"
}

log_warning() {
    echo -e "${COLOR_YELLOW}⚠️  $*${COLOR_RESET}"
}

log_error() {
    echo -e "${COLOR_RED}❌ $*${COLOR_RESET}" >&2
}

log_header() {
    echo ""
    echo -e "${COLOR_BOLD}═══════════════════════════════════════════════════════════════${COLOR_RESET}"
    echo -e "${COLOR_BOLD}  $*${COLOR_RESET}"
    echo -e "${COLOR_BOLD}═══════════════════════════════════════════════════════════════${COLOR_RESET}"
    echo ""
}

die() {
    log_error "$*"
    exit 1
}

################################################################################
# Utility Functions
################################################################################

is_macos() {
    [[ "$(uname -s)" == "Darwin" ]]
}

is_arm64() {
    [[ "$(uname -m)" == "arm64" ]]
}

run_quiet() {
    if [[ "${VERBOSE:-false}" == "true" ]]; then
        "$@"
    else
        "$@" >/dev/null 2>&1
    fi
}

ask_yes_no() {
    local prompt="$1"
    local default="${2:-y}"
    local response
    
    read -r -p "$prompt [y/n] ($default): " response
    response="${response:-$default}"
    [[ "$response" =~ ^[Yy] ]]
}

