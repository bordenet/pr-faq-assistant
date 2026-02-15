/**
 * UI Action Menu Module
 * Accessible dropdown/overflow menu functionality
 * @module ui-action-menu
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
