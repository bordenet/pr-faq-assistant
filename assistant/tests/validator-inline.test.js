/**
 * Tests for validator-inline.js - PR-FAQ Assistant
 *
 * Comprehensive tests for all scoring functions:
 * - Structure and Hook (30 pts)
 * - Content Quality (35 pts)
 * - Professional Quality (20 pts)
 * - Customer Evidence (15 pts)
 */

import {
  validateDocument,
  validatePRFAQ,
  getScoreColor,
  getScoreLabel,
  scoreStructureAndHook,
  scoreContentQuality,
  scoreProfessionalQuality,
  scoreCustomerEvidence,
  extractQuotes,
  detectMetricsInText,
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
  extractTitle
} from '../../shared/js/validator-inline.js';

// ============================================================================
// Main Validation Function Tests
// ============================================================================

describe('validateDocument', () => {
  test('should return zero scores for empty content', () => {
    const result = validateDocument('');
    expect(result.totalScore).toBe(0);
    expect(result.structure.score).toBe(0);
    expect(result.content.score).toBe(0);
    expect(result.professional.score).toBe(0);
    expect(result.evidence.score).toBe(0);
  });

  test('should return zero scores for null content', () => {
    const result = validateDocument(null);
    expect(result.totalScore).toBe(0);
  });

  test('should return all scoring categories with correct maxScores', () => {
    const content = '# Test PR-FAQ\n' + 'Content. '.repeat(50);
    const result = validateDocument(content);
    expect(result.structure).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.professional).toBeDefined();
    expect(result.evidence).toBeDefined();
    // Verify maxScores sum to 100
    expect(result.structure.maxScore).toBe(30);
    expect(result.content.maxScore).toBe(35);
    expect(result.professional.maxScore).toBe(20);
    expect(result.evidence.maxScore).toBe(15);
  });

  test('should score a well-structured PR-FAQ highly', () => {
    const goodPRFAQ = `
# ACME Corp Launches Revolutionary Widget That Saves 50% Time

**FOR IMMEDIATE RELEASE**
**Seattle, WA - February 7, 2026**

ACME Corporation today announced the launch of Widget Pro, a revolutionary tool that reduces processing time by 50%.

"I was spending 4 hours a day on manual tasks. Now it takes just 2 hours," said Jane Smith, a customer at TechCo.

## Who Benefits
Small business owners and enterprise teams.

## What It Does
Widget Pro automates repetitive workflows.

## When Available
Available starting Q2 2026.

## Where To Get It
Available at acme.com and through partners.

## Why It Matters
Companies lose $50,000 annually to inefficient processes.

## FAQ

### What is Widget Pro?
Widget Pro is an automation tool designed for efficiency.

### How much does it cost?
Pricing starts at $99/month.

### Is there a trial?
Yes, a 30-day free trial is available.
    `;
    const result = validateDocument(goodPRFAQ);
    expect(result.totalScore).toBeGreaterThan(40);
    expect(result.structure.score).toBeGreaterThan(10);
  });

  test('should identify missing structure', () => {
    const noStructure = `
Just some random text without any proper press release structure.
No headlines, no quotes, no FAQ section.
    `.repeat(3);
    const result = validateDocument(noStructure);
    expect(result.issues.length).toBeGreaterThan(0);
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

// ============================================================================
// Structure and Hook Tests (30 pts)
// ============================================================================

describe('scoreStructureAndHook', () => {
  test('should detect headline quality', () => {
    const content = 'ACME Launches Revolutionary Product That Saves 50% Time';
    const result = scoreStructureAndHook(content, content);
    expect(result.score).toBeGreaterThan(0);
  });

  test('should detect newsworthy hook', () => {
    const content = `
FOR IMMEDIATE RELEASE
Seattle, WA - Today announced a breakthrough product.
    `.repeat(2);
    const result = scoreStructureAndHook(content, 'Breaking News');
    expect(result.score).toBeGreaterThan(0);
  });

  test('should return issues for weak structure', () => {
    const content = 'Just some text without structure.';
    const result = scoreStructureAndHook(content, 'test');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Content Quality Tests (35 pts)
// ============================================================================

describe('scoreContentQuality', () => {
  test('should detect Five Ws coverage', () => {
    const content = `
Who: Small business owners and enterprise teams.
What: An automation tool that streamlines workflows.
When: Available starting Q2 2026.
Where: Available at acme.com and authorized resellers.
Why: To reduce operational costs by 30%.
    `.repeat(2);
    const result = scoreContentQuality(content);
    expect(result.score).toBeGreaterThan(10);
  });

  test('should detect credibility signals', () => {
    const content = `
According to industry analyst Gartner, this market is growing 25% annually.
The company has served over 10,000 customers since 2020.
Revenue grew 150% year-over-year.
    `.repeat(2);
    const result = scoreContentQuality(content);
    expect(result.score).toBeGreaterThan(5);
  });

  test('should return issues for thin content', () => {
    const content = 'Very short content.';
    const result = scoreContentQuality(content);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Professional Quality Tests (20 pts)
// ============================================================================

describe('scoreProfessionalQuality', () => {
  test('should detect professional tone', () => {
    const content = `
The company announced today that it has completed development of a new platform.
This solution addresses key challenges in the market.
Management expects to achieve profitability by Q4.
    `.repeat(2);
    const result = scoreProfessionalQuality(content);
    expect(result.score).toBeGreaterThan(5);
  });

  test('should detect marketing fluff', () => {
    const content = `
This is a truly revolutionary, best-in-class, world-class solution.
We are extremely excited about this amazing, incredible opportunity.
    `.repeat(3);
    const result = scoreProfessionalQuality(content);
    expect(result.fluffWords).toBeDefined();
    expect(result.fluffWords.length).toBeGreaterThan(0);
  });

  test('should penalize excessive fluff', () => {
    const cleanContent = `
The company released a new product today.
It solves specific problems for customers.
Pricing starts at $99 per month.
    `.repeat(3);
    const fluffyContent = `
This is an amazing, revolutionary, game-changing product!
It's truly incredible and absolutely fantastic!
We are extremely excited about this wonderful opportunity!
    `.repeat(3);
    const cleanResult = scoreProfessionalQuality(cleanContent);
    const fluffyResult = scoreProfessionalQuality(fluffyContent);
    expect(cleanResult.score).toBeGreaterThanOrEqual(fluffyResult.score);
  });
});

// ============================================================================
// Customer Evidence Tests (15 pts)
// ============================================================================

describe('scoreCustomerEvidence', () => {
  test('should detect customer quotes', () => {
    const content = `
"This product saved us 40 hours per week," said Jane Smith, VP at TechCo.
"We saw a 50% reduction in processing time," reported John Doe, CEO of StartupX.
    `.repeat(2);
    const result = scoreCustomerEvidence(content);
    expect(result.score).toBeGreaterThan(5);
  });

  test('should detect quantitative metrics in quotes', () => {
    const content = `
"We achieved a 75% improvement in efficiency after implementing this solution," said the CEO.
"Average savings of $100,000 per year have been realized across our organization," reported the CFO.
    `.repeat(2);
    const result = scoreCustomerEvidence(content);
    expect(result.score).toBeGreaterThan(0);
  });

  test('should return issues for missing evidence', () => {
    const content = `
This is a great product.
Everyone should use it.
    `.repeat(3);
    const result = scoreCustomerEvidence(content);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('extractQuotes', () => {
  test('should extract quotes from content', () => {
    const content = '"This is a test quote that is long enough to count." Another text.';
    const quotes = extractQuotes(content);
    expect(quotes.length).toBeGreaterThan(0);
  });

  test('should filter out short quotes', () => {
    const content = '"Short" and "This is a longer quote that should be extracted."';
    const quotes = extractQuotes(content);
    expect(quotes.every(q => q.length > 20)).toBe(true);
  });
});

describe('detectMetricsInText', () => {
  test('should detect percentages', () => {
    const content = 'We achieved 50% growth and 75% efficiency.';
    const result = detectMetricsInText(content);
    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.types).toContain('percentage');
  });

  test('should detect ratios', () => {
    const content = 'Performance improved 10x and the ratio is 5:1.';
    const result = detectMetricsInText(content);
    expect(result.types).toContain('ratio');
  });
});

describe('analyzeHeadlineQuality', () => {
  test('should score newsworthy headlines', () => {
    const result = analyzeHeadlineQuality('ACME Launches Revolutionary Widget That Saves 50% Time');
    expect(result.score).toBeGreaterThan(0);
  });

  test('should detect weak headlines', () => {
    const result = analyzeHeadlineQuality('test');
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('analyzeFiveWs', () => {
  test('should score content with Five Ws', () => {
    const content = `
ACME Corp announced today a revolutionary new product.
Seattle, WA - The company launches a new platform to help customers.
    `.repeat(2);
    const result = analyzeFiveWs(content);
    expect(result.score).toBeGreaterThan(0);
    expect(result.maxScore).toBe(15);
  });

  test('should add strengths for detected elements', () => {
    const content = `
ACME Corp announced today a revolutionary new platform.
Seattle, WA - The company launches globally to help improve efficiency.
    `.repeat(2);
    const result = analyzeFiveWs(content);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  test('should add issues for missing elements', () => {
    const content = 'Just some generic content without press release structure.';
    const result = analyzeFiveWs(content);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('detectFluffWords', () => {
  test('should detect common fluff words', () => {
    const content = 'This revolutionary, best-in-class, world-class product is amazing.';
    const result = detectFluffWords(content);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('should return empty array for clean content', () => {
    const content = 'The product reduces processing time by 50%.';
    const result = detectFluffWords(content);
    expect(result.length).toBe(0);
  });
});

describe('extractTitle', () => {
  test('should extract markdown title', () => {
    const content = '# This is the Title\n\nSome content here.';
    const title = extractTitle(content);
    expect(title).toBe('This is the Title');
  });

  test('should return empty for no title', () => {
    const content = 'Just content without a title.';
    const title = extractTitle(content);
    expect(title).toBe('');
  });
});

describe('stripMarkdown', () => {
  test('should strip markdown formatting', () => {
    const content = '# Title\n\n**Bold** and *italic* text.\n\n- List item';
    const plain = stripMarkdown(content);
    expect(plain).not.toContain('#');
    expect(plain).not.toContain('**');
    expect(plain).not.toContain('*');
  });
});

// ============================================================================
// Score Color and Label Tests
// ============================================================================

describe('getScoreColor', () => {
  test('should return green for scores >= 70', () => {
    expect(getScoreColor(70)).toBe('green');
    expect(getScoreColor(85)).toBe('green');
    expect(getScoreColor(100)).toBe('green');
  });

  test('should return yellow for scores 50-69', () => {
    expect(getScoreColor(50)).toBe('yellow');
    expect(getScoreColor(65)).toBe('yellow');
  });

  test('should return orange for scores 30-49', () => {
    expect(getScoreColor(30)).toBe('orange');
    expect(getScoreColor(45)).toBe('orange');
  });

  test('should return red for scores < 30', () => {
    expect(getScoreColor(0)).toBe('red');
    expect(getScoreColor(29)).toBe('red');
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
