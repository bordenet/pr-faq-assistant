/**
 * UI Toast and Loading Module
 * Toast notifications and loading overlay functionality
 * @module ui-toast
 */

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
 * Get toast color class based on type
 * @param {string} type - Toast type (success, error, warning, info)
 * @returns {string} Tailwind color class
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
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (info, success, error, warning)
 * @param {number} duration - Duration in ms (default: 3000)
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
 * Show loading overlay
 * @param {string} message - Loading message (default: 'Loading...')
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

