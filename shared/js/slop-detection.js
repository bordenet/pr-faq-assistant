/**
 * AI Slop Detection Module
 *
 * Comprehensive detection of AI-generated content patterns.
 * Based on the detecting-ai-slop skill with PRD-specific enhancements.
 *
 * Detection Dimensions:
 * 1. Lexical (40 pts max) - Pattern matching for AI-typical phrases
 * 2. Structural (25 pts max) - Document structure patterns
 * 3. Semantic (20 pts max) - Hollow claims and absent constraints
 * 4. Stylometric (15 pts max) - Statistical text analysis
 */

// Re-export patterns for backward compatibility
export {
  GENERIC_BOOSTERS,
  BUZZWORDS,
  FILLER_PHRASES,
  HEDGE_PATTERNS,
  SYCOPHANTIC_PHRASES,
  TRANSITIONAL_FILLER,
  STRUCTURAL_PATTERNS
} from './slop-patterns.js';

// Import patterns for internal use
import {
  GENERIC_BOOSTERS,
  BUZZWORDS,
  FILLER_PHRASES,
  HEDGE_PATTERNS,
  SYCOPHANTIC_PHRASES,
  TRANSITIONAL_FILLER,
  STRUCTURAL_PATTERNS
} from './slop-patterns.js';

// Re-export stylometric functions for backward compatibility
export { analyzeSentenceVariance, analyzeTypeTokenRatio } from './slop-stylometric.js';

// Import stylometric functions for internal use
import { analyzeSentenceVariance, analyzeTypeTokenRatio } from './slop-stylometric.js';

// Re-export scoring functions for backward compatibility
export { calculateSlopScore, getSlopPenalty } from './slop-scoring.js';

/**
 * Detect em-dashes in text (classic AI marker)
 * @param {string} text - Text to analyze
 * @returns {number} Count of em-dashes found
 */
export function detectEmDashes(text) {
  return (text.match(/—/g) || []).length;
}

/**
 * Detect patterns in text using word boundary matching
 * @param {string} text - Text to analyze
 * @param {string[]} patterns - Array of patterns to find
 * @returns {string[]} Patterns found in text
 */
export function detectPatterns(text, patterns) {
  const found = [];
  const lowerText = text.toLowerCase();

  for (const pattern of patterns) {
    // Use includes for phrase patterns, regex for single words
    if (pattern.includes(' ')) {
      if (lowerText.includes(pattern.toLowerCase())) {
        found.push(pattern);
      }
    } else {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(text)) {
        found.push(pattern);
      }
    }
  }

  return found;
}

/**
 * Comprehensive AI slop detection across all lexical categories
 * @param {string} text - Text to analyze
 * @returns {Object} Detection results by category
 */
export function detectAISlop(text) {
  const results = {
    genericBoosters: detectPatterns(text, GENERIC_BOOSTERS),
    buzzwords: detectPatterns(text, BUZZWORDS),
    fillerPhrases: detectPatterns(text, FILLER_PHRASES),
    hedgePatterns: detectPatterns(text, HEDGE_PATTERNS),
    sycophantic: detectPatterns(text, SYCOPHANTIC_PHRASES),
    transitionalFiller: detectPatterns(text, TRANSITIONAL_FILLER),
    emDashes: detectEmDashes(text),
    structural: detectStructuralPatterns(text)
  };

  results.totalPatterns =
    results.genericBoosters.length +
    results.buzzwords.length +
    results.fillerPhrases.length +
    results.hedgePatterns.length +
    results.sycophantic.length +
    results.transitionalFiller.length +
    results.emDashes +
    results.structural.count;

  return results;
}

/**
 * Detect structural AI patterns
 * @param {string} text - Text to analyze
 * @returns {Object} Structural pattern results
 */
export function detectStructuralPatterns(text) {
  const found = [];

  // Check for formulaic intro
  if (STRUCTURAL_PATTERNS.formulaicIntro.test(text)) {
    found.push('formulaic-introduction');
  }

  // Check for over-signposting
  const lowerText = text.toLowerCase();
  for (const phrase of STRUCTURAL_PATTERNS.overSignposting) {
    if (lowerText.includes(phrase)) {
      found.push(`over-signposting: "${phrase}"`);
      break; // Count once
    }
  }

  // Check for template sections
  if (STRUCTURAL_PATTERNS.templateSections.test(text)) {
    found.push('template-section-progression');
  }

  // Check for symmetric coverage
  const symmetricMatches = text.match(STRUCTURAL_PATTERNS.symmetricCoverage) || [];
  if (symmetricMatches.length > 0) {
    found.push('symmetric-coverage');
  }

  return {
    patterns: found,
    count: found.length
  };
}


