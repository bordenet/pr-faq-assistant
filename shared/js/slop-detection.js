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

// ============================================================================
// Lexical Patterns - 150+ patterns across 6 categories
// ============================================================================

/**
 * Generic boosters - intensifiers that add no meaning
 * Delete or replace with specific metrics
 */
export const GENERIC_BOOSTERS = [
  'incredibly', 'extremely', 'highly', 'very', 'truly', 'absolutely',
  'definitely', 'really', 'quite', 'remarkably', 'exceptionally',
  'particularly', 'especially', 'significantly', 'substantially',
  'considerably', 'dramatically', 'tremendously', 'immensely', 'profoundly',
  // Classic AI markers
  'delve', 'tapestry', 'multifaceted', 'myriad', 'plethora'
];

/**
 * Buzzwords - replace with plain language or specific descriptions
 * Includes PRD-specific vague qualifiers for backwards compatibility
 */
export const BUZZWORDS = [
  // Classic AI buzzwords
  'robust', 'seamless', 'comprehensive', 'elegant', 'powerful',
  'flexible', 'intuitive', 'user-friendly', 'streamlined', 'optimized',
  'efficient', 'scalable', 'reliable', 'secure', 'modern',
  'innovative', 'sophisticated', 'advanced', 'state-of-the-art',
  'best-in-class', 'world-class', 'enterprise-ready', 'production-grade',
  'battle-tested', 'industry-leading', 'game-changing', 'revolutionary',
  'transformative', 'disruptive', 'cutting-edge', 'next-generation',
  'bleeding-edge', 'groundbreaking', 'paradigm-shifting',
  // Verb-form buzzwords
  'synergy', 'holistic', 'ecosystem', 'leverage', 'utilize',
  'facilitate', 'enable', 'empower', 'optimize', 'accelerate',
  'amplify', 'unlock', 'drive', 'spearhead', 'champion',
  'pivot', 'actionable',
  // PRD-specific vague qualifiers (legacy compatibility)
  'easy to use', 'fast', 'quick', 'responsive', 'good performance',
  'high quality', 'optimal', 'minimal', 'sufficient', 'reasonable',
  'appropriate', 'adequate'
];

/**
 * Filler phrases - delete entirely, add no meaning
 */
export const FILLER_PHRASES = [
  'it\'s important to note that', 'it\'s worth mentioning that',
  'it should be noted that', 'it goes without saying that',
  'needless to say', 'as you may know', 'as we all know',
  'in today\'s world', 'in today\'s digital age',
  'in today\'s fast-paced environment', 'in the modern era',
  'at the end of the day', 'when all is said and done',
  'having said that', 'that said', 'that being said',
  'with that in mind', 'with that being said',
  'let me explain', 'let me walk you through',
  'let\'s dive in', 'let\'s explore', 'let\'s take a look at',
  'let\'s break this down', 'here\'s the thing', 'the thing is',
  'the fact of the matter is', 'at this point in time',
  'in order to', 'due to the fact that', 'for the purpose of',
  'in the event that', 'in light of', 'with regard to',
  'in terms of', 'on a daily basis', 'first and foremost',
  'last but not least', 'each and every', 'one and only',
  'plain and simple', 'pure and simple'
];

/**
 * Hedge patterns - weasel words that avoid commitment
 */
export const HEDGE_PATTERNS = [
  'of course', 'naturally', 'obviously', 'clearly', 'certainly',
  'undoubtedly', 'in many ways', 'to some extent', 'in some cases',
  'it depends', 'it varies', 'generally speaking', 'for the most part',
  'more or less', 'kind of', 'sort of', 'somewhat', 'relatively',
  'arguably', 'potentially', 'possibly', 'might',
  'may or may not', 'could potentially', 'tends to',
  'seems to', 'appears to'
];

/**
 * Sycophantic phrases - should never appear in PRDs
 */
export const SYCOPHANTIC_PHRASES = [
  'great question', 'excellent question', 'that\'s a great point',
  'good thinking', 'i love that idea', 'what a fascinating topic',
  'happy to help', 'i\'d be happy to help', 'i\'m glad you asked',
  'thanks for asking', 'absolutely!', 'definitely!', 'of course!',
  'sure thing', 'no problem', 'you\'re welcome', 'my pleasure',
  'i appreciate you sharing', 'that\'s an interesting perspective',
  'i understand your concern'
];

/**
 * Transitional filler - overused transitions that pad word count
 */
export const TRANSITIONAL_FILLER = [
  'furthermore', 'moreover', 'additionally', 'in addition',
  'nevertheless', 'nonetheless', 'on the other hand', 'conversely',
  'in contrast', 'similarly', 'likewise', 'consequently',
  'therefore', 'thus', 'hence', 'accordingly', 'as a result',
  'for this reason', 'to that end', 'with this in mind',
  'given the above', 'based on the above', 'as mentioned earlier',
  'as previously stated', 'as noted above', 'moving forward',
  'going forward'
];

// ============================================================================
// Structural Patterns
// ============================================================================

/**
 * Patterns for detecting formulaic document structure
 */
export const STRUCTURAL_PATTERNS = {
  // Formulaic introductions
  formulaicIntro: /^(in today's|in this (document|section|prd|spec)|this (document|prd|spec) (will|aims|seeks))/im,

  // Over-signposting
  overSignposting: [
    'in this section, we will',
    'as mentioned earlier',
    'let\'s now turn to',
    'before we proceed',
    'as discussed above',
    'we will now explore'
  ],

  // Template section progression
  templateSections: /overview.{0,500}key points.{0,500}(best practices|conclusion)/is,

  // Symmetric coverage (balanced to a fault)
  symmetricCoverage: /(on one hand|on the other hand|pros and cons|advantages and disadvantages|both.*have (merit|value))/gi
};

// ============================================================================
// Detection Functions
// ============================================================================

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

// ============================================================================
// Stylometric Analysis
// ============================================================================

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
