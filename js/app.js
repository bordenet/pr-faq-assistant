/**
 * Main Application Module
 * @module app
 * PR-FAQ Assistant - AI-assisted PR-FAQ document generator
 * @module app
 *
 * This module handles app initialization and global event listeners.
 * @module app
 * Route handling and view rendering are delegated to:
 * @module app
 * - router.js: Hash-based navigation
 * - views.js: Home, new project, edit project forms
 * - project-view.js: Project workflow view with phase tabs
 * - projects.js: Project CRUD operations
 */

import storage from './storage.js';
import { showToast, showLoading, hideLoading } from './ui.js';
import { initRouter, updateStorageInfo } from './router.js';
import { exportAllProjects, importProjects } from './projects.js';
import { initMockMode, setMockMode } from './ai-mock.js';

/**
 * Initialize the application
 * @module app
 */
async function init() {
  try {
    showLoading('Initializing...');
    await storage.init();

    setupEventListeners();
    setupThemeToggle();
    setupRelatedProjects();
    setupPrivacyNotice();
    initMockMode();

    // Initialize router (handles initial route render)
    initRouter();

    // Update storage info in footer
    await updateStorageInfo();

    hideLoading();
    console.log('✓ App initialized');
  } catch (error) {
    console.error('Failed to initialize:', error);
    hideLoading();
    showToast('Failed to initialize application', 'error');
  }
}

/**
 * Setup global event listeners
 * @module app
 */
function setupEventListeners() {
  // Export all button
  document.getElementById('export-all-btn')?.addEventListener('click', exportAllProjects);

  // Import button
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file-input')?.click();
  });

  document.getElementById('import-file-input')?.addEventListener('change', handleImport);

  // Privacy notice close (with localStorage persistence)
  document.getElementById('close-privacy-notice')?.addEventListener('click', () => {
    document.getElementById('privacy-notice')?.classList.add('hidden');
    localStorage.setItem('privacy-notice-dismissed', 'true');
  });

  // AI Mock mode toggle
  document.getElementById('mockModeCheckbox')?.addEventListener('change', (e) => {
    setMockMode(e.target.checked);
    showToast(
      e.target.checked ? 'AI Mock Mode enabled' : 'AI Mock Mode disabled',
      'info'
    );
  });

  // About link
  document.getElementById('about-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutModal();
  });
}

/**
 * Setup theme toggle
 * @module app
 */
function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');

  // Check saved preference or system preference
  if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  toggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });
}

/**
 * Setup related projects dropdown
 * @module app
 */
function setupRelatedProjects() {
  const btn = document.getElementById('related-projects-btn');
  const menu = document.getElementById('related-projects-menu');

  btn?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!btn?.contains(e.target) && !menu?.contains(e.target)) {
      menu?.classList.add('hidden');
    }
  });
}

/**
 * Setup privacy notice (show if not dismissed)
 * @module app
 */
function setupPrivacyNotice() {
  if (!localStorage.getItem('privacy-notice-dismissed')) {
    document.getElementById('privacy-notice')?.classList.remove('hidden');
  }
}

/**
 * Show about modal
 * @module app
 */
function showAboutModal() {
  const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">About PR-FAQ Assistant</h3>
            <div class="text-gray-600 dark:text-gray-400 space-y-3">
                <p>A privacy-first tool for creating high-quality <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ documents</a> using Amazon's Working Backwards methodology with AI assistance.</p>
                <p><strong>Features:</strong></p>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>100% client-side processing</li>
                    <li>No data sent to servers</li>
                    <li>3-phase adversarial AI workflow</li>
                    <li>Optimized for PR-FAQ Validator (70+ score)</li>
                    <li>Multiple project management</li>
                    <li>Import/export capabilities</li>
                </ul>
                <p class="text-sm">All your data stays in your browser's local storage.</p>
            </div>
            <div class="flex justify-end mt-6">
                <button id="close-about" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  modal.querySelector('#close-about').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Handle import file selection
 * @module app
 */
async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    showLoading('Importing...');
    const count = await importProjects(file);
    hideLoading();
    showToast(`Imported ${count} project(s)`, 'success');
    // Refresh the current view
    const { navigateTo } = await import('./router.js');
    navigateTo('home');
  } catch (error) {
    console.error('Import failed:', error);
    hideLoading();
    showToast('Import failed - invalid file', 'error');
  }

  event.target.value = '';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
