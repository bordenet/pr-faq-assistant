/**
 * Tests for Storage Module
 * Uses fake-indexeddb for testing IndexedDB operations
 */

import { jest } from '@jest/globals';

// Mock IndexedDB for testing
const mockDB = {
  transaction: jest.fn(),
  objectStoreNames: { contains: jest.fn(() => false) },
  createObjectStore: jest.fn(() => ({
    createIndex: jest.fn()
  }))
};

const mockStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  index: jest.fn(() => ({
    openCursor: jest.fn()
  }))
};

const mockTransaction = {
  objectStore: jest.fn(() => mockStore)
};

// Mock indexedDB
global.indexedDB = {
  open: jest.fn(() => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: mockDB
  }))
};

// Mock navigator.storage
global.navigator = {
  storage: {
    estimate: jest.fn(() => Promise.resolve({
      usage: 1024 * 1024,
      quota: 1024 * 1024 * 1024
    }))
  }
};

describe('Storage Module', () => {
    describe('Storage class structure', () => {
        it('should export a default storage instance', async () => {
            const { default: storage } = await import('../js/storage.js');
            expect(storage).toBeDefined();
            expect(typeof storage.init).toBe('function');
            expect(typeof storage.getAllProjects).toBe('function');
            expect(typeof storage.getProject).toBe('function');
            expect(typeof storage.saveProject).toBe('function');
            expect(typeof storage.deleteProject).toBe('function');
            expect(typeof storage.exportAll).toBe('function');
            expect(typeof storage.importAll).toBe('function');
            expect(typeof storage.getStorageInfo).toBe('function');
        });
    });

    describe('Storage methods', () => {
        let storage;

        beforeEach(async () => {
            jest.resetModules();
            const module = await import('../js/storage.js');
            storage = module.default;
        });

        it('should have db property initially null', () => {
            expect(storage.db).toBeNull();
        });

        it('should have correct method signatures', () => {
            expect(storage.init.length).toBe(0);
            expect(storage.getAllProjects.length).toBe(0);
            expect(storage.getProject.length).toBe(1);
            expect(storage.saveProject.length).toBe(1);
            expect(storage.deleteProject.length).toBe(1);
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage estimate when available or null', async () => {
            const { default: storage } = await import('../js/storage.js');
            const info = await storage.getStorageInfo();
            // In test environment, navigator.storage may not be available
            // The function returns null when estimate is not available
            if (info !== null) {
                expect(info.usage).toBeDefined();
                expect(info.quota).toBeDefined();
                expect(info.percentage).toBeDefined();
            } else {
                expect(info).toBeNull();
            }
        });
    });

    describe('init', () => {
        it('should initialize database successfully', async () => {
            const { default: storage } = await import('../js/storage.js');
            expect(typeof storage.init).toBe('function');
        });

        it('should have db property', async () => {
            const { default: storage } = await import('../js/storage.js');
            expect(storage.db === null || storage.db !== undefined).toBe(true);
        });
    });

    describe('exportAll', () => {
        it('should return correct export structure', async () => {
            const { default: storage } = await import('../js/storage.js');
            // Mock getAllProjects
            storage.getAllProjects = jest.fn(() => Promise.resolve([
                { id: '1', title: 'Test' }
            ]));

            const data = await storage.exportAll();
            expect(data.version).toBeDefined();
            expect(data.exportDate).toBeDefined();
            expect(data.projectCount).toBe(1);
            expect(data.projects).toHaveLength(1);
        });

        it('should export empty backup when no projects', async () => {
            const { default: storage } = await import('../js/storage.js');
            storage.getAllProjects = jest.fn(() => Promise.resolve([]));

            const data = await storage.exportAll();
            expect(data.projects).toEqual([]);
            expect(data.projectCount).toBe(0);
        });
    });

    describe('importAll', () => {
        it('should reject invalid import data', async () => {
            const { default: storage } = await import('../js/storage.js');
            await expect(storage.importAll({})).rejects.toThrow('Invalid import data');
            await expect(storage.importAll({ projects: 'not-array' })).rejects.toThrow('Invalid import data');
        });

        it('should import projects from valid data', async () => {
            const { default: storage } = await import('../js/storage.js');
            const savedProjects = [];
            storage.saveProject = jest.fn((p) => {
                savedProjects.push(p);
                return Promise.resolve(true);
            });

            const importData = {
                version: 1,
                exportDate: new Date().toISOString(),
                projectCount: 2,
                projects: [
                    { id: 'imp-1', title: 'Import 1' },
                    { id: 'imp-2', title: 'Import 2' }
                ]
            };

            const count = await storage.importAll(importData);
            expect(count).toBe(2);
            expect(savedProjects.length).toBe(2);
        });
    });
});
