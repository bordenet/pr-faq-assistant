/**
 * Stylometric Analysis Module
 * Statistical text analysis for AI detection
 * @module slop-stylometric
 */

/**
 * Calculate sentence length standard deviation
 * @param {string} text - Text to analyze
 * @returns {Object} Sentence statistics
 */
export function analyzeSentenceVariance(text) {
  // Split into sentences (period, question, exclamation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length < 3) {
    return { variance: null, flag: false, reason: 'Too few sentences' };
  }

  // Count words in each sentence
  const lengths = sentences.map(s => s.trim().split(/\s+/).filter(w => w.length > 0).length);

  // Calculate mean and standard deviation
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Flag if too uniform (AI tends to produce uniform sentence lengths)
  const flag = stdDev < 8.0; // Research suggests human writing has σ > 15

  return {
    sentenceCount: sentences.length,
    meanLength: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    flag,
    reason: flag ? `Low sentence variance (σ=${stdDev.toFixed(1)}, target >8)` : null
  };
}

/**
 * Calculate Type-Token Ratio (vocabulary diversity)
 * @param {string} text - Text to analyze
 * @returns {Object} TTR statistics
 */
export function analyzeTypeTokenRatio(text) {
  // Normalize: lowercase, remove punctuation
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  if (words.length < 50) {
    return { ttr: null, flag: false, reason: 'Too few words' };
  }

  // Calculate TTR in 100-word windows
  const windowSize = 100;
  const ttrs = [];

  for (let i = 0; i + windowSize <= words.length; i += windowSize) {
    const window = words.slice(i, i + windowSize);
    const unique = new Set(window).size;
    ttrs.push(unique / windowSize);
  }

  if (ttrs.length === 0) {
    // Fallback for short text
    const unique = new Set(words).size;
    const ttr = unique / words.length;
    return {
      ttr: Math.round(ttr * 100) / 100,
      flag: ttr < 0.45,
      reason: ttr < 0.45 ? `Low vocabulary diversity (TTR=${ttr.toFixed(2)})` : null
    };
  }

  const avgTTR = ttrs.reduce((a, b) => a + b, 0) / ttrs.length;

  // Flag if too low (limited vocabulary) or suspiciously consistent
  const flag = avgTTR < 0.45;

  return {
    ttr: Math.round(avgTTR * 100) / 100,
    wordCount: words.length,
    flag,
    reason: flag ? `Low vocabulary diversity (TTR=${avgTTR.toFixed(2)}, target >0.45)` : null
  };
}

