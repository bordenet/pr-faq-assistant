/**
 * PR-FAQ Prompts Module
 * @module prompts
 * Optimized for pr-faq-validator compatibility (target: 70+ score)
 * @module prompts
 *
 * Prompts are stored in prompts/ directory as markdown files.
 * @module prompts
 *
 * Scoring Categories:
 * @module prompts
 * - Structure & Hook: 30 points (headline, dateline, newsworthy opening)
 * - Content Quality: 35 points (5 Ws, credibility, inverted pyramid)
 * - Professional Quality: 20 points (tone, readability, NO fluff)
 * - Customer Evidence: 15 points (quotes with quantitative metrics)
 */

export const WORKFLOW_CONFIG = {
  phaseCount: 3,
  phases: [
    {
      number: 1,
      name: 'Initial Draft',
      icon: '📝',
      aiModel: 'Claude',
      description: 'Generate the first draft of your PR-FAQ using Claude'
    },
    {
      number: 2,
      name: 'Critical Review',
      icon: '🔍',
      aiModel: 'Gemini',
      description: 'Different AI reviews and critiques (prevents groupthink)'
    },
    {
      number: 3,
      name: 'Final Polish',
      icon: '✨',
      aiModel: 'Claude',
      description: 'Synthesize feedback into polished final document'
    }
  ]
};

// Cache for loaded prompt templates
const promptCache = {};

/**
 * Detect base path for shared assets based on current location
 * Works from both root (/) and assistant/ subdirectory
 */
function getSharedBasePath() {
  const path = window.location.pathname;
  // If we're in /assistant/, go up one level to reach /shared/
  if (path.includes('/assistant/') || path.endsWith('/assistant')) {
    return '../shared/';
  }
  // If we're at root, shared/ is a direct child
  return 'shared/';
}

/**
 * Load prompt template from markdown file
 * @module prompts
 */
async function loadPromptTemplate(phaseNumber) {
  if (promptCache[phaseNumber]) {
    return promptCache[phaseNumber];
  }

  try {
    const basePath = getSharedBasePath();
    const response = await fetch(`${basePath}prompts/phase${phaseNumber}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load prompt template for phase ${phaseNumber}`);
    }
    const template = await response.text();
    promptCache[phaseNumber] = template;
    return template;
  } catch (error) {
    console.error(`Error loading prompt template for phase ${phaseNumber}:`, error);
    throw error;
  }
}

/**
 * Preload all prompt templates to avoid network delay on first click.
 * This ensures clipboard operations happen within Safari's transient activation window.
 * Call this when the app initializes or when entering a project view.
 * @returns {Promise<void>}
 */
export async function preloadPromptTemplates() {
  const phases = Array.from({ length: WORKFLOW_CONFIG.phaseCount }, (_, i) => i + 1);
  await Promise.all(phases.map(phase => loadPromptTemplate(phase)));
}

/**
 * Replace template variables with actual values
 * @module prompts
 */
export function replaceTemplateVars(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }

  // Safety check: detect and remove any remaining placeholders
  // Note: [A-Z0-9_]+ includes digits to match PHASE1_OUTPUT, PHASE2_OUTPUT, etc.
  const remaining = result.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (remaining) {
    console.warn('[prompts] Unsubstituted placeholders detected:', remaining);
    result = result.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
  }

  return result;
}

/**
 * Phase 1 Prompt: Initial Draft Generation
 * @module prompts
 * Emphasizes validator requirements from the start
 * @module prompts
 */
export async function generatePhase1Prompt(formData) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const releaseDate = futureDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  const template = await loadPromptTemplate(1);
  return replaceTemplateVars(template, {
    PRODUCT_NAME: formData.productName,
    COMPANY_NAME: formData.companyName,
    TARGET_CUSTOMER: formData.targetCustomer,
    PROBLEM: formData.problem,
    SOLUTION: formData.solution,
    BENEFITS: formData.benefits,
    METRICS: formData.metrics || 'Generate realistic metrics',
    LOCATION: formData.location || 'Seattle, WA',
    RELEASE_DATE: releaseDate
  });
}

/**
 * Phase 2 Prompt: Critical Review
 * @module prompts
 * Different AI reviews for objectivity (prevents groupthink)
 * @module prompts
 */
export async function generatePhase2Prompt(phase1Output) {
  const template = await loadPromptTemplate(2);
  return replaceTemplateVars(template, {
    PHASE1_OUTPUT: phase1Output
  });
}

/**
 * Phase 3 Prompt: Final Polish
 * @module prompts
 * Synthesizes original + critique into final document
 * @module prompts
 */
export async function generatePhase3Prompt(phase1Output, phase2Output) {
  const template = await loadPromptTemplate(3);
  return replaceTemplateVars(template, {
    PHASE1_OUTPUT: phase1Output,
    PHASE2_OUTPUT: phase2Output
  });
}

/**
 * Get phase metadata
 * @module prompts
 */
export function getPhaseMetadata(phaseNumber) {
  return WORKFLOW_CONFIG.phases.find(p => p.number === phaseNumber);
}
