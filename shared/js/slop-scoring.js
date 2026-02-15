/**
 * AI Slop Scoring Module
 * Score calculation and penalty functions for AI detection
 * @module slop-scoring
 */

import { detectAISlop, detectStructuralPatterns } from './slop-detection.js';
import { analyzeSentenceVariance, analyzeTypeTokenRatio } from './slop-stylometric.js';

/**
 * Calculate comprehensive AI slop score
 * @param {string} text - Text to analyze
 * @returns {Object} Slop score and breakdown
 */
export function calculateSlopScore(text) {
  const slop = detectAISlop(text);
  const sentenceAnalysis = analyzeSentenceVariance(text);
  const ttrAnalysis = analyzeTypeTokenRatio(text);

  // Lexical score: 2 points per pattern, max 40
  const lexicalPatternCount =
    slop.genericBoosters.length +
    slop.buzzwords.length +
    slop.fillerPhrases.length +
    slop.hedgePatterns.length +
    slop.sycophantic.length +
    slop.transitionalFiller.length;
  const lexicalScore = Math.min(40, lexicalPatternCount * 2 + slop.emDashes);

  // Structural score: 5 points per pattern, max 25
  const structuralScore = Math.min(25, slop.structural.count * 5);

  // Stylometric score: 5 points per flag, max 15
  let stylometricFlags = 0;
  const stylometricIssues = [];

  if (sentenceAnalysis.flag) {
    stylometricFlags++;
    stylometricIssues.push(sentenceAnalysis.reason);
  }
  if (ttrAnalysis.flag) {
    stylometricFlags++;
    stylometricIssues.push(ttrAnalysis.reason);
  }

  const stylometricScore = Math.min(15, stylometricFlags * 5);

  // Total slop score (0-100, higher = more slop)
  const totalScore = lexicalScore + structuralScore + stylometricScore;

  // Categorize severity
  let severity;
  if (totalScore <= 10) severity = 'clean';
  else if (totalScore <= 25) severity = 'light';
  else if (totalScore <= 45) severity = 'moderate';
  else if (totalScore <= 65) severity = 'heavy';
  else severity = 'severe';

  // Build top offenders list
  const topOffenders = [];

  // Add most impactful patterns first
  slop.fillerPhrases.slice(0, 3).forEach(p =>
    topOffenders.push({ pattern: p, category: 'filler-phrase' }));
  slop.genericBoosters.slice(0, 3).forEach(p =>
    topOffenders.push({ pattern: p, category: 'generic-booster' }));
  slop.buzzwords.slice(0, 3).forEach(p =>
    topOffenders.push({ pattern: p, category: 'buzzword' }));
  slop.sycophantic.slice(0, 2).forEach(p =>
    topOffenders.push({ pattern: p, category: 'sycophantic' }));

  if (slop.emDashes > 0) {
    topOffenders.push({ pattern: `${slop.emDashes} em-dash(es)`, category: 'em-dash' });
  }

  slop.structural.patterns.slice(0, 2).forEach(p =>
    topOffenders.push({ pattern: p, category: 'structural' }));

  return {
    score: totalScore,
    maxScore: 80, // Practical max (40 + 25 + 15)
    severity,
    breakdown: {
      lexical: {
        score: lexicalScore,
        maxScore: 40,
        patterns: lexicalPatternCount,
        emDashes: slop.emDashes
      },
      structural: {
        score: structuralScore,
        maxScore: 25,
        patterns: slop.structural.patterns
      },
      stylometric: {
        score: stylometricScore,
        maxScore: 15,
        issues: stylometricIssues,
        sentenceVariance: sentenceAnalysis.stdDev,
        ttr: ttrAnalysis.ttr
      }
    },
    topOffenders: topOffenders.slice(0, 10),
    details: slop
  };
}

/**
 * Get slop detection penalty for PRD scoring
 * Higher slop = higher penalty (deducted from clarity score)
 * @param {string} text - PRD content
 * @returns {Object} Penalty and issues for scoring
 */
export function getSlopPenalty(text) {
  const slopResult = calculateSlopScore(text);

  // Convert slop score to penalty (0-8 points deducted)
  // This replaces/enhances the existing vague language penalty
  // Thresholds calibrated for PRDs where precision is critical
  let penalty = 0;
  const issues = [];

  // Count the most problematic patterns for PRDs
  const patternCount = slopResult.details.totalPatterns;

  if (slopResult.score >= 40 || patternCount >= 10) {
    penalty = 8; // Severe slop
    issues.push(`Severe AI slop detected (${patternCount} patterns): substantial rewrite needed`);
  } else if (slopResult.score >= 25 || patternCount >= 6) {
    penalty = 6; // Heavy slop
    issues.push(`Heavy AI slop detected (${patternCount} patterns): significant editing needed`);
  } else if (slopResult.score >= 12 || patternCount >= 3) {
    penalty = 4; // Moderate slop - any 3+ buzzwords/vague terms is problematic in PRDs
    issues.push(`Moderate AI slop detected (${patternCount} patterns): editing recommended`);
  } else if (slopResult.score >= 4 || patternCount >= 1) {
    penalty = 2; // Light slop - even 1-2 vague terms should be flagged
    issues.push(`Light AI patterns detected (${patternCount} patterns)`);
  }

  // Add specific examples
  if (slopResult.topOffenders.length > 0) {
    const examples = slopResult.topOffenders.slice(0, 3)
      .map(o => `"${o.pattern}"`)
      .join(', ');
    issues.push(`Examples: ${examples}`);
  }

  return {
    penalty,
    issues,
    slopScore: slopResult.score,
    severity: slopResult.severity,
    details: slopResult
  };
}

