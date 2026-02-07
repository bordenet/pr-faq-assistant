/**
 * Tests for diff-view.js module
 *
 * Tests the word-level diff algorithm and HTML rendering.
 */

import { computeWordDiff, renderDiffHtml, getDiffStats } from '../../shared/js/diff-view.js';

describe('computeWordDiff', () => {
  test('should return empty array for empty inputs', () => {
    expect(computeWordDiff('', '')).toEqual([]);
  });

  test('should return empty array for null/undefined inputs', () => {
    expect(computeWordDiff(null, null)).toEqual([]);
    expect(computeWordDiff(undefined, undefined)).toEqual([]);
  });

  test('should detect insertions when new text has more words', () => {
    const diff = computeWordDiff('hello', 'hello world');
    expect(diff).toContainEqual({ type: 'equal', text: 'hello' });
    expect(diff).toContainEqual({ type: 'insert', text: 'world' });
  });

  test('should detect deletions when old text has more words', () => {
    const diff = computeWordDiff('hello world', 'hello');
    expect(diff).toContainEqual({ type: 'equal', text: 'hello' });
    expect(diff).toContainEqual({ type: 'delete', text: 'world' });
  });

  test('should handle complete replacement', () => {
    const diff = computeWordDiff('foo', 'bar');
    expect(diff).toContainEqual({ type: 'delete', text: 'foo' });
    expect(diff).toContainEqual({ type: 'insert', text: 'bar' });
  });

  test('should handle identical texts', () => {
    const diff = computeWordDiff('same text', 'same text');
    const equalItems = diff.filter(d => d.type === 'equal');
    expect(equalItems.length).toBeGreaterThan(0);
    expect(diff.filter(d => d.type !== 'equal').length).toBe(0);
  });

  test('should preserve whitespace tokens', () => {
    const diff = computeWordDiff('hello world', 'hello world');
    const whitespaceTokens = diff.filter(d => d.text.match(/^\s+$/));
    expect(whitespaceTokens.length).toBeGreaterThan(0);
  });

  test('should handle mixed insertions and deletions', () => {
    const diff = computeWordDiff('the quick fox', 'the slow fox');
    expect(diff).toContainEqual({ type: 'delete', text: 'quick' });
    expect(diff).toContainEqual({ type: 'insert', text: 'slow' });
  });
});

describe('renderDiffHtml', () => {
  test('should render equal text without highlighting', () => {
    const diff = [{ type: 'equal', text: 'hello' }];
    const html = renderDiffHtml(diff);
    expect(html).toBe('hello');
    expect(html).not.toContain('bg-');
  });

  test('should render insertions with green background', () => {
    const diff = [{ type: 'insert', text: 'new' }];
    const html = renderDiffHtml(diff);
    expect(html).toContain('bg-green-200');
    expect(html).toContain('new');
  });

  test('should render deletions with red background and strikethrough', () => {
    const diff = [{ type: 'delete', text: 'old' }];
    const html = renderDiffHtml(diff);
    expect(html).toContain('bg-red-200');
    expect(html).toContain('line-through');
    expect(html).toContain('old');
  });

  test('should handle empty diff array', () => {
    const html = renderDiffHtml([]);
    expect(html).toBe('');
  });

  test('should combine multiple diff items', () => {
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

  test('should include dark mode classes', () => {
    const diff = [{ type: 'insert', text: 'new' }];
    const html = renderDiffHtml(diff);
    expect(html).toContain('dark:bg-green-900/50');
  });
});

describe('getDiffStats', () => {
  test('should count additions correctly', () => {
    const diff = [
      { type: 'insert', text: 'new' },
      { type: 'insert', text: 'words' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.additions).toBe(2);
  });

  test('should count deletions correctly', () => {
    const diff = [
      { type: 'delete', text: 'old' },
      { type: 'delete', text: 'words' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.deletions).toBe(2);
  });

  test('should count unchanged correctly', () => {
    const diff = [
      { type: 'equal', text: 'same' },
      { type: 'equal', text: 'text' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.unchanged).toBe(2);
  });

  test('should not count whitespace-only tokens', () => {
    const diff = [
      { type: 'equal', text: '   ' },
      { type: 'insert', text: ' ' }
    ];
    const stats = getDiffStats(diff);
    expect(stats.unchanged).toBe(0);
    expect(stats.additions).toBe(0);
  });

  test('should handle empty diff array', () => {
    const stats = getDiffStats([]);
    expect(stats.additions).toBe(0);
    expect(stats.deletions).toBe(0);
    expect(stats.unchanged).toBe(0);
  });
});
