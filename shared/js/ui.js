/**
 * UI Utilities Module
 * Common UI functions and helpers
 * @module ui
 */

// Track active action menu for cleanup
let activeActionMenu = null;

/**
 * Create an action menu (overflow menu) with ARIA accessibility
 * @param {Object} options - Menu configuration
 * @param {HTMLElement} options.triggerElement - The button that triggers the menu
 * @param {Array} options.items - Menu items [{label, icon, onClick, separator, destructive, disabled}]
 * @param {string} [options.position='bottom-end'] - Menu position relative to trigger
 * @returns {Object} - Menu controller with open(), close(), toggle() methods
 */
export function createActionMenu({ triggerElement, items, position = 'bottom-end' }) {
  const menuId = `action-menu-${Date.now()}`;
  let isOpen = false;
  let menu = null;
  let focusedIndex = -1;

  // Set ARIA attributes on trigger
  triggerElement.setAttribute('aria-haspopup', 'menu');
  triggerElement.setAttribute('aria-expanded', 'false');
  triggerElement.setAttribute('aria-controls', menuId);

  function createMenuElement() {
    menu = document.createElement('div');
    menu.id = menuId;
    menu.className = 'action-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', triggerElement.id || 'action-menu-trigger');
    menu.tabIndex = -1;

    menu.innerHTML = items.map((item, index) => {
      if (item.separator) {
        return '<div class="action-menu-separator" role="separator"></div>';
      }
      const disabledClass = item.disabled ? 'action-menu-item-disabled' : '';
      const destructiveClass = item.destructive ? 'action-menu-item-destructive' : '';
      return `
        <button
          class="action-menu-item ${disabledClass} ${destructiveClass}"
          role="menuitem"
          data-index="${index}"
          ${item.disabled ? 'disabled aria-disabled="true"' : ''}
          tabindex="-1"
        >
          ${item.icon ? `<span class="action-menu-icon">${item.icon}</span>` : ''}
          <span class="action-menu-label">${item.label}</span>
        </button>
      `;
    }).join('');

    return menu;
  }

  function positionMenu() {
    if (!menu) return;
    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    // Position based on specified position
    let top, left;
    if (position === 'bottom-end') {
      top = triggerRect.bottom + 4;
      left = triggerRect.right - menuRect.width;
    } else if (position === 'bottom-start') {
      top = triggerRect.bottom + 4;
      left = triggerRect.left;
    } else {
      top = triggerRect.bottom + 4;
      left = triggerRect.left;
    }

    // Ensure menu stays in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 8) left = 8;
    if (left + menuRect.width > viewportWidth - 8) {
      left = viewportWidth - menuRect.width - 8;
    }
    if (top + menuRect.height > viewportHeight - 8) {
      top = triggerRect.top - menuRect.height - 4;
    }

    menu.style.position = 'fixed';
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }

  function getMenuItems() {
    return menu ? Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])')) : [];
  }

  function focusItem(index) {
    const menuItems = getMenuItems();
    if (index < 0) index = menuItems.length - 1;
    if (index >= menuItems.length) index = 0;
    focusedIndex = index;
    menuItems[focusedIndex]?.focus();
  }

  function handleKeydown(e) {
    const menuItems = getMenuItems();
    switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close();
      triggerElement.focus();
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusItem(focusedIndex + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusItem(focusedIndex - 1);
      break;
    case 'Home':
      e.preventDefault();
      focusItem(0);
      break;
    case 'End':
      e.preventDefault();
      focusItem(menuItems.length - 1);
      break;
    case 'Tab':
      close();
      break;
    }
  }

  function handleClick(e) {
    const button = e.target.closest('[role="menuitem"]');
    if (button && !button.disabled) {
      const index = parseInt(button.dataset.index);
      const item = items[index];
      if (item && item.onClick) {
        close();
        item.onClick();
      }
    }
  }

  function handleOutsideClick(e) {
    if (menu && !menu.contains(e.target) && !triggerElement.contains(e.target)) {
      close();
    }
  }

  function open() {
    if (isOpen) return;

    // Close any other open menu
    if (activeActionMenu && activeActionMenu !== controller) {
      activeActionMenu.close();
    }

    menu = createMenuElement();
    document.body.appendChild(menu);
    positionMenu();

    isOpen = true;
    activeActionMenu = controller;
    triggerElement.setAttribute('aria-expanded', 'true');
    menu.classList.add('action-menu-open');

    // Focus first item
    setTimeout(() => focusItem(0), 0);

    // Event listeners
    menu.addEventListener('keydown', handleKeydown);
    menu.addEventListener('click', handleClick);
    document.addEventListener('click', handleOutsideClick, true);
    window.addEventListener('resize', positionMenu);
  }

  function close() {
    if (!isOpen || !menu) return;

    menu.classList.remove('action-menu-open');
    menu.classList.add('action-menu-closing');

    setTimeout(() => {
      if (menu && menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }
      menu = null;
    }, 150);

    isOpen = false;
    if (activeActionMenu === controller) {
      activeActionMenu = null;
    }
    triggerElement.setAttribute('aria-expanded', 'false');
    focusedIndex = -1;

    // Remove event listeners
    document.removeEventListener('click', handleOutsideClick, true);
    window.removeEventListener('resize', positionMenu);
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  // Trigger click handler
  triggerElement.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Trigger keyboard handler
  triggerElement.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  const controller = { open, close, toggle, isOpen: () => isOpen };
  return controller;
}

/**
 * Format date for display
 * @param {string | number | Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format bytes as human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show prompt modal - displays full prompt text in a scrollable modal
 */
/**
 * Show prompt modal - displays full prompt text in a scrollable modal
 * @param {string} promptText - The prompt text to display
 * @param {string} title - Modal title
 * @param {Function} [onCopySuccess] - Optional callback to run after successful copy (enables workflow progression)
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

  // Handle escape key
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

  // Copy button handler
  modal.querySelector('#copy-prompt-modal-btn').addEventListener('click', async () => {
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

  // Close on backdrop click
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

    // Close on backdrop click
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
 * Used for warnings that users can acknowledge once and dismiss permanently
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

    // Close on Escape key - define early so we can remove it in getResult
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        getResult(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    const getResult = (confirmed) => {
      // Always remove the Escape handler when closing
      document.removeEventListener('keydown', handleEscape);
      const checkbox = modal.querySelector('#remember-checkbox');
      const remember = checkbox?.checked || false;
      document.body.removeChild(modal);
      resolve({ confirmed, remember });
    };

    modal.querySelector('#cancel-btn').addEventListener('click', () => getResult(false));
    modal.querySelector('#confirm-btn').addEventListener('click', () => getResult(true));

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        getResult(false);
      }
    });
  });
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast-notification transform transition-all duration-300 translate-x-full opacity-0 mb-2 px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${getToastColor(type)}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Copy text to clipboard - wrapper for copyToClipboardAsync
 *
 * IMPORTANT: For async operations (like generating prompts), use copyToClipboardAsync()
 * instead to preserve Safari's transient activation window.
 *
 * @param {string} text - Text to copy (must be available synchronously)
 * @returns {Promise<void>} Resolves if successful, throws if failed
 * @throws {Error} If clipboard access fails
 */
export async function copyToClipboard(text) {
  return copyToClipboardAsync(Promise.resolve(text));
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
 * @returns {Promise<void>} Resolves if successful, throws if failed
 * @throws {Error} If clipboard access fails
 *
 * @example
 * // In click handler - call synchronously with Promise
 * button.addEventListener('click', () => {
 *     const textPromise = generatePromptAsync();
 *     copyToClipboardAsync(textPromise)
 *         .then(() => showToast('Copied!', 'success'))
 *         .catch(() => showToast('Failed to copy', 'error'));
 * });
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
      return;
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
      throw new Error('execCommand copy returned false');
    }
  } catch (err) {
    throw new Error('Failed to copy to clipboard: ' + (err?.message || 'unknown error'));
  } finally {
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
  document.body.appendChild(container);
  return container;
}

/**
 * Get toast color class based on type
 */
function getToastColor(type) {
  switch (type) {
  case 'success':
    return 'bg-green-500';
  case 'error':
    return 'bg-red-500';
  case 'warning':
    return 'bg-yellow-500';
  case 'info':
  default:
    return 'bg-blue-500';
  }
}

/**
 * Show loading overlay
 */
export function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.querySelector('#loading-text').textContent = message;
    overlay.classList.remove('hidden');
  }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
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
                    <button id="download-docx-btn" class="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                        📝 Download .docx
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

  // Download as .docx file (Word document)
  modal.querySelector('#download-docx-btn').addEventListener('click', async () => {
    const btn = modal.querySelector('#download-docx-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Converting...';
    btn.disabled = true;

    try {
      // Dynamic import of markdown-docx from esm.sh CDN
      const { default: markdownDocx, Packer } = await import('https://esm.sh/markdown-docx@1.5.1?bundle');

      // Convert markdown to docx document
      const doc = await markdownDocx(markdown);

      // Generate blob for download
      const blob = await Packer.toBlob(doc);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.md$/i, '.docx');
      a.click();
      URL.revokeObjectURL(url);

      showToast('Word document downloaded!', 'success');
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Failed to generate Word document:', error);
      showToast('Failed to generate Word document. Try "Copy Formatted Text" instead.', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
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

/**
 * Initialize theme from localStorage
 * @returns {void}
 */
export function initializeTheme() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}

/**
 * Toggle between light and dark themes
 * @returns {void}
 */
export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', String(isDark));
}

/**
 * Set up theme toggle button listener
 * @returns {void}
 */
export function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}
