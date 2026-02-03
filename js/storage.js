/**
 * IndexedDB Storage Module
 * Handles all client-side data persistence for PR-FAQ Assistant
 * @module storage
 */

/** @type {string} */
const DB_NAME = 'pr-faq-assistant-db';

/** @type {number} */
const DB_VERSION = 1;

/** @type {string} */
const STORE_NAME = 'prfaq-projects';

/**
 * Storage class for IndexedDB operations
 */
class Storage {
  constructor() {
    /** @type {IDBDatabase | null} */
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const projectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          projectStore.createIndex('title', 'title', { unique: false });
          projectStore.createIndex('phase', 'phase', { unique: false });
        }

        if (!db.objectStoreNames.contains('prompts')) {
          db.createObjectStore('prompts', { keyPath: 'phase' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async getAllProjects() {
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('updatedAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
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

  async getProject(id) {
    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProject(project) {
    project.updatedAt = new Date().toISOString();

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id) {
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return null;
  }

  async exportAll() {
    const projects = await this.getAllProjects();
    return {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      projectCount: projects.length,
      projects: projects
    };
  }

  async importAll(data) {
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid import data');
    }

    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const project of data.projects) {
      await new Promise((resolve, reject) => {
        const request = store.put(project);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    return data.projects.length;
  }
}

export default new Storage();
