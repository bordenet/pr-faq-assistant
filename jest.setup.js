/**
 * Jest Setup File
 *
 * This file runs before each test suite to set up the testing environment.
 */

import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { jest } from '@jest/globals';

// Expose jest globally for test files
global.jest = jest;

// Suppress jsdom navigation errors (jsdom doesn't support full navigation)
// These are expected warnings when testing code that performs URL navigation
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  // Suppress known jsdom limitations
  if (message.includes('Not implemented: navigation') ||
      message.includes('Error: Not implemented')) {
    return; // Silently ignore these expected jsdom warnings
  }
  originalConsoleError.apply(console, args);
};

// Polyfill crypto.randomUUID for Node.js
Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true
});

// Polyfill structuredClone for Node.js < 17
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock File API
class MockBlob {
  constructor(parts = [], options = {}) {
    // Flatten parts - handle nested Blobs
    this.parts = parts.map(part => {
      if (part instanceof MockBlob) {
        return part.parts.join('');
      }
      return part;
    });
    this.type = options.type || '';
    this.size = this.parts.reduce((acc, part) => acc + (part?.length || 0), 0);
  }
}

class MockFile extends MockBlob {
  constructor(parts, name, options = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }
}

global.Blob = MockBlob;
global.File = MockFile;

// Mock FileReader
global.FileReader = class FileReader {
  readAsText(blob) {
    this.result = blob.parts.join('');
    if (this.onload) {
      this.onload({ target: this });
    }
  }

  readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(blob.parts.join('')).toString('base64')}`;
    if (this.onload) {
      this.onload({ target: this });
    }
  }
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock clipboard API with ClipboardItem support for Safari-compatible pattern
global.ClipboardItem = jest.fn().mockImplementation((data) => ({ data }));
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    write: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// Mock window.isSecureContext for Clipboard API availability check
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true,
});

// Mock document.execCommand for fallback clipboard operations
document.execCommand = jest.fn(() => true);

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});
