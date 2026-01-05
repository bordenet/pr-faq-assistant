/**
 * Tests for Storage Module
 * Uses fake-indexeddb for testing IndexedDB operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IndexedDB for testing
const mockDB = {
    transaction: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => false) },
    createObjectStore: vi.fn(() => ({
        createIndex: vi.fn()
    }))
};

const mockStore = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    index: vi.fn(() => ({
        openCursor: vi.fn()
    }))
};

const mockTransaction = {
    objectStore: vi.fn(() => mockStore)
};

// Mock indexedDB
global.indexedDB = {
    open: vi.fn(() => ({
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: mockDB
    }))
};

// Mock navigator.storage
global.navigator = {
    storage: {
        estimate: vi.fn(() => Promise.resolve({
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
            vi.resetModules();
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
        it('should return storage estimate when available', async () => {
            const { default: storage } = await import('../js/storage.js');
            const info = await storage.getStorageInfo();
            expect(info).toBeDefined();
            expect(info.usage).toBe(1024 * 1024);
            expect(info.quota).toBe(1024 * 1024 * 1024);
            expect(info.percentage).toBe('0.10');
        });
    });

    describe('exportAll structure', () => {
        it('should return correct export structure', async () => {
            const { default: storage } = await import('../js/storage.js');
            // Mock getAllProjects
            storage.getAllProjects = vi.fn(() => Promise.resolve([
                { id: '1', title: 'Test' }
            ]));

            const data = await storage.exportAll();
            expect(data.version).toBeDefined();
            expect(data.exportDate).toBeDefined();
            expect(data.projectCount).toBe(1);
            expect(data.projects).toHaveLength(1);
        });
    });

    describe('importAll validation', () => {
        it('should reject invalid import data', async () => {
            const { default: storage } = await import('../js/storage.js');
            await expect(storage.importAll({})).rejects.toThrow('Invalid import data');
            await expect(storage.importAll({ projects: 'not-array' })).rejects.toThrow('Invalid import data');
        });
    });
});

