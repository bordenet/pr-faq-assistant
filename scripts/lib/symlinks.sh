#!/usr/bin/env bash

################################################################################
# Symlink Handling Library for GitHub Pages Deployment
################################################################################
# PURPOSE: Replace symlinks with real files for deployment, restore after
# USAGE: source "$(dirname "${BASH_SOURCE[0]}")/lib/symlinks.sh"
#
# REQUIRES: Either PROJECT_ROOT or REPO_ROOT must be set before sourcing
#
# GitHub Pages cannot follow symlinks. This library:
# 1. Replaces symlinks with real files before deploying
# 2. Restores symlinks after deploying (for local dev)
################################################################################

# Use PROJECT_ROOT if set, otherwise fall back to REPO_ROOT
_SYMLINK_ROOT="${PROJECT_ROOT:-${REPO_ROOT:-}}"

# Symlink paths (relative to root)
ASSISTANT_CORE_SYMLINK="assistant/js/core"
VALIDATOR_CORE_SYMLINK="validator/js/core"
ASSISTANT_CORE_SRC="../../../assistant-core/src"
VALIDATOR_CORE_SRC="../../../validator-core/src"

# Detect which logging functions are available
_symlink_log_start() {
    if type task_start &>/dev/null; then
        task_start "$1"
    elif type log_info &>/dev/null; then
        log_info "$1"
    else
        echo "▸ $1"
    fi
}

_symlink_log_ok() {
    if type task_ok &>/dev/null; then
        task_ok "$1"
    elif type log_success &>/dev/null; then
        log_success "$1"
    else
        echo "✓ $1"
    fi
}

################################################################################
# Replace symlinks with real files
################################################################################
replace_symlinks_with_real_files() {
    _symlink_log_start "Replacing symlinks with real files"

    local had_changes=false

    # Handle assistant/js/core
    if [[ -L "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}" ]]; then
        local target
        target=$(readlink "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}")
        rm "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}"
        cp -r "${_SYMLINK_ROOT}/assistant/js/${target}" "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}"
        had_changes=true
        [[ "${VERBOSE:-false}" == "true" ]] && echo "  Replaced assistant/js/core symlink"
    fi

    # Handle validator/js/core
    if [[ -L "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}" ]]; then
        local target
        target=$(readlink "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}")
        rm "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}"
        cp -r "${_SYMLINK_ROOT}/validator/js/${target}" "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}"
        had_changes=true
        [[ "${VERBOSE:-false}" == "true" ]] && echo "  Replaced validator/js/core symlink"
    fi

    if [[ "$had_changes" == "true" ]]; then
        _symlink_log_ok "Symlinks replaced with real files"
    else
        _symlink_log_ok "No symlinks to replace"
    fi
}

################################################################################
# Restore symlinks for local development
################################################################################
restore_symlinks() {
    _symlink_log_start "Restoring symlinks for local dev"

    # Restore assistant/js/core
    if [[ -d "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}" && ! -L "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}" ]]; then
        rm -rf "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}"
        ln -s "${ASSISTANT_CORE_SRC}" "${_SYMLINK_ROOT}/${ASSISTANT_CORE_SYMLINK}"
        [[ "${VERBOSE:-false}" == "true" ]] && echo "  Restored assistant/js/core symlink"
    fi

    # Restore validator/js/core
    if [[ -d "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}" && ! -L "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}" ]]; then
        rm -rf "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}"
        ln -s "${VALIDATOR_CORE_SRC}" "${_SYMLINK_ROOT}/${VALIDATOR_CORE_SYMLINK}"
        [[ "${VERBOSE:-false}" == "true" ]] && echo "  Restored validator/js/core symlink"
    fi

    _symlink_log_ok "Symlinks restored"
}
