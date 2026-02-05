/**
 * UI Utilities for Assistant Core
 * Generic UI functions shared across genesis-tools assistants
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
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();

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
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container element
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
  document.body.appendChild(container);
  return container;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (e2) {
      console.error('Failed to copy:', e2);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
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
 * Show a modal with prompt content
 * @param {string} promptText - The prompt text to display
 * @param {string} title - Modal title
 * @param {Function} [onCopySuccess] - Optional callback to run after successful copy
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
        <button id="copy-modal-prompt" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          📋 Copy Prompt
        </button>
        <button id="close-prompt-modal-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
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

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} True if confirmed, false otherwise
 */
export async function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${escapeHtml(title)}</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">${escapeHtml(message)}</p>
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
