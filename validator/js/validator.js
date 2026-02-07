/**
 * PR-FAQ Validator - Core Scoring Logic
 * Ported from Go implementation
 */

import { calculateSlopScore, getSlopPenalty } from './slop-detection.js';

// Re-export for direct access
export { calculateSlopScore };

/**
 * Extract customer quotes from text
 * @param {string} content - Text content
 * @returns {string[]} Array of quotes
 */
export function extractQuotes(content) {
  const quotes = [];

  // Quote patterns - standard and curly quotes
  const patterns = [
    /"([^"]+)"/g,           // Standard double quotes
    /\u201C([^\u201D]+)\u201D/g,  // Curly double quotes
    /'([^']+)'/g,           // Single quotes
    /\u2018([^\u2019]+)\u2019/g,  // Curly single quotes
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const quote = match[1].trim();
      // Filter out very short quotes (likely not customer testimonials)
      if (quote.length > 20) {
        quotes.push(quote);
      }
    }
  }

  return quotes;
}

/**
 * Detect quantitative metrics in text
 * @param {string} text - Text to analyze
 * @returns {{metrics: string[], types: string[]}} Found metrics and their types
 */
export function detectMetricsInText(text) {
  const metrics = [];
  const types = [];

  // Percentage patterns
  const percentagePatterns = [
    /\d+(?:\.\d+)?%/gi,
    /\d+(?:\.\d+)?\s*percent/gi,
    /\d+(?:\.\d+)?\s*percentage\s*points?/gi,
  ];

  for (const pattern of percentagePatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      metrics.push(match);
      types.push('percentage');
    }
  }

  // Ratio and multiplier patterns
  const ratioPatterns = [
    /\d+x\b/gi,
    /\d+(?:\.\d+)?:\d+(?:\.\d+)?/g,
    /\d+(?:\.\d+)?\s*times/gi,
  ];

  for (const pattern of ratioPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      metrics.push(match);
      types.push('ratio');
    }
  }

  // Currency and absolute numbers
  const numberPatterns = [
    /\$\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|thousand|k|m|b))?/gi,
    /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:milliseconds?|seconds?|minutes?|hours?|days?)/gi,
    /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:customers?|users?|transactions?)/gi,
  ];

  for (const pattern of numberPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      metrics.push(match);
      types.push('absolute');
    }
  }

  return { metrics, types };
}

/**
 * Score an individual quote based on metrics
 * @param {string[]} metrics - Metrics found in quote
 * @param {string[]} metricTypes - Types of metrics
 * @returns {number} Score (0-10)
 */
export function scoreQuote(metrics, metricTypes) {
  if (metrics.length === 0) {
    return 0;
  }

  let score = 2; // Base score for having any metrics

  // Bonus for different metric types
  const typeBonus = new Set();
  for (const metricType of metricTypes) {
    if (!typeBonus.has(metricType)) {
      typeBonus.add(metricType);
      switch (metricType) {
      case 'percentage':
        score += 3;
        break;
      case 'ratio':
        score += 2;
        break;
      case 'absolute':
        score += 2;
        break;
      case 'score':
        score += 1;
        break;
      }
    }
  }

  // Bonus for multiple metrics
  if (metrics.length >= 2) score += 2;
  if (metrics.length >= 3) score += 1;

  return Math.min(score, 10);
}

/**
 * Score customer evidence dimension (10 pts max - updated from 15)
 * @param {string} content - PR-FAQ content
 * @returns {{score: number, maxScore: number, quotes: number, quotesWithMetrics: number, issues: string[], strengths: string[]}}
 */
export function scoreCustomerEvidence(content) {
  const result = {
    score: 0,
    maxScore: 10,
    quotes: 0,
    quotesWithMetrics: 0,
    issues: [],
    strengths: [],
  };

  if (!content) {
    result.issues.push('No content to analyze');
    return result;
  }

  const quotes = extractQuotes(content);
  result.quotes = quotes.length;

  if (quotes.length === 0) {
    result.issues.push('No customer quotes found');
    return result;
  }

  let totalQuoteScore = 0;
  let quotesWithMetrics = 0;

  for (const quote of quotes) {
    const { metrics, types } = detectMetricsInText(quote);
    const quoteScore = scoreQuote(metrics, types);

    if (metrics.length > 0) {
      quotesWithMetrics++;
    }
    totalQuoteScore += quoteScore;
  }

  result.quotesWithMetrics = quotesWithMetrics;

  // Base score: 2 points (~20% of 10)
  const baseScore = 2;

  // Metric bonus: up to 6 points based on quote quality
  let metricBonus = 0;
  if (quotes.length > 0) {
    const avgQuoteScore = totalQuoteScore / quotes.length;
    metricBonus = Math.round((avgQuoteScore * 6) / 10);
  }

  // Coverage bonus: up to 2 points for multiple quotes with metrics
  let coverageBonus = 0;
  if (quotesWithMetrics > 0) {
    coverageBonus = 1;
    if (quotesWithMetrics > 1) {
      coverageBonus = 2;
    }
  }

  result.score = Math.min(baseScore + metricBonus + coverageBonus, 10);

  // Add feedback
  if (quotesWithMetrics === 0) {
    result.issues.push('Quotes lack quantitative metrics');
  } else {
    result.strengths.push(`${quotesWithMetrics} quote(s) include specific metrics`);
  }

  if (quotes.length > 2) {
    result.issues.push('Consider reducing to 2 quotes: 1 Executive Vision + 1 Customer Relief');
  } else if (quotes.length === 2) {
    result.strengths.push('Follows 2-quote standard (Executive Vision + Customer Relief)');
  }

  if (result.score >= 8) {
    result.strengths.push('Strong customer evidence with quantitative backing');
  }

  return result;
}



/**
 * Analyze headline quality (10 pts max)
 * @param {string} title - The headline/title
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeHeadlineQuality(title) {
  const result = {
    score: 0,
    maxScore: 10,
    issues: [],
    strengths: [],
  };

  if (!title) {
    result.issues.push('Missing headline/title');
    return result;
  }

  const words = title.split(/\s+/).filter(w => w.length > 0);
  const chars = title.length;

  // Length analysis (ideal: 8-15 words, 40-100 characters)
  if (chars >= 40 && chars <= 100 && words.length >= 8 && words.length <= 15) {
    result.score += 3;
    result.strengths.push('Headline length is optimal');
  } else if (chars > 120 || words.length > 18) {
    result.issues.push('Headline too long (reduces scannability)');
  } else if (chars < 30 || words.length < 4) {
    result.issues.push('Headline too short (lacks specificity)');
  } else {
    result.score += 1;
  }

  // Strong verbs
  const strongVerbs = ['launches', 'announces', 'introduces', 'unveils', 'delivers', 'creates', 'develops', 'achieves', 'reduces', 'increases', 'improves', 'transforms'];
  const titleLower = title.toLowerCase();
  const hasStrongVerb = strongVerbs.some(verb => titleLower.includes(verb));

  if (hasStrongVerb) {
    result.score += 2;
    result.strengths.push('Uses strong action verbs');
  } else {
    result.issues.push('Consider using stronger action verbs');
  }

  // Specificity (numbers, percentages)
  const specificityPatterns = [/\d+%/, /\d+x/, /\d+(?:,\d{3})*/, /\$\d+/, /by \d+/, /up to \d+/];
  const hasSpecifics = specificityPatterns.some(p => p.test(title));

  if (hasSpecifics) {
    result.score += 3;
    result.strengths.push('Includes specific metrics or outcomes');
  } else {
    result.issues.push('Consider adding specific metrics to the headline');
  }

  // Avoid weak language
  const weakLanguage = ['new', 'innovative', 'cutting-edge', 'revolutionary', 'world-class', 'leading', 'comprehensive', 'robust'];
  const hasWeakLanguage = weakLanguage.some(weak => titleLower.includes(weak));

  if (hasWeakLanguage) {
    result.issues.push('Avoid generic marketing language in headlines');
  } else {
    result.score += 2;
    result.strengths.push('Avoids generic marketing language');
  }

  return result;
}

/**
 * Analyze newsworthy hook (15 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeNewsworthyHook(content) {
  const result = {
    score: 0,
    maxScore: 15,
    issues: [],
    strengths: [],
  };

  // Filter empty paragraphs and find first substantial one
  const paragraphs = content.split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 50); // Skip short/empty paragraphs

  const hook = paragraphs[0] || '';

  if (!hook) {
    result.issues.push('Missing opening hook');
    return result;
  }

  const hookLower = hook.toLowerCase();

  // Timeliness - check for timeliness words OR dateline format (implies timeliness)
  const timelinessWords = ['today', 'this week', 'announces', 'launched', 'released', 'unveiled', 'now available'];
  const hasTimelinessWord = timelinessWords.some(word => hookLower.includes(word));
  // Dateline pattern: "CITY, ST — Date —" or "CITY, ST (Wire) —"
  const hasDateline = /[A-Z]{2,}[,\s]+[A-Z]{2}\s*[—–-]/.test(hook) || /\([A-Za-z]+\s*Wire\)/.test(hook);
  const hasTimeliness = hasTimelinessWord || hasDateline;

  if (hasTimeliness) {
    result.score += 3;
    result.strengths.push('Opens with timely announcement');
  } else {
    result.issues.push('Hook lacks immediate timeliness');
  }

  // Specificity
  const specificityPatterns = [/\d+%/, /\d+x/, /cuts .+ by/i, /improves .+ by/i, /reduces .+ by/i, /increases .+ by/i];
  const hasSpecificity = specificityPatterns.some(p => p.test(hook));

  if (hasSpecificity) {
    result.score += 4;
    result.strengths.push('Hook includes specific, measurable outcomes');
  } else {
    result.issues.push('Hook lacks specific metrics or outcomes');
  }

  // Problem addressing
  const problemWords = ['solves', 'addresses', 'tackles', 'eliminates', 'reduces', 'improves', 'streamlines', 'automates'];
  const addressesProblem = problemWords.some(word => hookLower.includes(word));

  if (addressesProblem) {
    result.score += 3;
    result.strengths.push('Addresses clear problem or improvement');
  } else {
    result.issues.push('Hook doesn\'t clearly address a problem or need');
  }

  // Company clarity - check for comma/em-dash separator with action verb
  const sentences = hook.split('.');
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    const firstSentenceLower = firstSentence.toLowerCase();
    // Accept comma, em-dash, or en-dash as separators (dateline formats)
    const hasSeparator = firstSentence.includes(',') || firstSentence.includes('—') || firstSentence.includes('–');
    const hasAction = firstSentenceLower.includes('announce') || firstSentenceLower.includes('launch') || firstSentenceLower.includes('introduce') || firstSentenceLower.includes('unveil');
    if (hasSeparator && hasAction) {
      result.score += 2;
      result.strengths.push('Clear company identification and action');
    } else {
      result.issues.push('First sentence should clearly identify who is doing what');
    }
  }

  // Avoid fluff
  const fluffWords = ['excited', 'pleased', 'proud', 'thrilled', 'delighted', 'revolutionary', 'groundbreaking', 'cutting-edge'];
  const hasFluff = fluffWords.some(fluff => hookLower.includes(fluff));

  if (hasFluff) {
    result.issues.push('Hook contains marketing fluff - focus on concrete value');
    result.score = Math.max(0, result.score - 1);
  } else {
    result.score += 3;
    result.strengths.push('Hook avoids marketing fluff');
  }

  return result;
}

/**
 * Analyze release date presence (5 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeReleaseDate(content) {
  const result = {
    score: 0,
    maxScore: 5,
    issues: [],
    strengths: [],
  };

  const firstLines = content.slice(0, 200);

  const datePatterns = [
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
    /\b\d{4}-\d{1,2}-\d{1,2}\b/,
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i,
  ];

  const hasDate = datePatterns.some(p => p.test(firstLines));

  if (hasDate) {
    result.score = 5;
    result.strengths.push('Includes release date in opening lines');

    // Check for location pattern
    const locationPattern = /\b[A-Z][a-z]+,?\s+[A-Z]{2,}\b/;
    if (locationPattern.test(firstLines)) {
      result.strengths.push('Follows standard press release dateline format');
    }
  } else {
    result.issues.push('Missing release date in opening lines');
    result.issues.push('Add date and location (e.g., \'Aug 20, 2024. Seattle, WA.\')');
  }

  return result;
}

/**
 * Score Structure & Hook dimension (20 pts max - updated from 30)
 * @param {string} content - Full content
 * @param {string} title - Headline/title
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[], breakdown: Object}}
 */
export function scoreStructureAndHook(content, title) {
  const headline = analyzeHeadlineQuality(title);
  const hook = analyzeNewsworthyHook(content);
  const releaseDate = analyzeReleaseDate(content);

  // Raw score from sub-functions (max 30), scale to 20 pts
  const rawScore = headline.score + hook.score + releaseDate.score;
  const scaledScore = Math.round((rawScore * 20) / 30);

  return {
    score: scaledScore,
    maxScore: 20,
    issues: [...headline.issues, ...hook.issues, ...releaseDate.issues],
    strengths: [...headline.strengths, ...hook.strengths, ...releaseDate.strengths],
    breakdown: {
      headline,
      hook,
      releaseDate,
    },
  };
}

/**
 * Analyze 5 Ws coverage (15 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeFiveWs(content) {
  const result = {
    score: 0,
    maxScore: 15,
    issues: [],
    strengths: [],
  };

  // Get first 2-3 paragraphs
  const paragraphs = content.split(/\n\n+/);
  let leadContent = '';
  for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
    leadContent += paragraphs[i] + ' ';
  }
  const leadContentLower = leadContent.toLowerCase();

  // WHO: Company/organization identified
  const companyPatterns = [
    /\b[A-Z][a-z]+\s+(?:Inc|Corp|Company|LLC|Ltd)/,
    /[A-Z][a-zA-Z]+\s+announced/,
    /[A-Z][a-zA-Z]+\s+today/,
    /[A-Z][a-zA-Z]+\s+launches/i,
    /\*\*[A-Z][a-zA-Z]+\*\*/,  // Bold company names like **FakeCo**
  ];
  const hasWho = companyPatterns.some(p => p.test(leadContent));

  if (hasWho) {
    result.score += 3;
    result.strengths.push('Clearly identifies WHO (company/organization)');
  } else {
    result.issues.push('WHO: Company/organization not clearly identified in lead');
  }

  // WHAT: Action clearly described
  const actionWords = ['announces', 'launches', 'introduces', 'unveils', 'releases', 'develops', 'creates'];
  const hasWhat = actionWords.some(action => leadContentLower.includes(action));

  if (hasWhat) {
    result.score += 3;
    result.strengths.push('Clearly describes WHAT (action/product/service)');
  } else {
    result.issues.push('WHAT: Action or offering not clearly described');
  }

  // WHEN: Timing mentioned
  const timePatterns = [
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d/i,
    /today/i,
    /this week/i,
    /this month/i,
    /\d{4}/,
    /yesterday/i,
    /recently/i,
  ];
  const hasWhen = timePatterns.some(p => p.test(leadContent));

  if (hasWhen) {
    result.score += 3;
    result.strengths.push('Includes WHEN (timing/date)');
  } else {
    result.issues.push('WHEN: Timing or date not specified');
  }

  // WHERE: Location/market mentioned
  const wherePatterns = [
    /[A-Z][a-z]+,\s+[A-Z]{2}/,           // "Seattle, WA"
    /[A-Z]{2,},\s*[A-Z]{2}\s*[—–-]/,     // "SEATTLE, WA —" (dateline with em-dash)
    /[A-Z][a-z]+\s+\([A-Z][a-z]+\s+Wire\)/,
    /headquarters/i,
    /market/i,
    /globally/i,
    /worldwide/i,
    /nation/i,
  ];
  const hasWhere = wherePatterns.some(p => p.test(leadContent));

  if (hasWhere) {
    result.score += 2;
    result.strengths.push('Mentions WHERE (location/market)');
  } else {
    result.issues.push('WHERE: Location or market context could be clearer');
  }

  // WHY: Reason/benefit explained
  const whyIndicators = ['because', 'to help', 'to address', 'to solve', 'to improve', 'to reduce', 'to increase', 'enables', 'allows', 'provides'];
  const hasWhy = whyIndicators.some(indicator => leadContentLower.includes(indicator));

  if (hasWhy) {
    result.score += 4;
    result.strengths.push('Explains WHY (reason/benefit/problem solved)');
  } else {
    result.issues.push('WHY: Reason or benefit not clearly explained');
  }

  return result;
}

/**
 * Analyze document structure (10 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeStructure(content) {
  const result = {
    score: 0,
    maxScore: 10,
    issues: [],
    strengths: [],
  };

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length < 3) {
    result.issues.push('Press release too short for proper structure analysis');
    result.score = 2;
    return result;
  }

  // Lead paragraph length (widened range to 25-70 words)
  const firstPara = paragraphs[0].trim();
  const leadWords = firstPara.split(/\s+/).length;

  if (leadWords >= 25 && leadWords <= 70) {
    result.score += 3;
    result.strengths.push('Lead paragraph has appropriate length');
  } else if (leadWords > 80) {
    result.issues.push('Lead paragraph too long - should be concise');
  } else if (leadWords < 20) {
    result.issues.push('Lead paragraph too brief - lacks key details');
  }

  // Supporting details in middle
  let middleContent = '';
  const startIdx = 1;
  const endIdx = Math.max(startIdx + 1, paragraphs.length - 2);

  for (let i = startIdx; i < endIdx; i++) {
    middleContent += paragraphs[i] + ' ';
  }

  if (middleContent.length > 0) {
    const supportingElements = ['according to', 'the company', 'additionally', 'furthermore', 'the solution', 'customers'];
    const hasSupporting = supportingElements.some(el => middleContent.toLowerCase().includes(el));

    if (hasSupporting) {
      result.score += 3;
      result.strengths.push('Includes supporting details and context');
    } else {
      result.issues.push('Middle content lacks supporting details');
    }
  }

  // Boilerplate at end
  if (paragraphs.length >= 3) {
    const lastPara = paragraphs[paragraphs.length - 1].toLowerCase();
    const boilerplateIndicators = ['about ', 'founded', 'headquartered', 'company', 'organization', 'learn more'];
    const hasBoilerplate = boilerplateIndicators.some(ind => lastPara.includes(ind));

    if (hasBoilerplate) {
      result.score += 2;
      result.strengths.push('Includes proper company boilerplate');
    } else {
      result.issues.push('Missing company boilerplate information');
    }
  }

  // Transitions
  const transitionWords = ['additionally', 'furthermore', 'moreover', 'however', 'meanwhile', 'as a result'];
  const hasTransitions = transitionWords.some(t => content.toLowerCase().includes(t));

  if (hasTransitions) {
    result.score += 2;
    result.strengths.push('Uses transitions for logical flow');
  } else if (paragraphs.length > 4) {
    result.issues.push('Consider adding transitions between sections');
  }

  return result;
}

/**
 * Analyze credibility (10 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeCredibility(content) {
  const result = {
    score: 5, // Start neutral
    maxScore: 10,
    issues: [],
    strengths: [],
  };

  const contentLower = content.toLowerCase();

  // Check for proof/evidence
  const proofIndicators = [/\d+%/, /\d+x/, /study shows/i, /research indicates/i, /data reveals/i, /according to/i, /measured/i, /demonstrated/i];
  const hasProof = proofIndicators.some(p => p.test(content));

  if (hasProof) {
    result.score += 3;
    result.strengths.push('Backs claims with data or evidence');
  } else {
    result.score -= 1;
    result.issues.push('Claims would be stronger with supporting data');
  }

  // Check for third-party validation
  const thirdPartyIndicators = ['analyst', 'research firm', 'industry report', 'gartner', 'forrester', 'idc', 'mckinsey'];
  const hasThirdParty = thirdPartyIndicators.some(ind => contentLower.includes(ind));

  if (hasThirdParty) {
    result.score += 2;
    result.strengths.push('References third-party validation');
  }

  return result;
}

/**
 * Score Content Quality dimension (20 pts max - updated from 35)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[], breakdown: Object}}
 */
export function scoreContentQuality(content) {
  const fiveWs = analyzeFiveWs(content);
  const structure = analyzeStructure(content);
  const credibility = analyzeCredibility(content);

  // Raw score from sub-functions (max 35), scale to 20 pts
  const rawScore = fiveWs.score + structure.score + credibility.score;
  const scaledScore = Math.round((rawScore * 20) / 35);

  return {
    score: scaledScore,
    maxScore: 20,
    issues: [...fiveWs.issues, ...structure.issues, ...credibility.issues],
    strengths: [...fiveWs.strengths, ...structure.strengths, ...credibility.strengths],
    breakdown: {
      fiveWs,
      structure,
      credibility,
    },
  };
}

/**
 * Analyze tone and readability (10 pts max)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[]}}
 */
export function analyzeToneAndReadability(content) {
  const result = {
    score: 5, // Start neutral
    maxScore: 10,
    issues: [],
    strengths: [],
  };

  const contentLower = content.toLowerCase();

  // Sentence length analysis
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  let totalWords = 0;
  let longSentences = 0;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 0).length;
    totalWords += words;
    if (words > 25) {
      longSentences++;
    }
  }

  if (sentences.length > 1) {
    const avgWordsPerSentence = totalWords / sentences.length;
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      result.score += 2;
      result.strengths.push('Good sentence length for readability');
    } else if (avgWordsPerSentence > 25) {
      result.issues.push('Sentences too long - break into shorter, clearer statements');
    }
  }

  if (longSentences > sentences.length / 3) {
    result.issues.push('Too many overly long sentences - impacts readability');
    result.score -= 1;
  }

  // Passive voice check
  const passiveIndicators = ['is being', 'was being', 'are being', 'were being', 'has been', 'have been', 'had been', 'will be'];
  let passiveCount = 0;
  for (const passive of passiveIndicators) {
    const matches = contentLower.match(new RegExp(passive, 'g'));
    passiveCount += matches ? matches.length : 0;
  }

  if (passiveCount > sentences.length / 4) {
    result.issues.push('Overuse of passive voice - use active voice for clarity');
    result.score -= 1;
  } else {
    result.score += 1;
    result.strengths.push('Good use of active voice');
  }

  // Jargon check
  const techJargon = ['synergies', 'paradigm', 'leverage', 'ecosystem', 'scalable', 'turnkey', 'best-in-class', 'enterprise-grade'];
  let jargonCount = 0;
  for (const jargon of techJargon) {
    if (contentLower.includes(jargon)) {
      jargonCount++;
    }
  }

  if (jargonCount > 3) {
    result.issues.push('Too much technical jargon - write for broader audience');
    result.score -= 1;
  } else if (jargonCount === 0) {
    result.score += 1;
    result.strengths.push('Avoids unnecessary jargon');
  }

  // Quote quality check
  const quotes = extractQuotes(content);
  const executiveFluff = ['excited', 'pleased', 'proud', 'thrilled', 'honored', 'delighted'];
  let fluffyQuotes = 0;

  for (const quote of quotes) {
    const quoteLower = quote.toLowerCase();
    if (executiveFluff.some(fluff => quoteLower.includes(fluff))) {
      fluffyQuotes++;
    }
  }

  if (quotes.length > 0) {
    if (fluffyQuotes < quotes.length / 2) {
      result.score += 1;
      result.strengths.push('Quotes provide substantive insight');
    } else {
      result.issues.push('Too many generic \'excited\' quotes - add substantive insights');
    }
  }

  return result;
}

/**
 * Analyze marketing fluff (10 pts max - starts at 10, deducts for fluff)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[], fluffWords: Array<{word: string, index: number}>}}
 */
export function analyzeMarketingFluff(content) {
  const result = {
    score: 10, // Start with full points
    maxScore: 10,
    issues: [],
    strengths: [],
    fluffWords: [], // For highlighting
  };

  const contentLower = content.toLowerCase();

  // Hyperbolic adjectives
  const hypeWords = [
    'revolutionary', 'groundbreaking', 'cutting-edge', 'world-class',
    'industry-leading', 'best-in-class', 'state-of-the-art', 'next-generation',
    'breakthrough', 'game-changing', 'disruptive', 'unprecedented',
    'ultimate', 'premier', 'superior', 'exceptional', 'outstanding',
  ];

  let hypeCount = 0;
  for (const hype of hypeWords) {
    if (contentLower.includes(hype)) {
      hypeCount++;
      // Find all occurrences for highlighting
      let idx = contentLower.indexOf(hype);
      while (idx !== -1) {
        result.fluffWords.push({ word: hype, index: idx });
        idx = contentLower.indexOf(hype, idx + 1);
      }
    }
  }

  if (hypeCount > 3) {
    result.score -= 3;
    result.issues.push('Excessive hyperbolic language reduces credibility');
  } else if (hypeCount > 1) {
    result.score -= 1;
    result.issues.push('Consider reducing promotional adjectives');
  } else if (hypeCount === 0) {
    result.strengths.push('Avoids hyperbolic marketing language');
  }

  // Emotional fluff in quotes
  const emotionalFluff = ['excited', 'thrilled', 'delighted', 'pleased', 'proud', 'honored'];
  const quotes = extractQuotes(content);
  let fluffyQuotes = 0;

  for (const quote of quotes) {
    const quoteLower = quote.toLowerCase();
    for (const fluff of emotionalFluff) {
      if (quoteLower.includes(fluff)) {
        fluffyQuotes++;
        break;
      }
    }
  }

  if (quotes.length > 0) {
    const fluffRatio = fluffyQuotes / quotes.length;
    if (fluffRatio > 0.7) {
      result.score -= 3;
      result.issues.push('Most quotes are generic emotional responses');
    } else if (fluffRatio > 0.3) {
      result.score -= 1;
      result.issues.push('Some quotes lack substantive content');
    } else {
      result.strengths.push('Quotes provide meaningful insights');
    }
  }

  // Vague benefits
  const vagueTerms = ['comprehensive solution', 'robust platform', 'seamless integration', 'enhanced productivity', 'improved efficiency', 'optimal performance'];
  let vagueCount = 0;

  for (const vague of vagueTerms) {
    if (contentLower.includes(vague)) {
      vagueCount++;
    }
  }

  if (vagueCount > 2) {
    result.score -= 2;
    result.issues.push('Vague benefit claims need specific proof points');
  } else if (vagueCount === 0) {
    result.strengths.push('Avoids vague, unsubstantiated claims');
  }

  // Check for proof
  const proofIndicators = [/\d+%/, /\d+x/, /study shows/i, /research indicates/i, /data reveals/i, /according to/i, /measured/i, /demonstrated/i];
  const hasProof = proofIndicators.some(p => p.test(content));

  if (hasProof) {
    result.strengths.push('Backs claims with data or evidence');
  } else {
    result.score -= 1;
    result.issues.push('Claims would be stronger with supporting data');
  }

  result.score = Math.max(0, result.score);

  // Apply slop penalty (aligned with inline validator)
  const slopPenalty = getSlopPenalty(content);
  if (slopPenalty.penalty > 0) {
    const slopDeduction = Math.min(5, Math.floor(slopPenalty.penalty * 0.6));
    result.score = Math.max(0, result.score - slopDeduction);
    if (slopPenalty.issues.length > 0) {
      result.issues.push(...slopPenalty.issues.slice(0, 2));
    }
  }
  result.slopDetection = slopPenalty;

  return result;
}

/**
 * Detect fluff words and return their positions for highlighting
 * Uses comprehensive AI slop detection patterns
 * @param {string} content - Full content
 * @returns {Array<{word: string, start: number, end: number}>}
 */
export function detectFluffWords(content) {
  const fluffPatterns = [
    'revolutionary', 'groundbreaking', 'cutting-edge', 'world-class',
    'industry-leading', 'best-in-class', 'state-of-the-art', 'next-generation',
    'breakthrough', 'game-changing', 'disruptive', 'unprecedented',
    'ultimate', 'premier', 'superior', 'exceptional', 'outstanding',
    'excited', 'thrilled', 'delighted', 'pleased', 'proud', 'honored',
    'comprehensive solution', 'robust platform', 'seamless integration',
    'enhanced productivity', 'improved efficiency', 'optimal performance',
  ];

  const results = [];
  const contentLower = content.toLowerCase();

  for (const pattern of fluffPatterns) {
    let idx = contentLower.indexOf(pattern);
    while (idx !== -1) {
      results.push({
        word: content.slice(idx, idx + pattern.length),
        start: idx,
        end: idx + pattern.length,
      });
      idx = contentLower.indexOf(pattern, idx + 1);
    }
  }

  // Sort by position
  results.sort((a, b) => a.start - b.start);
  return results;
}

/**
 * Score Professional Quality dimension (15 pts max - updated from 20)
 * @param {string} content - Full content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[], fluffWords: Array, breakdown: Object}}
 */
export function scoreProfessionalQuality(content) {
  const tone = analyzeToneAndReadability(content);
  const fluff = analyzeMarketingFluff(content);

  // Raw score from sub-functions (max 20), scale to 15 pts
  const rawScore = tone.score + fluff.score;
  const scaledScore = Math.round((rawScore * 15) / 20);

  return {
    score: scaledScore,
    maxScore: 15,
    issues: [...tone.issues, ...fluff.issues],
    strengths: [...tone.strengths, ...fluff.strengths],
    fluffWords: fluff.fluffWords,
    breakdown: {
      tone,
      fluff,
    },
  };
}

/**
 * Extract FAQ sections from markdown
 * @param {string} markdown - Raw markdown content
 * @returns {{externalFAQ: string, internalFAQ: string}} FAQ sections
 */
export function extractFAQs(markdown) {
  const result = { externalFAQ: '', internalFAQ: '' };

  // Look for External FAQ section
  const externalMatch = markdown.match(/^##\s*(?:External\s+)?FAQ\s*$/im);
  if (externalMatch) {
    const startIdx = markdown.indexOf(externalMatch[0]) + externalMatch[0].length;
    let content = markdown.slice(startIdx);

    // Stop at Internal FAQ if present
    const internalMatch = content.match(/^##\s*Internal\s+FAQ\s*$/im);
    if (internalMatch) {
      result.externalFAQ = content.slice(0, content.indexOf(internalMatch[0])).trim();
      result.internalFAQ = content.slice(content.indexOf(internalMatch[0]) + internalMatch[0].length).trim();
    } else {
      result.externalFAQ = content.trim();
    }
  }

  // Also try to find Internal FAQ if not already found
  if (!result.internalFAQ) {
    const internalMatch = markdown.match(/^##\s*Internal\s+FAQ\s*$/im);
    if (internalMatch) {
      result.internalFAQ = markdown.slice(markdown.indexOf(internalMatch[0]) + internalMatch[0].length).trim();
    }
  }

  return result;
}

/**
 * Extract individual FAQ questions from FAQ section text
 * @param {string} faqContent - FAQ section content
 * @returns {Array<{question: string, answer: string}>} Parsed Q&A pairs
 */
export function parseFAQQuestions(faqContent) {
  const questions = [];
  if (!faqContent) return questions;

  // Pattern: **Q: ...** or ### Q: ... or Q: ... followed by A: ...
  const patterns = [
    /\*\*Q:\s*([^*]+)\*\*\s*(?:\n+)?\s*(?:\*\*)?A:\s*([^*\n]+(?:\n(?!\*\*Q:|\n###|\nQ:)[^\n]*)*)/gi,
    /###\s*Q:\s*(.+?)\n+\s*A:\s*(.+?)(?=\n###|\n\*\*Q:|\n\nQ:|$)/gis,
    /^Q:\s*(.+?)\n+A:\s*(.+?)(?=\nQ:|$)/gim,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(faqContent)) !== null) {
      questions.push({
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }
    if (questions.length > 0) break;
  }

  // Fallback: look for any questions (lines ending with ?)
  if (questions.length === 0) {
    const lines = faqContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.endsWith('?') && line.length > 10) {
        questions.push({
          question: line.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s*/, ''),
          answer: lines[i + 1] ? lines[i + 1].trim() : '',
        });
      }
    }
  }

  return questions;
}

/**
 * Check if FAQ contains mandatory hard questions
 * @param {Array<{question: string, answer: string}>} questions - Parsed FAQ questions
 * @returns {{hasRisk: boolean, hasReversibility: boolean, hasOpportunityCost: boolean, hardQuestionCount: number}}
 */
export function checkHardQuestions(questions) {
  const result = {
    hasRisk: false,
    hasReversibility: false,
    hasOpportunityCost: false,
    hardQuestionCount: 0,
  };

  const riskPatterns = [/risk/i, /fail/i, /wrong/i, /worst case/i, /challenge/i, /obstacle/i, /concern/i];
  const reversibilityPatterns = [/revers/i, /one.?way/i, /two.?way/i, /undo/i, /roll.?back/i, /door/i, /commitment/i];
  const opportunityCostPatterns = [/opportunity cost/i, /instead/i, /alternative/i, /trade.?off/i, /give up/i, /priorit/i];

  for (const q of questions) {
    const text = q.question + ' ' + q.answer;

    if (riskPatterns.some(p => p.test(text))) {
      result.hasRisk = true;
    }
    if (reversibilityPatterns.some(p => p.test(text))) {
      result.hasReversibility = true;
    }
    if (opportunityCostPatterns.some(p => p.test(text))) {
      result.hasOpportunityCost = true;
    }
  }

  result.hardQuestionCount = (result.hasRisk ? 1 : 0) + (result.hasReversibility ? 1 : 0) + (result.hasOpportunityCost ? 1 : 0);
  return result;
}

/**
 * Score FAQ Quality dimension (35 pts max - NEW)
 * This is the "Working Backwards" test - FAQs are where the idea gets stress-tested
 * @param {string} markdown - Raw markdown content
 * @returns {{score: number, maxScore: number, issues: string[], strengths: string[], externalCount: number, internalCount: number, hardQuestions: Object}}
 */
export function scoreFAQQuality(markdown) {
  const result = {
    score: 0,
    maxScore: 35,
    issues: [],
    strengths: [],
    externalCount: 0,
    internalCount: 0,
    hardQuestions: null,
    softballPenalty: false,
  };

  const faqs = extractFAQs(markdown);
  const externalQuestions = parseFAQQuestions(faqs.externalFAQ);
  const internalQuestions = parseFAQQuestions(faqs.internalFAQ);

  result.externalCount = externalQuestions.length;
  result.internalCount = internalQuestions.length;

  // External FAQ scoring (10 pts max)
  // 5-7 customer-focused questions expected
  if (externalQuestions.length >= 5) {
    result.score += 10;
    result.strengths.push(`External FAQ has ${externalQuestions.length} customer questions`);
  } else if (externalQuestions.length >= 3) {
    result.score += 6;
    result.issues.push(`External FAQ has only ${externalQuestions.length} questions (5-7 recommended)`);
  } else if (externalQuestions.length > 0) {
    result.score += 3;
    result.issues.push(`External FAQ is sparse (${externalQuestions.length} questions, need 5-7)`);
  } else {
    result.issues.push('Missing External FAQ section');
  }

  // Internal FAQ presence (10 pts max)
  if (internalQuestions.length >= 5) {
    result.score += 10;
    result.strengths.push(`Internal FAQ has ${internalQuestions.length} questions`);
  } else if (internalQuestions.length >= 3) {
    result.score += 6;
    result.issues.push(`Internal FAQ has only ${internalQuestions.length} questions (5-7 recommended)`);
  } else if (internalQuestions.length > 0) {
    result.score += 3;
    result.issues.push(`Internal FAQ is sparse (${internalQuestions.length} questions, need 5-7)`);
  } else {
    result.issues.push('Missing Internal FAQ section - this is where the idea gets stress-tested');
  }

  // Internal FAQ rigor - mandatory hard questions (15 pts max)
  result.hardQuestions = checkHardQuestions(internalQuestions);

  if (result.hardQuestions.hardQuestionCount === 3) {
    result.score += 15;
    result.strengths.push('Internal FAQ covers Risk, Reversibility, and Opportunity Cost');
  } else if (result.hardQuestions.hardQuestionCount === 2) {
    result.score += 10;
    const missing = [];
    if (!result.hardQuestions.hasRisk) missing.push('Risk');
    if (!result.hardQuestions.hasReversibility) missing.push('Reversibility');
    if (!result.hardQuestions.hasOpportunityCost) missing.push('Opportunity Cost');
    result.issues.push(`Internal FAQ missing hard question: ${missing.join(', ')}`);
  } else if (result.hardQuestions.hardQuestionCount === 1) {
    result.score += 5;
    result.issues.push('Internal FAQ needs more hard questions (Risk, Reversibility, Opportunity Cost)');
    result.softballPenalty = true;
  } else {
    result.issues.push('Internal FAQ contains only "softball" questions - must address Risk, Reversibility, Opportunity Cost');
    result.softballPenalty = true;
  }

  return result;
}

/**
 * Extract press release content from markdown (handles preamble)
 * @param {string} markdown - Raw markdown content
 * @returns {string} Press release content only
 */
export function extractPressRelease(markdown) {
  // Look for "## Press Release" section marker
  const prMatch = markdown.match(/^##\s*Press\s*Release\s*$/im);
  if (prMatch) {
    const startIdx = markdown.indexOf(prMatch[0]) + prMatch[0].length;
    let content = markdown.slice(startIdx);

    // Stop at FAQ section if present
    const faqMatch = content.match(/^##\s*FAQ/im);
    if (faqMatch) {
      content = content.slice(0, content.indexOf(faqMatch[0]));
    }
    return content.trim();
  }
  return markdown;
}

/**
 * Strip markdown formatting for text analysis
 * @param {string} markdown - Raw markdown content
 * @returns {string} Plain text content
 */
export function stripMarkdown(markdown) {
  // First extract just the press release if there's a preamble
  const prContent = extractPressRelease(markdown);

  return prContent
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract title from markdown
 * Handles: H1 headers, or first line after "## Press Release"
 * @param {string} markdown - Raw markdown content
 * @returns {string} Title or empty string
 */
export function extractTitle(markdown) {
  // First try: H1 header
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Second try: First non-empty line after "## Press Release"
  const prMatch = markdown.match(/^##\s*Press\s*Release\s*$/im);
  if (prMatch) {
    const startIdx = markdown.indexOf(prMatch[0]) + prMatch[0].length;
    const afterPR = markdown.slice(startIdx).trim();
    const lines = afterPR.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      // First line is likely the title
      return lines[0].trim();
    }
  }

  return '';
}

/**
 * Main validation entry point
 * Updated scoring: Structure (20), Content (20), Professional (15), Evidence (10), FAQ Quality (35)
 * @param {string} markdown - Raw PR-FAQ markdown content
 * @returns {Object} Complete validation result
 */
export function validatePRFAQ(markdown) {
  if (!markdown || markdown.trim().length === 0) {
    return {
      totalScore: 0,
      maxScore: 100,
      structure: { score: 0, maxScore: 20, issues: ['No content to analyze'], strengths: [] },
      content: { score: 0, maxScore: 20, issues: ['No content to analyze'], strengths: [] },
      professional: { score: 0, maxScore: 15, issues: ['No content to analyze'], strengths: [] },
      evidence: { score: 0, maxScore: 10, issues: ['No content to analyze'], strengths: [] },
      faqQuality: { score: 0, maxScore: 35, issues: ['No content to analyze'], strengths: [] },
      issues: ['No content to analyze'],
      strengths: [],
      fluffWords: [],
    };
  }

  // Extract title and strip markdown
  const title = extractTitle(markdown);
  const plainText = stripMarkdown(markdown);

  // Run all dimension scorers
  const structure = scoreStructureAndHook(plainText, title);
  const content = scoreContentQuality(plainText);
  const professional = scoreProfessionalQuality(plainText);
  const evidence = scoreCustomerEvidence(plainText);
  const faqQuality = scoreFAQQuality(markdown); // Use raw markdown to find FAQ sections

  // Calculate total score
  let totalScore = structure.score + content.score + professional.score + evidence.score + faqQuality.score;

  // FAQ PENALTY: If Internal FAQ is missing or contains only "softball" questions, cap at 50
  let penaltyApplied = false;
  if (faqQuality.softballPenalty || faqQuality.internalCount === 0) {
    if (totalScore > 50) {
      totalScore = 50;
      penaltyApplied = true;
    }
  }

  // Combine all issues and strengths (deduplicated)
  const allIssues = [...new Set([
    ...structure.issues,
    ...content.issues,
    ...professional.issues,
    ...evidence.issues,
    ...faqQuality.issues,
  ])];

  // Add penalty warning if applied
  if (penaltyApplied) {
    allIssues.unshift('⚠️ SCORE CAPPED AT 50: Internal FAQ is missing or contains only softball questions');
  }

  const allStrengths = [...new Set([
    ...structure.strengths,
    ...content.strengths,
    ...professional.strengths,
    ...evidence.strengths,
    ...faqQuality.strengths,
  ])];

  return {
    totalScore,
    maxScore: 100,
    structure,
    content,
    professional,
    evidence,
    faqQuality,
    // Dimension mappings for app.js compatibility
    dimension1: structure,
    dimension2: content,
    dimension3: professional,
    dimension4: evidence,
    dimension5: faqQuality,
    issues: allIssues,
    strengths: allStrengths,
    fluffWords: professional.fluffWords || [],
    penaltyApplied,
  };
}
