/**
 * Tests for diff-view.js module
 *
 * Tests the word-level diff algorithm used for comparing Phase 1 and Phase 2 outputs.
 */

import { jest } from '@jest/globals';
import { computeWordDiff, renderDiffHtml, getDiffStats } from '../js/diff-view.js';

// Mock document.createElement for escapeHtml function
beforeAll(() => {
  global.document = {
    createElement: jest.fn(() => {
      const element = { textContent: '', innerHTML: '' };
      Object.defineProperty(element, 'innerHTML', {
        get: function() { return this.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        set: function() {}
      });
      return element;
    })
  };
});

afterAll(() => {
  delete global.document;
});

describe('computeWordDiff', () => {
  it('should return empty array for empty inputs', () => {
    const diff = computeWordDiff('', '');
    expect(diff).toEqual([]);
  });

  it('should return empty array for null/undefined inputs', () => {
    const diff = computeWordDiff(null, undefined);
    expect(diff).toEqual([]);
  });

  it('should detect insertions when new text has more words', () => {
    const diff = computeWordDiff('hello', 'hello world');
    const types = diff.map(d => d.type);
    expect(types).toContain('equal');
    expect(types).toContain('insert');
  });

  it('should detect deletions when old text has more words', () => {
    const diff = computeWordDiff('hello world', 'hello');
    const types = diff.map(d => d.type);
    expect(types).toContain('equal');
    expect(types).toContain('delete');
  });

  it('should handle complete replacement', () => {
    const diff = computeWordDiff('foo bar', 'baz qux');
    const types = diff.map(d => d.type);
    expect(types).toContain('delete');
    expect(types).toContain('insert');
  });

  it('should handle identical texts', () => {
    const diff = computeWordDiff('same text', 'same text');
    const types = diff.map(d => d.type);
    expect(types.every(t => t === 'equal')).toBe(true);
  });

  it('should preserve whitespace tokens', () => {
    const diff = computeWordDiff('a b', 'a b');
    expect(diff.length).toBeGreaterThan(2); // words + whitespace
  });

  it('should handle mixed insertions and deletions', () => {
    const diff = computeWordDiff('the quick fox', 'the slow fox jumps');
    const types = diff.map(d => d.type);
    expect(types).toContain('equal');
    expect(types).toContain('delete');
    expect(types).toContain('insert');
  });
});

describe('renderDiffHtml', () => {
  it('should render equal text without highlighting', () => {
    const diff = [{ type: 'equal', text: 'hello' }];
    const html = renderDiffHtml(diff);
    expect(html).not.toContain('class=');
    expect(html).toContain('hello');
  });

  it('should render insertions with green background', () => {
    const diff = [{ type: 'insert', text: 'new' }];
    const html = renderDiffHtml(diff);
    expect(html).toContain('bg-green-200');
    expect(html).toContain('new');
  });

  it('should render deletions with red background and strikethrough', () => {
    const diff = [{ type: 'delete', text: 'old' }];
    const html = renderDiffHtml(diff);
    expect(html).toContain('bg-red-200');
    expect(html).toContain('line-through');
    expect(html).toContain('old');
  });

  it('should handle empty diff array', () => {
    const html = renderDiffHtml([]);
    expect(html).toBe('');
  });

  it('should combine multiple diff items', () => {
    const diff = [
      { type: 'equal', text: 'hello' },
      { type: 'delete', text: 'world' },
      { type: 'insert', text: 'there' }
    ];
    const html = renderDiffHtml(diff);
    expect(html).toContain('hello');
    expect(html).toContain('world');
    expect(html).toContain('there');
  });

  it('should include dark mode classes', () => {
    const diff = [
      { type: 'insert', text: 'new' },
      { type: 'delete', text: 'old' }
    ];
    const html = renderDiffHtml(diff);
    expect(html).toContain('dark:bg-green-900');
    expect(html).toContain('dark:bg-red-900');
  });
});

describe('getDiffStats', () => {
  it('should count additions correctly', () => {
    const diff = [
      { type: 'insert', text: 'word1' },
      { type: 'insert', text: 'word2' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.additions).toBe(2);
    expect(stats.deletions).toBe(0);
    expect(stats.unchanged).toBe(0);
  });

  it('should count deletions correctly', () => {
    const diff = [
      { type: 'delete', text: 'old1' },
      { type: 'delete', text: 'old2' },
      { type: 'delete', text: 'old3' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.additions).toBe(0);
    expect(stats.deletions).toBe(3);
  });

  it('should count unchanged correctly', () => {
    const diff = [
      { type: 'equal', text: 'same' },
      { type: 'equal', text: 'text' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.unchanged).toBe(2);
  });

  it('should not count whitespace-only tokens', () => {
    const diff = [
      { type: 'insert', text: '   ' },
      { type: 'delete', text: '\n' },
      { type: 'equal', text: '\t' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.additions).toBe(0);
    expect(stats.deletions).toBe(0);
    expect(stats.unchanged).toBe(0);
  });

  it('should handle empty diff array', () => {
    const stats = getDiffStats([]);
    expect(stats).toEqual({ additions: 0, deletions: 0, unchanged: 0 });
  });
});
