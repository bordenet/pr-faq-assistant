/**
 * Inline PR-FAQ Validator for Assistant UI
 * @module validator-inline
 *
 * Wraps the full validator to ensure consistent scoring between
 * the Assistant UI and the standalone Validator app.
 *
 * Scoring Dimensions:
 * 1. Structure (30 pts) - Document structure and hook
 * 2. Content (35 pts) - Content quality
 * 3. Professional (20 pts) - Professional quality
 * 4. Evidence (15 pts) - Customer evidence
 */

// Import the full validator to ensure scoring consistency
import {
  validatePRFAQ,
  scoreStructureAndHook,
  scoreContentQuality,
  scoreProfessionalQuality,
  scoreCustomerEvidence,
  extractTitle,
  stripMarkdown
} from '../../validator/js/validator.js';

import { getSlopPenalty, calculateSlopScore } from './slop-detection.js';

// Re-export for direct access
export { calculateSlopScore };

/**
 * Validate a PR-FAQ document using the same algorithm as the full validator.
 * This ensures users see identical scores in the Assistant and Validator.
 *
 * @param {string} text - The PR-FAQ content (markdown)
 * @returns {Object} Validation result with totalScore and dimension breakdowns
 */
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

  // Use the full validator's scoring logic
  const result = validatePRFAQ(text);

  // Return in the format expected by the assistant UI
  return {
    totalScore: result.totalScore,
    structure: result.structure,
    content: result.content,
    professional: result.professional,
    evidence: result.evidence,
    slopDetection: result.professional?.breakdown?.fluff?.slopDetection || {
      penalty: 0,
      deduction: 0,
      issues: []
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

