/**
 * UI Utilities Module
 * Common UI functions and helpers - Re-export facade for backward compatibility
 * @module ui
 */

// Re-export all UI utilities from modular files
export { formatDate, formatBytes, escapeHtml } from './ui-formatters.js';
export { initializeTheme, toggleTheme, setupThemeToggle } from './ui-theme.js';
export { showToast, showLoading, hideLoading } from './ui-toast.js';
export { copyToClipboard, copyToClipboardAsync } from './ui-clipboard.js';
export { createActionMenu } from './ui-action-menu.js';
export { showPromptModal, confirm, confirmWithRemember } from './ui-modals.js';
export { showDocumentPreviewModal } from './ui-document-preview.js';
