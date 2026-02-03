/**
 * Link and Reference Validation Tests
 *
 * Validates that all internal markdown links point to existing files.
 * This prevents broken documentation references from being deployed.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { describe, test, expect } from '@jest/globals';

const PROJECT_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '../..');

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    // Skip common non-source directories
    if (['node_modules', '.git', 'coverage', 'dist', 'build'].includes(entry)) {
      continue;
    }

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract markdown links from content
 * Returns array of { text, url, line }
 */
function extractMarkdownLinks(content) {
  const links = [];
  const lines = content.split('\n');

  // Pattern: [text](url) - captures the URL part
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        line: index + 1
      });
    }
  });

  return links;
}

/**
 * Check if a link target exists
 */
function linkTargetExists(url, sourceFile) {
  // Skip external URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
    return { valid: true, type: 'external' };
  }

  // Skip anchor-only links
  if (url.startsWith('#')) {
    return { valid: true, type: 'anchor' };
  }

  // Remove anchor from URL if present
  const urlWithoutAnchor = url.split('#')[0];

  // Resolve relative path
  const sourceDir = dirname(sourceFile);
  const targetPath = urlWithoutAnchor.startsWith('/')
    ? join(PROJECT_ROOT, urlWithoutAnchor)
    : join(sourceDir, urlWithoutAnchor);

  const exists = existsSync(targetPath);

  return {
    valid: exists,
    type: 'internal',
    resolvedPath: targetPath
  };
}

describe('Link Validation', () => {
  const markdownFiles = findMarkdownFiles(PROJECT_ROOT);

  test('should find markdown files to validate', () => {
    expect(markdownFiles.length).toBeGreaterThan(0);
  });

  // Group tests by file for better error reporting
  markdownFiles.forEach(filePath => {
    const relativePath = filePath.replace(PROJECT_ROOT + '/', '');

    describe(`${relativePath}`, () => {
      const content = readFileSync(filePath, 'utf-8');
      const links = extractMarkdownLinks(content);
      const internalLinks = links.filter(link => {
        const result = linkTargetExists(link.url, filePath);
        return result.type === 'internal';
      });

      if (internalLinks.length === 0) {
        test('has no internal links to validate', () => {
          expect(true).toBe(true);
        });
      } else {
        internalLinks.forEach(link => {
          test(`line ${link.line}: "${link.text}" -> ${link.url}`, () => {
            const result = linkTargetExists(link.url, filePath);
            expect(result.valid).toBe(true);
          });
        });
      }
    });
  });
});
