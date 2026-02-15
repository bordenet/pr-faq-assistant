/**
 * UI Theme Module
 * Theme initialization and toggle functionality
 * @module ui-theme
 */

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

