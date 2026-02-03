/**
 * Storage module for Assistant Core
 * IndexedDB-based project storage with factory pattern
 * @module storage
 */

/**
 * Generate a unique project ID
 * @param {string} prefix - Optional prefix (default: 'proj')
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'proj') {
  // Use crypto.randomUUID if available (modern browsers), otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for Node.js and older browsers
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a project storage instance with IndexedDB backend
 * @param {string} dbName - The IndexedDB database name
 * @param {number} [version=1] - Database version
 * @returns {Object} Storage API with methods for project management
 */
export function createProjectStorage(dbName, version = 1) {
  let db = null;

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Projects store
        if (!database.objectStoreNames.contains('projects')) {
          const projectStore = database.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          projectStore.createIndex('title', 'title', { unique: false });
          projectStore.createIndex('phase', 'phase', { unique: false });
        }

        // Settings store
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get all projects, sorted by last updated
   * @returns {Promise<Array>} Array of projects
   */
  async function getAll() {
    if (!db) await init();
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const index = store.index('updatedAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Descending order
      const projects = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          projects.push(cursor.value);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|undefined>} Project object or undefined
   */
  async function get(id) {
    if (!db) await init();
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a project (create or update)
   * @param {Object} project - Project object with id
   * @returns {Promise<Object>} Saved project
   */
  async function save(project) {
    if (!db) await init();
    project.updatedAt = new Date().toISOString();
    project.modified = Date.now(); // Backward compatibility

    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {Promise<void>}
   */
  async function remove(id) {
    if (!db) await init();
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Return public API
  return {
    init,
    getAll,
    get,
    save,
    delete: remove,
    generateId: () => generateId()
  };
}

