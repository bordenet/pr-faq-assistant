/**
 * UI Utilities for Validator Core
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600'
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg pointer-events-auto transform transition-all duration-300 translate-x-full opacity-0`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Copy text to clipboard with async text generation - Safari transient activation safe
 *
 * CRITICAL: This function MUST be called synchronously within a user gesture handler.
 * Safari's transient activation window (~2-3 seconds) is preserved because we call
 * navigator.clipboard.write() immediately, passing a Promise-wrapped Blob that
 * resolves later when the async work completes.
 *
 * @param {Promise<string>} textPromise - Promise that resolves to text to copy
 * @returns {Promise<boolean>} Success status (true if copied, false if failed)
 */
export async function copyToClipboardAsync(textPromise) {
  // Safari transient activation fix: Call clipboard.write() SYNCHRONOUSLY with Promise-wrapped Blob
  // The transient activation is evaluated when write() is called, not when Promise resolves
  if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
    try {
      // Create a Promise that resolves to a Blob - this preserves transient activation
      const blobPromise = textPromise.then(text => new Blob([text], { type: 'text/plain' }));
      const item = new ClipboardItem({ 'text/plain': blobPromise });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.warn('ClipboardItem with Promise failed, trying execCommand:', err?.message);
    }
  }

  // Fallback: Wait for text and use execCommand
  // This may fail on Safari if transient activation expired, but it's our last resort
  const text = await textPromise;

  // Legacy execCommand fallback
  // CRITICAL: Position IN viewport - iOS Safari rejects off-screen elements
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('contenteditable', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0.01';
  textarea.style.fontSize = '16px'; // Prevent iOS zoom

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    if (!successful) {
      console.error('execCommand copy returned false');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err?.message || 'unknown error');
    return false;
  } finally {
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Copy text to clipboard - wrapper for copyToClipboardAsync
 * @param {string} text - Text to copy (must be available synchronously)
 * @returns {Promise<boolean>} Success status (true if copied, false if failed)
 */
export async function copyToClipboard(text) {
  return copyToClipboardAsync(Promise.resolve(text));
}

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, ms) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format a score for display with color coding
 * @param {number} score - Current score
 * @param {number} max - Maximum score
 * @returns {string} CSS class for color
 */
export function getScoreColor(score, max) {
  const ratio = score / max;
  if (ratio >= 0.8) return 'text-green-600 dark:text-green-400';
  if (ratio >= 0.6) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Show a modal with prompt content (View Prompt feature)
 * @param {string} promptText - The prompt text to display
 * @param {string} title - Modal title
 * @param {Function} [onCopySuccess] - Optional callback to run after successful copy
 */
export function showPromptModal(promptText, title = 'Prompt', onCopySuccess = null) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">${escapeHtml(title)}</h3>
        <button id="close-prompt-modal" class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto flex-1">
        <pre class="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">${escapeHtml(promptText)}</pre>
      </div>
      <div class="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
        <button id="copy-modal-prompt" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          📋 Copy Prompt
        </button>
        <button id="close-prompt-modal-btn" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium">
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
    const success = await copyToClipboard(promptText);
    if (success) {
      showToast('Prompt copied to clipboard!', 'success');
      if (onCopySuccess) {
        onCopySuccess();
      }
    } else {
      showToast('Failed to copy to clipboard', 'error');
    }
  });

  // Close on background click
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
