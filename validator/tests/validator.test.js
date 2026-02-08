/**
 * Validator tests - Comprehensive scoring tests
 * Tests all exported functions: extractQuotes, detectMetrics, scoreQuote, scoreCustomerEvidence
 */

import {
  extractQuotes,
  detectMetricsInText,
  scoreQuote,
  scoreCustomerEvidence,
  validatePRFAQ,
  scoreStructureAndHook,
  scoreContentQuality,
  scoreProfessionalQuality,
  analyzeHeadlineQuality,
  analyzeNewsworthyHook,
  analyzeFiveWs,
  analyzeStructure,
  analyzeCredibility,
  analyzeToneAndReadability,
  analyzeMarketingFluff,
  detectFluffWords,
  extractPressRelease,
  stripMarkdown,
  extractTitle,
  extractFAQs,
  parseFAQQuestions,
  checkHardQuestions,
  scoreFAQQuality
} from '../js/validator.js';
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
    test('maxScore is 10 (updated from 15)', () => {
      const input = '"We reduced costs by 40% using this tool," said the CEO.';
      const result = scoreCustomerEvidence(input);
      expect(result.maxScore).toBe(10);
    });
  });
});

// ============================================================================
// validatePRFAQ tests
// ============================================================================
describe('validatePRFAQ', () => {
  test('returns zero score for empty input', () => {
    const result = validatePRFAQ('');
    expect(result.totalScore).toBe(0);
  });

  test('returns zero score for null', () => {
    const result = validatePRFAQ(null);
    expect(result.totalScore).toBe(0);
  });

  test('returns zero score for undefined', () => {
    const result = validatePRFAQ(undefined);
    expect(result.totalScore).toBe(0);
  });

  test('scores a well-structured PR-FAQ', () => {
    const prfaq = `
# ACME Corp Launches Revolutionary Widget

**SAN FRANCISCO, CA - January 15, 2024** - ACME Corporation today announced the launch of Widget Pro, a groundbreaking solution that reduces manufacturing costs by 40%.

"This product has transformed our operations," said Jane Smith, CEO of TechCorp. "We've seen a 50% improvement in efficiency within just 30 days."

## The Challenge

Manufacturers have struggled with inefficient processes that waste $2.5 billion annually. Current solutions are complex and expensive.

## The Solution

Widget Pro uses AI-powered automation to streamline workflows. Key features include:
- Real-time monitoring with 99.9% accuracy
- Automated reporting that saves 10 hours per week
- Integration with existing systems

## Customer Results

Beta customers reported:
- 40% reduction in processing time
- $500,000 annual savings
- 25% improvement in quality metrics

## FAQ

**Q: How does Widget Pro work?**
A: Widget Pro uses machine learning algorithms to analyze and optimize manufacturing processes.

**Q: What is the pricing?**
A: Widget Pro starts at $999/month with enterprise plans available.

**Q: When is it available?**
A: Widget Pro is available now for all customers.

For more information, visit www.acme-widget.com
`;
    const result = validatePRFAQ(prfaq);
    expect(result.totalScore).toBeGreaterThan(0); // Updated - score depends on FAQ sections
    expect(result.structure).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.professional).toBeDefined();
    expect(result.evidence).toBeDefined();
    expect(result.faqQuality).toBeDefined(); // New FAQ dimension
  });

  test('returns issues for poor quality content', () => {
    const poorPrfaq = 'This is just a short paragraph without proper structure.';
    const result = validatePRFAQ(poorPrfaq);
    expect(result.totalScore).toBeLessThan(50); // Updated threshold
  });

  test('includes faqQuality dimension with correct maxScore', () => {
    const prfaq = `
## Press Release

ACME Corp Launches Widget Pro

## External FAQ

**Q: What is Widget Pro?**
A: Widget Pro is a revolutionary product.

**Q: How does it work?**
A: It uses advanced technology.

**Q: When is it available?**
A: It launches next month.

**Q: How much does it cost?**
A: Pricing starts at $99.

**Q: Where can I buy it?**
A: Through our online store.

## Internal FAQ

**Q: What are the main risks?**
A: Technical integration challenges and market timing.

**Q: Is this a one-way or two-way door decision?**
A: This is a two-way door - we can pivot if needed.

**Q: What is the opportunity cost?**
A: We are prioritizing this over Feature Y.

**Q: What is the budget?**
A: $1M development budget.

**Q: What is the timeline?**
A: 6 months to launch.
`;
    const result = validatePRFAQ(prfaq);
    expect(result.faqQuality).toBeDefined();
    expect(result.faqQuality.maxScore).toBe(35);
    expect(result.faqQuality.hardQuestions).toBeDefined();
  });
});

// ============================================================================
// scoreStructureAndHook tests
// ============================================================================
describe('scoreStructureAndHook', () => {
  test('scores content with good headline', () => {
    const content = `
ACME Corp Launches Revolutionary Product

SAN FRANCISCO - ACME today announced a major breakthrough.
The product will transform the industry by reducing costs 50%.
    `.trim();
    const result = scoreStructureAndHook(content, 'ACME Corp Launches Revolutionary Product');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(20); // Updated from 30
  });

  test('returns zero for empty content', () => {
    const result = scoreStructureAndHook('', '');
    expect(result.score).toBe(0);
  });
});

// ============================================================================
// scoreContentQuality tests
// ============================================================================
describe('scoreContentQuality', () => {
  test('scores content with metrics', () => {
    const content = `
Our solution delivers 40% cost reduction.
Customers see 2x improvement in efficiency.
Annual savings of $500,000 are typical.
    `.trim();
    const result = scoreContentQuality(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(20); // Updated from 35
  });

  test('returns low score for empty content', () => {
    const result = scoreContentQuality('');
    expect(result.score).toBeLessThanOrEqual(result.maxScore);
  });
});

// ============================================================================
// scoreProfessionalQuality tests
// ============================================================================
describe('scoreProfessionalQuality', () => {
  test('scores professional content', () => {
    const content = `
ACME Corporation announced today the launch of a new product.
The solution was developed in partnership with industry leaders.
Independent testing confirms the results meet all standards.
    `.trim();
    const result = scoreProfessionalQuality(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(15); // Updated from 20
  });

  test('penalizes marketing fluff', () => {
    const fluffyContent = `
This revolutionary groundbreaking amazing solution will transform
the industry with its game-changing innovative disruptive approach.
    `.trim();
    const result = scoreProfessionalQuality(fluffyContent);
    expect(result.issues).toBeDefined();
  });
});

// ============================================================================
// analyzeHeadlineQuality tests
// ============================================================================
describe('analyzeHeadlineQuality', () => {
  test('analyzes good headline', () => {
    const result = analyzeHeadlineQuality('ACME Corp Launches New Product That Reduces Costs 40%');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(12); // 10 base + 2 for mechanism detection
  });

  test('scores weak headlines low', () => {
    const result = analyzeHeadlineQuality('test');
    expect(result.score).toBeLessThanOrEqual(result.maxScore);
  });
});

// ============================================================================
// analyzeNewsworthyHook tests
// ============================================================================
describe('analyzeNewsworthyHook', () => {
  test('identifies newsworthy content', () => {
    const content = `
ACME Corporation announced today the launch of Widget Pro.
This marks a significant milestone for the company.
    `.trim();
    const result = analyzeNewsworthyHook(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(15);
  });
});

// ============================================================================
// analyzeFiveWs tests
// ============================================================================
describe('analyzeFiveWs', () => {
  test('detects five Ws in content', () => {
    const content = `
ACME Corporation announced today from San Francisco the launch
of Widget Pro, which will help manufacturers reduce costs.
The product is available now through authorized dealers.
    `.trim();
    const result = analyzeFiveWs(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(15);
  });
});

// ============================================================================
// analyzeStructure tests
// ============================================================================
describe('analyzeStructure', () => {
  test('scores structured content', () => {
    const content = `
# Headline

## Introduction
Content here.

## Features
- Feature 1
- Feature 2

## FAQ
Q: Question?
A: Answer.
    `.trim();
    const result = analyzeStructure(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(10);
  });
});

// ============================================================================
// analyzeCredibility tests
// ============================================================================
describe('analyzeCredibility', () => {
  test('scores content with sources', () => {
    const content = `
According to Gartner research, the market is growing 20% annually.
"This product works," said Dr. Jane Smith, PhD at MIT.
Independent studies confirm these results.
    `.trim();
    const result = analyzeCredibility(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(10);
  });
});

// ============================================================================
// analyzeToneAndReadability tests
// ============================================================================
describe('analyzeToneAndReadability', () => {
  test('scores professional tone', () => {
    const content = `
The company announced today the availability of the new product.
Customers can expect improved performance and reduced costs.
    `.trim();
    const result = analyzeToneAndReadability(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBe(10);
  });
});

// ============================================================================
// analyzeMarketingFluff tests
// ============================================================================
describe('analyzeMarketingFluff', () => {
  test('detects marketing fluff words', () => {
    const content = `
This revolutionary groundbreaking solution is a game-changer.
Our disruptive innovative approach transforms everything.
    `.trim();
    const result = analyzeMarketingFluff(content);
    expect(result.score).toBeLessThanOrEqual(result.maxScore);
    expect(result.issues).toBeDefined();
  });

  test('scores clean content higher', () => {
    const content = `
The company announced the product launch.
Customers report improved performance metrics.
    `.trim();
    const result = analyzeMarketingFluff(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// detectFluffWords tests
// ============================================================================
describe('detectFluffWords', () => {
  test('detects fluff words', () => {
    const content = 'This revolutionary game-changing solution is groundbreaking.';
    const result = detectFluffWords(content);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns empty for clean content', () => {
    const content = 'The company launched a new product.';
    const result = detectFluffWords(content);
    expect(result.length).toBe(0);
  });
});

// ============================================================================
// extractPressRelease tests
// ============================================================================
describe('extractPressRelease', () => {
  test('extracts press release content', () => {
    const markdown = `# Press Release

ACME Corp announces new product.

## FAQ
Q: When?
A: Now.
`;
    const result = extractPressRelease(markdown);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

// ============================================================================
// stripMarkdown tests
// ============================================================================
describe('stripMarkdown', () => {
  test('removes markdown formatting', () => {
    const markdown = '# Headline\n\n**Bold** and *italic* text.';
    const result = stripMarkdown(markdown);
    expect(result).not.toContain('#');
    expect(result).not.toContain('**');
    expect(result).not.toContain('*');
  });

  test('handles empty input', () => {
    const result = stripMarkdown('');
    expect(result).toBe('');
  });
});

// ============================================================================
// extractTitle tests
// ============================================================================
describe('extractTitle', () => {
  test('extracts title from markdown', () => {
    const markdown = '# My Great Title\n\nSome content here.';
    const result = extractTitle(markdown);
    expect(result).toBe('My Great Title');
  });

  test('returns empty for no title', () => {
    const markdown = 'Just some content without a title.';
    const result = extractTitle(markdown);
    expect(result).toBe('');
  });
});
