/**
 * AI Slop Detection Tests
 * Tests for the comprehensive AI slop detection module
 */

import {
  detectEmDashes,
  detectPatterns,
  detectAISlop,
  detectStructuralPatterns,
  analyzeSentenceVariance,
  analyzeTypeTokenRatio,
  calculateSlopScore,
  getSlopPenalty,
  GENERIC_BOOSTERS,
  BUZZWORDS,
  FILLER_PHRASES,
  HEDGE_PATTERNS
} from '../js/slop-detection.js';

// ============================================================================
// detectEmDashes tests
// ============================================================================
describe('detectEmDashes', () => {
  test('detects em-dashes in text', () => {
    const text = 'This is a test — with an em-dash — and another one.';
    expect(detectEmDashes(text)).toBe(2);
  });

  test('returns 0 when no em-dashes', () => {
    const text = 'This is a test with regular dashes - like this.';
    expect(detectEmDashes(text)).toBe(0);
  });

  test('distinguishes em-dash from regular dash', () => {
    const text = 'Mix of — em-dash and - regular dash.';
    expect(detectEmDashes(text)).toBe(1);
  });
});

// ============================================================================
// detectPatterns tests
// ============================================================================
describe('detectPatterns', () => {
  test('detects single-word patterns', () => {
    const text = 'This is incredibly robust and powerful.';
    const patterns = detectPatterns(text, ['incredibly', 'robust', 'powerful']);
    expect(patterns).toContain('incredibly');
    expect(patterns).toContain('robust');
    expect(patterns).toContain('powerful');
  });

  test('detects phrase patterns', () => {
    const text = "It's important to note that this is easy to use.";
    const patterns = detectPatterns(text, ["it's important to note that", 'easy to use']);
    expect(patterns).toContain("it's important to note that");
    expect(patterns).toContain('easy to use');
  });

  test('returns empty array when no patterns match', () => {
    const text = 'Response time must be under 200ms with 99.9% uptime.';
    const patterns = detectPatterns(text, ['incredibly', 'robust', 'seamless']);
    expect(patterns).toHaveLength(0);
  });

  test('is case insensitive', () => {
    const text = 'This is INCREDIBLY important.';
    const patterns = detectPatterns(text, ['incredibly']);
    expect(patterns).toContain('incredibly');
  });
});

// ============================================================================
// detectAISlop tests
// ============================================================================
describe('detectAISlop', () => {
  test('detects multiple categories of slop', () => {
    const text = `
      It's important to note that this incredibly robust system leverages
      cutting-edge technology. Let's explore the key features. Furthermore,
      the solution is seamless and powerful — truly transformative.
    `;
    const result = detectAISlop(text);

    expect(result.genericBoosters.length).toBeGreaterThan(0);
    expect(result.buzzwords.length).toBeGreaterThan(0);
    expect(result.fillerPhrases.length).toBeGreaterThan(0);
    expect(result.transitionalFiller.length).toBeGreaterThan(0);
    expect(result.emDashes).toBeGreaterThan(0);
    expect(result.totalPatterns).toBeGreaterThan(5);
  });

  test('returns zero counts for clean text', () => {
    const text = 'Response time must be under 200ms. Support 10000 concurrent users.';
    const result = detectAISlop(text);

    expect(result.genericBoosters).toHaveLength(0);
    expect(result.fillerPhrases).toHaveLength(0);
    expect(result.sycophantic).toHaveLength(0);
    expect(result.emDashes).toBe(0);
  });
});

// ============================================================================
// detectStructuralPatterns tests
// ============================================================================
describe('detectStructuralPatterns', () => {
  test('detects formulaic introduction', () => {
    const text = "In today's fast-paced world, we need to be agile. This document will outline our approach.";
    const result = detectStructuralPatterns(text);

    expect(result.patterns).toContain('formulaic-introduction');
  });

  test('detects over-signposting', () => {
    const text = 'As mentioned earlier, we need to consider this. In this section, we will explore more.';
    const result = detectStructuralPatterns(text);

    expect(result.patterns.some(p => p.includes('over-signposting'))).toBe(true);
  });

  test('returns empty for clean structure', () => {
    const text = '## Purpose\nThis PRD defines requirements.\n\n## Requirements\n- Feature A\n- Feature B';
    const result = detectStructuralPatterns(text);

    expect(result.count).toBe(0);
  });
});

// ============================================================================
// analyzeSentenceVariance tests
// ============================================================================
describe('analyzeSentenceVariance', () => {
  test('flags uniform sentence lengths', () => {
    const text = 'This is a test. Here is another. And one more. Plus this too. Final test here.';
    const result = analyzeSentenceVariance(text);

    expect(result.flag).toBe(true);
    expect(result.stdDev).toBeLessThan(8);
  });

  test('does not flag varied sentence lengths', () => {
    const text = 'Short. This is a medium length sentence with more words. And here is a much longer sentence that contains many more words and provides significant variation in the document structure overall.';
    const result = analyzeSentenceVariance(text);

    // Varied lengths should have higher stdDev
    expect(result.stdDev).toBeGreaterThan(5);
  });

  test('handles too few sentences', () => {
    const text = 'Just one sentence.';
    const result = analyzeSentenceVariance(text);

    expect(result.variance).toBeNull();
  });
});

// ============================================================================
// analyzeTypeTokenRatio tests
// ============================================================================
describe('analyzeTypeTokenRatio', () => {
  test('calculates TTR for sufficient text', () => {
    // Generate text with 50+ words
    const words = [];
    for (let i = 0; i < 60; i++) {
      words.push(['system', 'user', 'data', 'response', 'time', 'request'][i % 6]);
    }
    const text = words.join(' ');
    const result = analyzeTypeTokenRatio(text);

    expect(result.ttr).not.toBeNull();
    expect(typeof result.ttr).toBe('number');
  });

  test('returns null for insufficient text', () => {
    const text = 'Too short.';
    const result = analyzeTypeTokenRatio(text);

    expect(result.ttr).toBeNull();
  });
});

// ============================================================================
// calculateSlopScore tests
// ============================================================================
describe('calculateSlopScore', () => {
  test('returns clean score for good text', () => {
    const text = 'Response time must be under 200ms. Support 10000 concurrent users. Uptime target is 99.9%.';
    const result = calculateSlopScore(text);

    expect(result.severity).toBe('clean');
    expect(result.score).toBeLessThan(10);
  });

  test('returns severe score for sloppy text', () => {
    const text = `
      It's important to note that this incredibly robust and powerful solution
      leverages cutting-edge, state-of-the-art technology. Furthermore, the
      seamless integration enables transformative outcomes. Let's explore the
      comprehensive features. In today's world, we need innovative solutions —
      and this is truly revolutionary.
    `;
    const result = calculateSlopScore(text);

    expect(result.score).toBeGreaterThan(20);
    expect(result.topOffenders.length).toBeGreaterThan(0);
  });

  test('provides breakdown by category', () => {
    const text = 'This incredibly robust system leverages synergy.';
    const result = calculateSlopScore(text);

    expect(result.breakdown).toHaveProperty('lexical');
    expect(result.breakdown).toHaveProperty('structural');
    expect(result.breakdown).toHaveProperty('stylometric');
  });
});

// ============================================================================
// getSlopPenalty tests
// ============================================================================
describe('getSlopPenalty', () => {
  test('returns zero penalty for clean PRD text', () => {
    const text = 'Response time must be under 200ms. API supports 10000 concurrent requests per second.';
    const result = getSlopPenalty(text);

    expect(result.penalty).toBe(0);
    expect(result.slopScore).toBeLessThan(4);
  });

  test('returns penalty for vague PRD text', () => {
    const text = 'The system needs to be fast, easy to use, and scalable.';
    const result = getSlopPenalty(text);

    expect(result.penalty).toBeGreaterThan(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  test('returns high penalty for very sloppy PRD text', () => {
    const text = `
      This incredibly robust and seamless solution leverages cutting-edge
      technology to enable powerful, transformative outcomes. It's important
      to note that the comprehensive system is truly innovative and scalable.
    `;
    const result = getSlopPenalty(text);

    expect(result.penalty).toBeGreaterThanOrEqual(4);
    expect(result.severity).not.toBe('clean');
  });

  test('provides examples in issues', () => {
    const text = 'The system is robust, seamless, and powerful.';
    const result = getSlopPenalty(text);

    expect(result.issues.some(i => i.includes('Examples:'))).toBe(true);
  });
});

// ============================================================================
// Pattern list completeness tests
// ============================================================================
describe('Pattern lists', () => {
  test('GENERIC_BOOSTERS includes key AI markers', () => {
    expect(GENERIC_BOOSTERS).toContain('delve');
    expect(GENERIC_BOOSTERS).toContain('incredibly');
    expect(GENERIC_BOOSTERS).toContain('truly');
  });

  test('BUZZWORDS includes key vague terms', () => {
    expect(BUZZWORDS).toContain('robust');
    expect(BUZZWORDS).toContain('seamless');
    expect(BUZZWORDS).toContain('leverage');
    expect(BUZZWORDS).toContain('scalable');
    expect(BUZZWORDS).toContain('easy to use');
  });

  test('FILLER_PHRASES includes common AI phrases', () => {
    expect(FILLER_PHRASES).toContain("it's important to note that");
    expect(FILLER_PHRASES).toContain("let's explore");
    expect(FILLER_PHRASES).toContain("in order to");
  });

  test('HEDGE_PATTERNS includes weasel words', () => {
    expect(HEDGE_PATTERNS).toContain('arguably');
    expect(HEDGE_PATTERNS).toContain('potentially');
    expect(HEDGE_PATTERNS).toContain('seems to');
  });
});
