/**
 * UI Modals Module
 * Modal dialog functionality (prompt, confirm, confirmWithRemember)
 * @module ui-modals
 */

import { escapeHtml } from './ui-formatters.js';
import { copyToClipboard } from './ui-clipboard.js';
import { showToast } from './ui-toast.js';

/**
 * Show prompt modal - displays full prompt text in a scrollable modal
 * @param {string} promptText - The prompt text to display
 * @param {string} title - Modal title
 * @param {Function} [onCopySuccess] - Optional callback to run after successful copy
 */
export function showPromptModal(promptText, title = 'Full Prompt', onCopySuccess = null) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${escapeHtml(title)}</h3>
                <button id="close-prompt-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div class="overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">${escapeHtml(promptText)}</pre>
            </div>
            <div class="mt-4 flex justify-end gap-2">
                <button id="copy-prompt-modal-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    📋 Copy to Clipboard
                </button>
                <button id="close-prompt-modal-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const closeModal = () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
    document.removeEventListener('keydown', handleEscape);
  };

  modal.querySelector('#close-prompt-modal').addEventListener('click', closeModal);
  modal.querySelector('#close-prompt-modal-btn').addEventListener('click', closeModal);

  modal.querySelector('#copy-prompt-modal-btn').addEventListener('click', async () => {
    try {
      await copyToClipboard(promptText);
      showToast('Prompt copied to clipboard!', 'success');
      if (onCopySuccess) {
        onCopySuccess();
      }
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', handleEscape);
}

/**
 * Show confirmation dialog
 * @param {string} message - Message to display (supports newlines)
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export async function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${escapeHtml(title)}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line">${escapeHtml(message)}</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Confirm
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.querySelector('#cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(false);
    });

    modal.querySelector('#confirm-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(true);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(false);
      }
    });
  });
}

/**
 * Show confirmation dialog with "Don't remind me again" checkbox
 * @param {string} message - Message to display (supports newlines)
 * @param {string} title - Dialog title
 * @param {Object} options - Configuration options
 * @param {string} [options.confirmText='Continue'] - Text for confirm button
 * @param {string} [options.cancelText='Cancel'] - Text for cancel button
 * @param {string} [options.checkboxLabel='Don\'t remind me again'] - Checkbox label
 * @returns {Promise<{confirmed: boolean, remember: boolean}>} Result object
 */
export async function confirmWithRemember(message, title = 'Confirm', options = {}) {
  const {
    confirmText = 'Continue',
    cancelText = 'Cancel',
    checkboxLabel = 'Don\'t remind me again'
  } = options;

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${escapeHtml(title)}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">${escapeHtml(message)}</p>
                <label class="flex items-center gap-2 mb-6 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" id="remember-checkbox" class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
                    <span>${escapeHtml(checkboxLabel)}</span>
                </label>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button id="confirm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        getResult(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    const getResult = (confirmed) => {
      document.removeEventListener('keydown', handleEscape);
      const checkbox = modal.querySelector('#remember-checkbox');
      const remember = checkbox?.checked || false;
      document.body.removeChild(modal);
      resolve({ confirmed, remember });
    };

    modal.querySelector('#cancel-btn').addEventListener('click', () => getResult(false));
    modal.querySelector('#confirm-btn').addEventListener('click', () => getResult(true));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        getResult(false);
      }
    });
  });
}

