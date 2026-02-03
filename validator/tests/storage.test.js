/**
 * Storage module tests - Version history management
 */

import { createStorage } from '../js/core/storage.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('Version History', () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = createStorage('test-storage-key');
  });

  describe('saveVersion', () => {
    it('saves first version successfully', () => {
      const result = storage.saveVersion('# Version 1');
      expect(result.success).toBe(true);
      expect(result.versionNumber).toBe(1);
      expect(result.totalVersions).toBe(1);
    });

    it('saves multiple versions in sequence', () => {
      storage.saveVersion('# Version 1');
      storage.saveVersion('# Version 2');
      const result = storage.saveVersion('# Version 3');

      expect(result.success).toBe(true);
      expect(result.versionNumber).toBe(3);
      expect(result.totalVersions).toBe(3);
    });

    it('does not save if content is identical', () => {
      storage.saveVersion('# Same content');
      const result = storage.saveVersion('# Same content');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('no-change');
    });

    it('replaces current and future versions when saving from past position', () => {
      // Create 5 versions
      storage.saveVersion('# Version 1');
      storage.saveVersion('# Version 2');
      storage.saveVersion('# Version 3');
      storage.saveVersion('# Version 4');
      storage.saveVersion('# Version 5');

      // Go back to version 3
      storage.goBack(); // now at v4
      storage.goBack(); // now at v3

      // Save a new version - should REPLACE v3 and remove v4, v5
      const result = storage.saveVersion('# New Version replacing v3');

      // New version should be at position 3
      expect(result.success).toBe(true);
      expect(result.versionNumber).toBe(3);
      expect(result.totalVersions).toBe(3); // Only v1, v2, and new version

      // Verify we can't go forward anymore
      const current = storage.getCurrentVersion();
      expect(current.canGoForward).toBe(false);
      expect(current.markdown).toBe('# New Version replacing v3');
    });
  });

  describe('goBack', () => {
    it('returns null when no history', () => {
      expect(storage.goBack()).toBeNull();
    });

    it('returns null when at first version', () => {
      storage.saveVersion('# Only version');
      expect(storage.goBack()).toBeNull();
    });

    it('navigates to previous version', () => {
      storage.saveVersion('# Version 1');
      storage.saveVersion('# Version 2');

      const prev = storage.goBack();
      expect(prev.markdown).toBe('# Version 1');
      expect(prev.versionNumber).toBe(1);
    });
  });

  describe('goForward', () => {
    it('returns null when no history', () => {
      expect(storage.goForward()).toBeNull();
    });

    it('returns null when at latest version', () => {
      storage.saveVersion('# Version 1');
      expect(storage.goForward()).toBeNull();
    });

    it('navigates to next version after going back', () => {
      storage.saveVersion('# Version 1');
      storage.saveVersion('# Version 2');
      storage.goBack();

      const next = storage.goForward();
      expect(next.markdown).toBe('# Version 2');
      expect(next.versionNumber).toBe(2);
    });
  });

  describe('getCurrentVersion', () => {
    it('returns null when no history', () => {
      expect(storage.getCurrentVersion()).toBeNull();
    });

    it('returns current version info with navigation flags', () => {
      storage.saveVersion('# Version 1');
      storage.saveVersion('# Version 2');

      const current = storage.getCurrentVersion();
      expect(current.versionNumber).toBe(2);
      expect(current.totalVersions).toBe(2);
      expect(current.canGoBack).toBe(true);
      expect(current.canGoForward).toBe(false);
    });
  });

  describe('loadDraft', () => {
    it('returns null when no history', () => {
      expect(storage.loadDraft()).toBeNull();
    });

    it('returns current version content', () => {
      storage.saveVersion('# My draft');
      const draft = storage.loadDraft();
      expect(draft.markdown).toBe('# My draft');
    });
  });
});
