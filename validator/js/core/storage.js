/**
 * Storage module for Validator Core
 * Uses localStorage for version history with explicit saves
 * Provides a factory function to create storage instances with configurable storage keys
 */

/**
 * Create a storage instance with version history management
 * @param {string} storageKey - The localStorage key to use for this storage instance
 * @param {number} [maxVersions=10] - Maximum number of versions to keep
 * @returns {Object} Storage API with methods for version management
 */
export function createStorage(storageKey, maxVersions = 10) {
  /**
   * Get the version history from localStorage
   * @returns {Object} History object with versions array and currentIndex
   */
  function getHistory() {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) return { versions: [], currentIndex: -1 };
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load history:', e);
      return { versions: [], currentIndex: -1 };
    }
  }

  /**
   * Save history to localStorage
   * @param {Object} history - The history object
   */
  function saveHistory(history) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Failed to save history:', e);
      return false;
    }
  }

  /**
   * Save a new version (explicit save by user)
   * @param {string} markdown - The content to save
   * @returns {Object} Result with success status and version info
   */
  function saveVersion(markdown) {
    const history = getHistory();

    // If we're not at the end, truncate current and all forward history
    // The new version replaces the current version and all future versions
    if (history.currentIndex < history.versions.length - 1) {
      history.versions = history.versions.slice(0, history.currentIndex);
    }

    // Don't save if content is identical to current version
    if (history.versions.length > 0 &&
        history.versions[history.currentIndex]?.markdown === markdown) {
      return { success: false, reason: 'no-change' };
    }

    // Add new version
    history.versions.push({
      markdown,
      savedAt: new Date().toISOString()
    });

    // Trim to max versions
    if (history.versions.length > maxVersions) {
      history.versions = history.versions.slice(-maxVersions);
    }

    history.currentIndex = history.versions.length - 1;

    if (saveHistory(history)) {
      return {
        success: true,
        versionNumber: history.currentIndex + 1,
        totalVersions: history.versions.length
      };
    }
    return { success: false, reason: 'storage-error' };
  }

  /**
   * Navigate to previous version
   * @returns {Object|null} The previous version or null if at beginning
   */
  function goBack() {
    const history = getHistory();
    if (history.currentIndex <= 0) return null;

    history.currentIndex--;
    saveHistory(history);

    return {
      ...history.versions[history.currentIndex],
      versionNumber: history.currentIndex + 1,
      totalVersions: history.versions.length
    };
  }

  /**
   * Navigate to next version
   * @returns {Object|null} The next version or null if at end
   */
  function goForward() {
    const history = getHistory();
    if (history.currentIndex >= history.versions.length - 1) return null;

    history.currentIndex++;
    saveHistory(history);

    return {
      ...history.versions[history.currentIndex],
      versionNumber: history.currentIndex + 1,
      totalVersions: history.versions.length
    };
  }

  /**
   * Get current version info
   * @returns {Object|null} Current version info or null if no versions
   */
  function getCurrentVersion() {
    const history = getHistory();
    if (history.versions.length === 0) return null;

    return {
      ...history.versions[history.currentIndex],
      versionNumber: history.currentIndex + 1,
      totalVersions: history.versions.length,
      canGoBack: history.currentIndex > 0,
      canGoForward: history.currentIndex < history.versions.length - 1
    };
  }

  /**
   * Load the most recent version (for initial page load)
   * @returns {Object|null} The most recent version or null
   */
  function loadDraft() {
    const history = getHistory();
    if (history.versions.length === 0) return null;
    return history.versions[history.currentIndex];
  }

  /**
   * Get human-readable time since last save
   * @param {string} isoDate - ISO date string
   * @returns {string} Human-readable time (e.g., "2 mins ago")
   */
  function getTimeSince(isoDate) {
    if (!isoDate) return '--';
    const saved = new Date(isoDate);
    const now = new Date();
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return saved.toLocaleDateString();
  }

  /**
   * Get storage usage estimate
   * @returns {Promise<Object|null>} Storage estimate with usage, quota, and percentage
   */
  async function getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(1)
      };
    }
    return null;
  }

  /**
   * Format bytes as human-readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string (e.g., "1.5 MB")
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Return public API
  return {
    saveVersion,
    goBack,
    goForward,
    getCurrentVersion,
    loadDraft,
    getTimeSince,
    getStorageEstimate,
    formatBytes
  };
}
