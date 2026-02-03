/**
 * Validator tests - Comprehensive scoring tests
 * Tests all exported functions: extractQuotes, detectMetrics, scoreQuote, scoreCustomerEvidence
 */

import { extractQuotes, detectMetricsInText, scoreQuote, scoreCustomerEvidence } from '../js/validator.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixtures = JSON.parse(
  readFileSync(join(__dirname, '../testdata/scoring-fixtures.json'), 'utf-8')
);

// ============================================================================
// extractQuotes tests
// ============================================================================
describe('extractQuotes', () => {
  describe('standard double quotes', () => {
    test('extracts double-quoted text', () => {
      const input = '"This is a test quote that is long enough to be extracted" said someone.';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(1);
      expect(quotes[0]).toBe('This is a test quote that is long enough to be extracted');
    });

    test('extracts multiple quotes from text', () => {
      const input = '"First quote that is long enough" and "Second quote that is also long enough"';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(2);
    });
  });

  describe('curly quotes', () => {
    test('handles curly double quotes', () => {
      const input = '"This is a curly quoted text that is long enough" said someone.';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(1);
    });

    test('handles curly single quotes', () => {
      const input = '\u2018This is a curly single quoted text long enough\u2019 said someone.';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(1);
    });
  });

  describe('filtering', () => {
    test('filters out short quotes (< 20 chars)', () => {
      const input = '"Short" and "This is a longer quote that should be extracted" here.';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(1);
    });

    test('returns empty array for no quotes', () => {
      const input = 'This is text without any quotes at all.';
      const quotes = extractQuotes(input);
      expect(quotes).toHaveLength(0);
    });

    test('trims whitespace from quotes', () => {
      const input = '"  This quote has whitespace that should be trimmed  "';
      const quotes = extractQuotes(input);
      expect(quotes[0]).not.toMatch(/^\s/);
      expect(quotes[0]).not.toMatch(/\s$/);
    });
  });
});

// ============================================================================
// detectMetricsInText tests
// ============================================================================
describe('detectMetricsInText', () => {
  describe('percentage patterns', () => {
    test('detects simple percentage', () => {
      const result = detectMetricsInText('reduced by 40%');
      expect(result.metrics).toContain('40%');
      expect(result.types).toContain('percentage');
    });

    test('detects decimal percentage', () => {
      const result = detectMetricsInText('increased by 3.5%');
      expect(result.metrics).toContain('3.5%');
    });

    test('detects "percent" word form', () => {
      const result = detectMetricsInText('improved 25 percent');
      expect(result.types).toContain('percentage');
    });
  });

  describe('ratio patterns', () => {
    test('detects multiplier (Nx)', () => {
      const result = detectMetricsInText('5x faster');
      expect(result.metrics).toContain('5x');
      expect(result.types).toContain('ratio');
    });

    test('detects ratio format (N:N)', () => {
      const result = detectMetricsInText('achieved 10:1 ROI');
      expect(result.metrics).toContain('10:1');
      expect(result.types).toContain('ratio');
    });

    test('detects "times" word form', () => {
      const result = detectMetricsInText('3 times faster');
      expect(result.types).toContain('ratio');
    });
  });

  describe('absolute patterns', () => {
    test('detects dollar amounts', () => {
      const result = detectMetricsInText('saved $2 million');
      expect(result.types).toContain('absolute');
    });

    test('detects time durations', () => {
      const result = detectMetricsInText('reduced to 50 milliseconds');
      expect(result.types).toContain('absolute');
    });

    test('detects customer counts', () => {
      const result = detectMetricsInText('serving 10000 customers');
      expect(result.types).toContain('absolute');
    });
  });

  describe('edge cases', () => {
    test('returns empty arrays for no metrics', () => {
      const result = detectMetricsInText('no metrics here');
      expect(result.metrics).toEqual([]);
      expect(result.types).toEqual([]);
    });

    test('handles multiple metrics in same text', () => {
      const result = detectMetricsInText('reduced costs by 40% and latency by 50 milliseconds');
      expect(result.metrics.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ============================================================================
// scoreQuote tests
// ============================================================================
describe('scoreQuote', () => {
  describe('base scoring', () => {
    test('returns 0 for no metrics', () => {
      expect(scoreQuote([], [])).toBe(0);
    });

    test('returns base score (2) for any metric', () => {
      expect(scoreQuote(['something'], ['unknown'])).toBeGreaterThanOrEqual(2);
    });
  });

  describe('type bonuses', () => {
    test('percentage bonus (+3)', () => {
      // Base 2 + percentage 3 = 5
      expect(scoreQuote(['40%'], ['percentage'])).toBe(5);
    });

    test('ratio bonus (+2)', () => {
      // Base 2 + ratio 2 = 4
      expect(scoreQuote(['3x'], ['ratio'])).toBe(4);
    });

    test('absolute bonus (+2)', () => {
      // Base 2 + absolute 2 = 4
      expect(scoreQuote(['$1M'], ['absolute'])).toBe(4);
    });

    test('score bonus (+1)', () => {
      // Base 2 + score 1 = 3
      expect(scoreQuote(['NPS score'], ['score'])).toBe(3);
    });
  });

  describe('multi-metric bonuses', () => {
    test('adds bonus for 2+ metrics', () => {
      // Base 2 + percentage 3 + absolute 2 + multi-metric bonus 2 = 9
      expect(scoreQuote(['40%', '$2 million'], ['percentage', 'absolute'])).toBe(9);
    });

    test('adds extra bonus for 3+ metrics', () => {
      const metrics = ['40%', '$2M', '5x'];
      const types = ['percentage', 'absolute', 'ratio'];
      // Base 2 + percentage 3 + absolute 2 + ratio 2 + multi(2) 2 + multi(3) 1 = 12 -> capped at 10
      expect(scoreQuote(metrics, types)).toBe(10);
    });
  });

  describe('capping', () => {
    test('caps at 10', () => {
      const metrics = ['40%', '3x', '$2M', '50ms', 'score of 9'];
      const types = ['percentage', 'ratio', 'absolute', 'absolute', 'score'];
      expect(scoreQuote(metrics, types)).toBe(10);
    });

    test('does not exceed 10 with many metrics', () => {
      const metrics = Array(10).fill('40%');
      const types = Array(10).fill('percentage');
      expect(scoreQuote(metrics, types)).toBeLessThanOrEqual(10);
    });
  });
});

// ============================================================================
// scoreCustomerEvidence tests
// ============================================================================
describe('scoreCustomerEvidence', () => {
  describe('fixture-based tests', () => {
    fixtures.customerEvidence.forEach(({ name, input, expected }) => {
      test(name, () => {
        const result = scoreCustomerEvidence(input);
        expect(result.quotes).toBe(expected.quotesFound);
        expect(result.score).toBeGreaterThanOrEqual(expected.minScore);
      });
    });
  });

  describe('return structure', () => {
    test('returns expected structure with quotes', () => {
      const input = '"We reduced costs by 40% using this tool," said the CEO.';
      const result = scoreCustomerEvidence(input);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore');
      expect(result).toHaveProperty('quotes');
      expect(result).toHaveProperty('quotesWithMetrics');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('strengths');
    });

    test('returns expected structure without quotes', () => {
      const input = 'No quotes in this text.';
      const result = scoreCustomerEvidence(input);

      expect(result.quotes).toBe(0);
      expect(result.score).toBe(0);
      expect(result.issues).toContain('No customer quotes found');
    });
  });

  describe('scoring behavior', () => {
    test('scores higher for quotes with metrics', () => {
      const withMetrics = '"We reduced costs by 40% using this tool," said the CEO.';
      const withoutMetrics = '"We love this product and use it every day," said the CEO.';

      const resultWith = scoreCustomerEvidence(withMetrics);
      const resultWithout = scoreCustomerEvidence(withoutMetrics);

      expect(resultWith.score).toBeGreaterThan(resultWithout.score);
    });

    test('tracks quotes with metrics', () => {
      const input = '"We saw 40% improvement," said CEO.';
      const result = scoreCustomerEvidence(input);

      expect(result.quotesWithMetrics).toBe(1);
    });
  });

  describe('max score', () => {
    test('maxScore is 15', () => {
      const input = '"We reduced costs by 40% using this tool," said the CEO.';
      const result = scoreCustomerEvidence(input);
      expect(result.maxScore).toBe(15);
    });
  });
});
