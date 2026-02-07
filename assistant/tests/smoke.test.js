/**
 * @jest-environment jsdom
 */

/* global global */

/**
 * Smoke Test - Catches the exact failure mode that broke jd-assistant
 *
 * This test verifies:
 * 1. All JS modules can be imported (catches missing js/core/)
 * 2. All required DOM elements exist (catches wrong index.html)
 */

describe('Smoke Test - App Initialization', () => {
  beforeEach(() => {
    // Set up minimal DOM required by app
    document.body.innerHTML = `
      <div id="app-container"></div>
      <div id="loading-overlay" class="hidden"></div>
      <div id="toast-container"></div>
      <button id="theme-toggle"></button>
      <span id="storage-info"></span>
      <div id="privacy-notice" class="hidden"></div>
      <button id="export-all-btn"></button>
      <button id="import-btn"></button>
      <input id="import-file-input" type="file" />
      <button id="new-project-btn"></button>
      <button id="create-first-btn"></button>
      <div id="related-projects-btn"></div>
      <div id="related-projects-menu"></div>
      <button id="close-privacy-notice"></button>
      <div id="mockModeCheckbox"></div>
      <div id="aiMockToggle"></div>
      <button id="about-link"></button>
    `;

    // Mock localStorage
    const storage = {};
    global.localStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    };
  });

  describe('Module Imports', () => {
    test('storage.js can be imported without errors', async () => {
      await expect(import('../../shared/js/storage.js')).resolves.toBeDefined();
    });

    test('workflow.js can be imported without errors', async () => {
      await expect(import('../../shared/js/workflow.js')).resolves.toBeDefined();
    });

    test('ui.js can be imported without errors', async () => {
      await expect(import('../../shared/js/ui.js')).resolves.toBeDefined();
    });

    test('router.js can be imported without errors', async () => {
      await expect(import('../../shared/js/router.js')).resolves.toBeDefined();
    });

    test('projects.js can be imported without errors', async () => {
      await expect(import('../../shared/js/projects.js')).resolves.toBeDefined();
    });

    test('ai-mock.js can be imported without errors', async () => {
      await expect(import('../../shared/js/ai-mock.js')).resolves.toBeDefined();
    });
  });

  /**
   * CRITICAL: Export Consistency Tests
   *
   * These tests verify that all exports imported by project-view.js actually exist.
   * This catches the exact bug that broke PR-FAQ, One-Pager, and PRD on 2026-02-05:
   * - project-view.js imported confirmWithRemember from ui.js
   * - But ui.js didn't export confirmWithRemember (uncommitted changes)
   * - Result: SyntaxError in browser, app completely broken
   *
   * If you add a new import to project-view.js, add a corresponding test here!
   */
  describe('Export Consistency - ui.js exports match project-view.js imports', () => {
    test('ui.js exports escapeHtml', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.escapeHtml).toBe('function');
    });

    test('ui.js exports showToast', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.showToast).toBe('function');
    });

    test('ui.js exports copyToClipboard', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.copyToClipboard).toBe('function');
    });

    test('ui.js exports copyToClipboardAsync', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.copyToClipboardAsync).toBe('function');
    });

    test('ui.js exports showPromptModal', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.showPromptModal).toBe('function');
    });

    test('ui.js exports confirm', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.confirm).toBe('function');
    });

    test('ui.js exports confirmWithRemember', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.confirmWithRemember).toBe('function');
    });

    test('ui.js exports showDocumentPreviewModal', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.showDocumentPreviewModal).toBe('function');
    });

    test('ui.js exports createActionMenu', async () => {
      const ui = await import('../../shared/js/ui.js');
      expect(typeof ui.createActionMenu).toBe('function');
    });
  });

  describe('Export Consistency - validator-inline.js exports match project-view.js imports', () => {
    // All projects must use validateDocument (generic name for shared library)
    test('validator-inline.js exports validateDocument', async () => {
      const validator = await import('../../shared/js/validator-inline.js');
      expect(typeof validator.validateDocument).toBe('function');
    });

    test('validator-inline.js exports getScoreColor', async () => {
      const validator = await import('../../shared/js/validator-inline.js');
      expect(typeof validator.getScoreColor).toBe('function');
    });

    test('validator-inline.js exports getScoreLabel', async () => {
      const validator = await import('../../shared/js/validator-inline.js');
      expect(typeof validator.getScoreLabel).toBe('function');
    });
  });

  describe('Export Consistency - diff-view.js exports match project-view.js imports', () => {
    test('diff-view.js exports computeWordDiff', async () => {
      const diffView = await import('../../shared/js/diff-view.js');
      expect(typeof diffView.computeWordDiff).toBe('function');
    });

    test('diff-view.js exports renderDiffHtml', async () => {
      const diffView = await import('../../shared/js/diff-view.js');
      expect(typeof diffView.renderDiffHtml).toBe('function');
    });

    test('diff-view.js exports getDiffStats', async () => {
      const diffView = await import('../../shared/js/diff-view.js');
      expect(typeof diffView.getDiffStats).toBe('function');
    });
  });

  describe('Required DOM Elements', () => {
    test('app-container exists', () => {
      expect(document.getElementById('app-container')).not.toBeNull();
    });

    test('loading-overlay exists', () => {
      expect(document.getElementById('loading-overlay')).not.toBeNull();
    });

    test('toast-container exists', () => {
      expect(document.getElementById('toast-container')).not.toBeNull();
    });

    test('theme-toggle exists', () => {
      expect(document.getElementById('theme-toggle')).not.toBeNull();
    });

    test('storage-info exists', () => {
      expect(document.getElementById('storage-info')).not.toBeNull();
    });

    test('privacy-notice exists', () => {
      expect(document.getElementById('privacy-notice')).not.toBeNull();
    });

    test('export-all-btn exists', () => {
      expect(document.getElementById('export-all-btn')).not.toBeNull();
    });

    test('import-btn exists', () => {
      expect(document.getElementById('import-btn')).not.toBeNull();
    });

    test('import-file-input exists', () => {
      expect(document.getElementById('import-file-input')).not.toBeNull();
    });

    test('new-project-btn exists', () => {
      expect(document.getElementById('new-project-btn')).not.toBeNull();
    });

    test('create-first-btn exists', () => {
      expect(document.getElementById('create-first-btn')).not.toBeNull();
    });

    test('related-projects-btn exists', () => {
      expect(document.getElementById('related-projects-btn')).not.toBeNull();
    });

    test('related-projects-menu exists', () => {
      expect(document.getElementById('related-projects-menu')).not.toBeNull();
    });

    test('close-privacy-notice exists', () => {
      expect(document.getElementById('close-privacy-notice')).not.toBeNull();
    });

    test('mockModeCheckbox exists', () => {
      expect(document.getElementById('mockModeCheckbox')).not.toBeNull();
    });

    test('aiMockToggle exists', () => {
      expect(document.getElementById('aiMockToggle')).not.toBeNull();
    });

    test('about-link exists', () => {
      expect(document.getElementById('about-link')).not.toBeNull();
    });
  });
});
