/**
 * UI Utilities Module
 * @module ui
 * Handles common UI operations like toasts, modals, loading states
 * @module ui
 */

export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;
  toast.innerHTML = `
        <span class="text-xl">${icons[type]}</span>
        <span>${message}</span>
    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showLoading(text = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  loadingText.textContent = text;
  overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('hidden');
}

export function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-xl">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${title}</h3>
                <p class="text-gray-700 dark:text-gray-300 mb-6">${message}</p>
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

    modal.querySelector('#confirm-btn').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });

    modal.querySelector('#cancel-btn').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
  });
}

export function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy text to clipboard
 * @module ui
 *
 * Uses a fallback chain for maximum compatibility:
 * @module ui
 * 1. Modern Clipboard API (navigator.clipboard.writeText)
 * 2. Legacy execCommand('copy') for older browsers and iPad/mobile
 *
 * @param {string} text - Text to copy
 * @returns {Promise<void>} Resolves if successful, throws if failed
 * @throws {Error} If copy fails
 */
export async function copyToClipboard(text) {
  // Modern Clipboard API with Safari-compatible ClipboardItem pattern
  // Using ClipboardItem ensures the API call is synchronous (satisfying
  // Safari's transient activation requirement) while data resolution is async
  if (navigator.clipboard && window.isSecureContext) {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/plain': Promise.resolve(blob)
      });
      await navigator.clipboard.write([item]);
      return;
    } catch (err) {
      // Fall through to legacy method on any failure
      // Safari may throw NotAllowedError, TypeError, or fail silently
      console.warn('Clipboard API failed, trying fallback:', err?.message);
    }
  }

  // Fallback for iOS Safari <13.4, permission denied, or API failure
  // CRITICAL: Position IN viewport - iOS Safari rejects off-screen elements
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Prevent iOS keyboard from appearing
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('contenteditable', 'true');
  // Position IN viewport but invisible (iOS requirement)
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '0';
  textarea.style.height = '0';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0';
  textarea.style.zIndex = '-1';
  textarea.style.pointerEvents = 'none';
  // Prevent zoom on iOS (font-size < 16px triggers zoom)
  textarea.style.fontSize = '16px';

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    // iOS requires setSelectionRange instead of select()
    textarea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy returned false');
    }
  } catch (err) {
    throw new Error('Failed to copy to clipboard: ' + (err?.message || 'unknown error'));
  } finally {
    // Always clean up, even on error
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Show a modal with prompt content (View Prompt feature)
 * @module ui
 * @param {string} promptText - The prompt text to display
 * @param {string} title - Modal title
 * @param {Function} [onCopySuccess] - Optional callback to run after successful copy (enables workflow progression)
 */
export function showPromptModal(promptText, title = 'Prompt', onCopySuccess = null) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">${escapeHtml(title)}</h3>
                <button id="close-prompt-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="p-4 overflow-y-auto flex-1">
                <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">${escapeHtml(promptText)}</pre>
            </div>
            <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button id="copy-modal-prompt" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    📋 Copy Prompt
                </button>
                <button id="close-prompt-modal-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector('#close-prompt-modal').addEventListener('click', closeModal);
  modal.querySelector('#close-prompt-modal-btn').addEventListener('click', closeModal);
  modal.querySelector('#copy-modal-prompt').addEventListener('click', async () => {
    try {
      await copyToClipboard(promptText);
      showToast('Prompt copied to clipboard!', 'success');
      // Run callback to enable workflow progression (Open AI button, textarea, etc.)
      if (onCopySuccess) {
        onCopySuccess();
      }
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Show formatted document preview modal
 * @module ui
 * Displays markdown rendered as HTML with copy and download options
 * @param {string} markdown - Markdown content to display
 * @param {string} title - Modal title (default: 'Your Document is Ready')
 * @param {string} filename - Filename for download (default: 'document.md')
 * @param {Function} [onDownload] - Optional callback after download
 */
export function showDocumentPreviewModal(markdown, title = 'Your Document is Ready', filename = 'document.md', onDownload = null) {
  // Render markdown to HTML using marked.js
  // @ts-ignore - marked is loaded via CDN
  let renderedHtml;
  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    renderedHtml = marked.parse(markdown);
  } else if (typeof marked !== 'undefined' && typeof marked === 'function') {
    renderedHtml = marked(markdown);
  } else {
    // Fallback: escape HTML and convert newlines
    renderedHtml = escapeHtml(markdown).replace(/\n/g, '<br>');
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">${escapeHtml(title)}</h3>
                <button id="close-preview-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="flex-1 overflow-auto p-6">
                <div id="preview-content" class="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                    prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300">
                    ${renderedHtml}
                </div>
            </div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    💡 <strong>Tip:</strong> Click "Copy Formatted Text", then paste into Word or Google Docs — the formatting transfers automatically.
                </p>
                <div class="flex flex-wrap justify-end gap-3">
                    <button id="copy-formatted-btn" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        📋 Copy Formatted Text
                    </button>
                    <button id="download-md-btn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        📄 Download .md File
                    </button>
                    <button id="close-modal-btn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector('#close-preview-modal').addEventListener('click', closeModal);
  modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);

  // Copy formatted text (selects the rendered HTML content)
  modal.querySelector('#copy-formatted-btn').addEventListener('click', async () => {
    try {
      const previewContent = modal.querySelector('#preview-content');

      // Create a range and select the content
      const range = document.createRange();
      range.selectNodeContents(previewContent);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Try to copy using execCommand for rich text
      const successful = document.execCommand('copy');
      selection.removeAllRanges();

      if (successful) {
        showToast('Formatted text copied! Paste into Word or Google Docs.', 'success');
      } else {
        // Fallback to plain text
        await copyToClipboard(markdown);
        showToast('Text copied! Paste into Word or Google Docs.', 'success');
      }
    } catch {
      // Ultimate fallback
      try {
        await copyToClipboard(markdown);
        showToast('Text copied to clipboard.', 'success');
      } catch {
        showToast('Failed to copy. Please select and copy manually.', 'error');
      }
    }
  });

  // Download as .md file
  modal.querySelector('#download-md-btn').addEventListener('click', () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File downloaded!', 'success');
    if (onDownload) {
      onDownload();
    }
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
