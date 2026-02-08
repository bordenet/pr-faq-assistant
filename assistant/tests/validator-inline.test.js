/**
 * Tests for PR-FAQ Validator - Integration tests for assistant
 *
 * Note: Comprehensive validator tests are in validator/tests/validator.test.js
 * These tests verify that the assistant correctly imports from the canonical validator.
 */

import {
  validateDocument,
  validatePRFAQ,
  getScoreColor,
  getScoreLabel,
  // Detection functions
  detectMetricsInText,
  detectFluffWords
} from '../../validator/js/validator.js';

// ============================================================================
// Integration Tests - Verify canonical validator is used
// ============================================================================

describe('PR-FAQ Validator Integration', () => {
  describe('validateDocument', () => {
    test('should return totalScore for valid content', () => {
      const result = validateDocument(`# ACME Launches Widget

FOR IMMEDIATE RELEASE

ACME Corp announced a new product today.

## FAQ

### What is it?
A productivity tool.
`);
      expect(result.totalScore).toBeDefined();
      expect(typeof result.totalScore).toBe('number');
    });

    test('should return zero for empty content', () => {
      const result = validateDocument('');
      expect(result.totalScore).toBe(0);
    });

    test('should return zero for null content', () => {
      const result = validateDocument(null);
      expect(result.totalScore).toBe(0);
    });
  });

  describe('validatePRFAQ', () => {
    test('should be an alias for validateDocument', () => {
      const content = '# Test\nSome content.';
      const result1 = validateDocument(content);
      const result2 = validatePRFAQ(content);
      expect(result1.totalScore).toBe(result2.totalScore);
    });
  });

  describe('getScoreColor', () => {
    test('should return green for scores >= 70', () => {
      expect(getScoreColor(70)).toBe('green');
      expect(getScoreColor(100)).toBe('green');
    });

    test('should return yellow for scores 50-69', () => {
      expect(getScoreColor(50)).toBe('yellow');
    });

    test('should return orange for scores 30-49', () => {
      expect(getScoreColor(30)).toBe('orange');
    });

    test('should return red for scores < 30', () => {
      expect(getScoreColor(0)).toBe('red');
    });
  });

  describe('getScoreLabel', () => {
    test('should return Excellent for scores >= 80', () => {
      expect(getScoreLabel(80)).toBe('Excellent');
      expect(getScoreLabel(100)).toBe('Excellent');
    });

    test('should return Ready for scores 70-79', () => {
      expect(getScoreLabel(70)).toBe('Ready');
      expect(getScoreLabel(79)).toBe('Ready');
    });

    test('should return Needs Work for scores 50-69', () => {
      expect(getScoreLabel(50)).toBe('Needs Work');
      expect(getScoreLabel(69)).toBe('Needs Work');
    });

    test('should return Draft for scores 30-49', () => {
      expect(getScoreLabel(30)).toBe('Draft');
      expect(getScoreLabel(49)).toBe('Draft');
    });

    test('should return Incomplete for scores < 30', () => {
      expect(getScoreLabel(0)).toBe('Incomplete');
      expect(getScoreLabel(29)).toBe('Incomplete');
    });
  });
});

// ============================================================================
// Detection Functions Tests
// ============================================================================

describe('Detection Functions', () => {
  describe('detectMetricsInText', () => {
    test('should detect metrics in text', () => {
      const result = detectMetricsInText('Achieved 50% growth and $1M revenue.');
      expect(result).toBeDefined();
    });

    test('should handle text without metrics', () => {
      const result = detectMetricsInText('This is a simple statement.');
      expect(result).toBeDefined();
    });
  });

  describe('detectFluffWords', () => {
    test('should detect fluff words', () => {
      const result = detectFluffWords('This is a revolutionary, game-changing solution.');
      expect(result).toBeDefined();
    });

    test('should handle clean text', () => {
      const result = detectFluffWords('This product helps users save time.');
      expect(result).toBeDefined();
    });
  });
});
