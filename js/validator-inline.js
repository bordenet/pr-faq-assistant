/**
 * Inline PR-FAQ Validator for Assistant UI
 * @module validator-inline
 *
 * Lightweight validation for inline scoring after Phase 3 completion.
 * Scoring Dimensions:
 * 1. Structure (30 pts) - Document structure and hook
 * 2. Content (35 pts) - Content quality
 * 3. Professional (20 pts) - Professional quality
 * 4. Evidence (15 pts) - Customer evidence
 */

import { getSlopPenalty, calculateSlopScore } from './slop-detection.js';

// Re-export for direct access
export { calculateSlopScore };

const STRUCTURE_PATTERNS = {
  headline: /^#+\s*.+/m,
  sections: /^#+\s*(problem|solution|benefit|feature|faq|quote|customer)/gim,
  hook: /\b(announcing|introducing|now|new|first|revolutionary|game.?changing)\b/gi,
  faqSection: /^#+\s*(faq|frequently|question)/im
};

const CONTENT_PATTERNS = {
  benefits: /\b(benefit|advantage|value|improve|enhance|enable|empower|transform)\b/gi,
  features: /\b(feature|capability|function|tool|option|support)\b/gi,
  quantified: /\d+\s*(%|x|million|thousand|hour|day|week|month|year|\$)/gi,
  customerFocus: /\b(customer|user|client|developer|team|organization)\b/gi
};

const PROFESSIONAL_PATTERNS = {
  fluffWords: /\b(very|really|quite|basically|actually|literally|amazing|incredible)\b/gi,
  activeVoice: /\b(we|our|you|your|customers|users|teams)\b/gi,
  clarity: /\b(specifically|exactly|precisely|concretely|directly)\b/gi
};

const EVIDENCE_PATTERNS = {
  quotes: /[""][^""]+[""]|["][^"]+["]/g,
  customerNames: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(?:CEO|CTO|VP|Director|Manager|Head|Lead)/g,
  testimonials: /\b(said|stated|explained|noted|commented|according to)\b/gi
};

function scoreStructure(text) {
  let score = 0;
  const issues = [];

  // Has headline (8 pts)
  if (STRUCTURE_PATTERNS.headline.test(text)) score += 8;
  else issues.push('Add a compelling headline');

  // Has multiple sections (10 pts)
  const sectionMatches = (text.match(STRUCTURE_PATTERNS.sections) || []).length;
  if (sectionMatches >= 4) score += 10;
  else if (sectionMatches >= 2) { score += 6; issues.push('Add more sections'); }
  else issues.push('Structure content with clear sections');

  // Has hook (6 pts)
  if (STRUCTURE_PATTERNS.hook.test(text)) score += 6;
  else issues.push('Add an attention-grabbing hook');

  // Has FAQ section (6 pts)
  if (STRUCTURE_PATTERNS.faqSection.test(text)) score += 6;
  else issues.push('Include an FAQ section');

  return { score: Math.min(30, score), maxScore: 30, issues };
}

function scoreContent(text) {
  let score = 0;
  const issues = [];

  // Benefits (10 pts)
  const benefitMatches = (text.match(CONTENT_PATTERNS.benefits) || []).length;
  if (benefitMatches >= 5) score += 10;
  else if (benefitMatches >= 2) { score += 6; issues.push('Add more benefits'); }
  else issues.push('Highlight customer benefits');

  // Features (8 pts)
  const featureMatches = (text.match(CONTENT_PATTERNS.features) || []).length;
  if (featureMatches >= 3) score += 8;
  else if (featureMatches >= 1) { score += 4; issues.push('Describe more features'); }
  else issues.push('Describe key features');

  // Quantified (9 pts)
  const quantifiedMatches = (text.match(CONTENT_PATTERNS.quantified) || []).length;
  if (quantifiedMatches >= 3) score += 9;
  else if (quantifiedMatches >= 1) { score += 5; issues.push('Add more metrics'); }
  else issues.push('Include quantified benefits');

  // Customer focus (8 pts)
  const customerMatches = (text.match(CONTENT_PATTERNS.customerFocus) || []).length;
  if (customerMatches >= 5) score += 8;
  else if (customerMatches >= 2) { score += 4; issues.push('Focus more on customers'); }
  else issues.push('Center content around customers');

  return { score: Math.min(35, score), maxScore: 35, issues };
}

function scoreProfessional(text) {
  let score = 0;
  const issues = [];

  // Low fluff (8 pts)
  const fluffMatches = (text.match(PROFESSIONAL_PATTERNS.fluffWords) || []).length;
  if (fluffMatches === 0) score += 8;
  else if (fluffMatches <= 3) { score += 5; issues.push('Remove some filler words'); }
  else issues.push('Remove fluff and filler words');

  // Active voice (6 pts)
  const activeMatches = (text.match(PROFESSIONAL_PATTERNS.activeVoice) || []).length;
  if (activeMatches >= 10) score += 6;
  else if (activeMatches >= 5) { score += 3; issues.push('Use more active voice'); }
  else issues.push('Write in active voice');

  // Clarity (6 pts)
  const clarityMatches = (text.match(PROFESSIONAL_PATTERNS.clarity) || []).length;
  if (clarityMatches >= 2) score += 6;
  else if (clarityMatches >= 1) { score += 3; issues.push('Be more specific'); }
  else issues.push('Add specific, concrete language');

  return { score: Math.min(20, score), maxScore: 20, issues };
}

function scoreEvidence(text) {
  let score = 0;
  const issues = [];

  // Has quotes (7 pts)
  const quoteMatches = (text.match(EVIDENCE_PATTERNS.quotes) || []).length;
  if (quoteMatches >= 2) score += 7;
  else if (quoteMatches >= 1) { score += 4; issues.push('Add more customer quotes'); }
  else issues.push('Include customer quotes');

  // Customer names/titles (5 pts)
  if (EVIDENCE_PATTERNS.customerNames.test(text)) score += 5;
  else issues.push('Include customer names and titles');

  // Testimonial language (3 pts)
  if (EVIDENCE_PATTERNS.testimonials.test(text)) score += 3;
  else issues.push('Add testimonial attribution');

  return { score: Math.min(15, score), maxScore: 15, issues };
}

export function validateDocument(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    return {
      totalScore: 0,
      structure: { score: 0, maxScore: 30, issues: ['No content to validate'] },
      content: { score: 0, maxScore: 35, issues: ['No content to validate'] },
      professional: { score: 0, maxScore: 20, issues: ['No content to validate'] },
      evidence: { score: 0, maxScore: 15, issues: ['No content to validate'] }
    };
  }

  const structure = scoreStructure(text);
  const content = scoreContent(text);
  const professional = scoreProfessional(text);
  const evidence = scoreEvidence(text);

  // AI slop detection
  const slopPenalty = getSlopPenalty(text);
  let slopDeduction = 0;
  const slopIssues = [];

  if (slopPenalty.penalty > 0) {
    slopDeduction = Math.min(5, Math.floor(slopPenalty.penalty * 0.6));
    if (slopPenalty.issues.length > 0) {
      slopIssues.push(...slopPenalty.issues.slice(0, 2));
    }
  }

  const totalScore = Math.max(0,
    structure.score + content.score + professional.score + evidence.score - slopDeduction
  );

  return {
    totalScore,
    structure, content, professional, evidence,
    slopDetection: {
      ...slopPenalty,
      deduction: slopDeduction,
      issues: slopIssues
    }
  };
}

export function getScoreColor(score) {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 30) return 'orange';
  return 'red';
}

export function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Ready';
  if (score >= 50) return 'Needs Work';
  if (score >= 30) return 'Draft';
  return 'Incomplete';
}

