/**
 * Workflow Module
 * @module workflow
 * Manages the 3-phase PR-FAQ generation workflow
 * @module workflow
 */

import { WORKFLOW_CONFIG, generatePhase1Prompt, generatePhase2Prompt, generatePhase3Prompt } from './prompts.js';

export { WORKFLOW_CONFIG };

/**
 * Helper to get phase output, handling both flat and nested formats
 * @param {Object} project - Project object
 * @param {number} phaseNum - 1-based phase number
 * @returns {string} Phase output content
 */
function getPhaseOutputInternal(project, phaseNum) {
  // Flat format (canonical) - check first
  const flatKey = `phase${phaseNum}_output`;
  if (project[flatKey]) {
    return project[flatKey];
  }
  // Nested format (legacy) - fallback
  if (project.phases) {
    if (Array.isArray(project.phases) && project.phases[phaseNum - 1]) {
      return project.phases[phaseNum - 1].response || '';
    }
    if (project.phases[phaseNum] && typeof project.phases[phaseNum] === 'object') {
      return project.phases[phaseNum].response || '';
    }
  }
  return '';
}

export class Workflow {
  constructor(project) {
    this.project = project;
    // Clamp phase to valid range (1 to phaseCount)
    // If phase > phaseCount, show phase 3 (the final phase) with export available
    const rawPhase = project.phase || 1;
    this.currentPhase = Math.min(Math.max(1, rawPhase), WORKFLOW_CONFIG.phaseCount);
  }

  getCurrentPhase() {
    // If workflow is complete (phase > phaseCount), return the last phase
    if (this.currentPhase > WORKFLOW_CONFIG.phaseCount) {
      return WORKFLOW_CONFIG.phases[WORKFLOW_CONFIG.phaseCount - 1];
    }
    return WORKFLOW_CONFIG.phases.find(p => p.number === this.currentPhase);
  }

  getNextPhase() {
    if (this.currentPhase >= WORKFLOW_CONFIG.phaseCount) {
      return null;
    }
    return WORKFLOW_CONFIG.phases.find(p => p.number === this.currentPhase + 1);
  }

  isComplete() {
    // Check if workflow is complete via either:
    // 1. project.phase > phaseCount (new projects that were properly advanced)
    // 2. All phases have completed: true (legacy projects)
    if ((this.project.phase || 1) > WORKFLOW_CONFIG.phaseCount) {
      return true;
    }
    // Fallback: check if all phases are marked as completed
    const phases = this.project.phases;
    if (phases) {
      return WORKFLOW_CONFIG.phases.every(p => phases[p.number]?.completed === true);
    }
    return false;
  }

  advancePhase() {
    // Allow advancing up to phase 4 (complete state)
    if (this.currentPhase <= WORKFLOW_CONFIG.phaseCount) {
      this.currentPhase++;
      this.project.phase = this.currentPhase;
      return true;
    }
    return false;
  }

  previousPhase() {
    if (this.currentPhase > 1) {
      this.currentPhase--;
      this.project.phase = this.currentPhase;
      return true;
    }
    return false;
  }

  /**
     * Generate prompt for current phase
     */
  async generatePrompt() {
    switch (this.currentPhase) {
    case 1:
      return await generatePhase1Prompt(this.project.formData || {});
    case 2:
      return await generatePhase2Prompt(this.project.phase1_output || '');
    case 3:
      return await generatePhase3Prompt(
        this.project.phase1_output || '',
        this.project.phase2_output || ''
      );
    default:
      throw new Error(`Invalid phase: ${this.currentPhase}`);
    }
  }

  savePhaseOutput(output) {
    const phaseKey = `phase${this.currentPhase}_output`;
    this.project[phaseKey] = output;
    this.project.updatedAt = new Date().toISOString();
  }

  getPhaseOutput(phaseNumber) {
    return getPhaseOutputInternal(this.project, phaseNumber);
  }

  /**
     * Export final PR-FAQ as Markdown (validator-compatible format)
     */
  exportAsMarkdown() {
    // For PR-FAQ, we export only the final phase 3 output
    // which should be the polished, validator-ready document
    const finalOutput = this.getPhaseOutput(3);
    const footer = `

---

*Generated with [PR-FAQ Assistant](https://bordenet.github.io/pr-faq-assistant/)*

**📋 Ready to iterate?** Validate and improve your PR-FAQ with the [PR-FAQ Validator](https://bordenet.github.io/pr-faq-assistant/validator/) — get actionable feedback to strengthen your document.`;

    if (finalOutput) {
      return finalOutput + footer;
    }

    // Fallback: export phase 1 output if phase 3 not complete
    const phase1Output = this.getPhaseOutput(1);
    if (phase1Output) {
      return phase1Output + footer;
    }

    return `# ${this.project.title}\n\nNo PR-FAQ content generated yet.`;
  }

  getProgress() {
    return Math.round((this.currentPhase / WORKFLOW_CONFIG.phaseCount) * 100);
  }
}

export function getPhaseMetadata(phaseNumber) {
  return WORKFLOW_CONFIG.phases.find(p => p.number === phaseNumber);
}

export function exportFinalDocument(project) {
  const workflow = new Workflow(project);
  return workflow.exportAsMarkdown();
}

/**
 * Generate export filename for a project
 * @param {Object} project - Project object
 * @returns {string} Filename with .md extension
 */
export function getExportFilename(project) {
  const title = project.title || project.name || 'pr-faq';
  // Sanitize filename: remove special chars, replace spaces with hyphens
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  return `${sanitized}.md`;
}

/**
 * Detect if text appears to be a prompt rather than an AI response.
 * Prompts have distinctive patterns that AI responses typically don't have.
 * @param {string} text - The text to check
 * @returns {{ isPrompt: boolean, reason: string }} Detection result
 */
export function detectPromptPaste(text) {
  if (!text || typeof text !== 'string') {
    return { isPrompt: false, reason: '' };
  }

  const trimmed = text.trim();
  const first500Chars = trimmed.substring(0, 500).toLowerCase();

  // Pattern 1: Starts with "# Phase N:" header (very strong signal)
  if (/^#\s*phase\s*\d+\s*:/im.test(trimmed)) {
    return {
      isPrompt: true,
      reason: 'This looks like the prompt you copied, not the AI response. Please paste the AI\'s answer instead.'
    };
  }

  // Pattern 2: Contains template variables like {{VARIABLE_NAME}}
  const templateVarMatches = trimmed.match(/\{\{[A-Z_]+\}\}/g);
  if (templateVarMatches && templateVarMatches.length >= 2) {
    return {
      isPrompt: true,
      reason: 'This contains template placeholders ({{...}}). Please paste the AI response, not the prompt.'
    };
  }

  // Pattern 3: Contains instruction phrases typical of prompts (check first 500 chars)
  const promptPhrases = [
    'you are an expert',
    'your task',
    '## your task',
    'instructions for',
    'please analyze the following',
    'please provide',
    'generate a',
    'based on the information provided',
    'follow this structure',
    '## output format',
    '## guidelines',
    '## review criteria',
    'forget all previous sessions'
  ];

  const matchedPhrases = promptPhrases.filter(phrase => first500Chars.includes(phrase));
  if (matchedPhrases.length >= 2) {
    return {
      isPrompt: true,
      reason: 'This looks like instructions for the AI, not the AI\'s response. Please paste what the AI wrote back to you.'
    };
  }

  // Pattern 4: Starts with common prompt headers
  const promptHeaders = [
    /^#\s*phase\s*\d+/im,
    /^#\s*prompt/im,
    /^#\s*instructions/im,
    /^\*\*instructions/im
  ];

  for (const pattern of promptHeaders) {
    if (pattern.test(trimmed)) {
      return {
        isPrompt: true,
        reason: 'This appears to be a prompt header. Please paste the AI\'s response instead.'
      };
    }
  }

  return { isPrompt: false, reason: '' };
}
