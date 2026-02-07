/**
 * Document-Specific Templates for PR-FAQ
 *
 * These are PRESETS of the same canonical Amazon PR-FAQ structure, not different templates.
 * All PR-FAQs follow the same format: 1-page Press Release + multi-page FAQ.
 * The presets differ in WHO the "customer" is and what FAQ questions are emphasized.
 *
 * Based on authentic Amazon "Working Backwards" methodology:
 * - Bryar & Carr "Working Backwards" book
 * - SVPG, Commoncog, and ex-Amazonian sources
 *
 * @module document-specific-templates
 */

/**
 * @typedef {Object} PRFAQTemplate
 * @property {string} id - Unique template identifier
 * @property {string} name - Display name
 * @property {string} icon - Emoji icon
 * @property {string} description - Short description
 * @property {string} productName - Pre-filled product name
 * @property {string} companyName - Pre-filled company name
 * @property {string} targetCustomer - Pre-filled target customer
 * @property {string} problem - Pre-filled problem statement
 * @property {string} solution - Pre-filled solution
 * @property {string} benefits - Pre-filled benefits
 * @property {string} metrics - Pre-filled metrics
 * @property {string} location - Pre-filled location
 */

/** @type {Record<string, PRFAQTemplate>} */
export const DOCUMENT_TEMPLATES = {
  blank: {
    id: 'blank',
    name: 'Blank',
    icon: '📄',
    description: 'Start from scratch',
    productName: '',
    companyName: '',
    targetCustomer: '',
    problem: '',
    solution: '',
    benefits: '',
    metrics: '',
    location: 'Seattle, WA'
  },
  productLaunch: {
    id: 'productLaunch',
    name: 'Customer Product',
    icon: '🆕',
    description: 'New product or major feature for external customers',
    productName: '[Product Name] [Version]',
    companyName: '[Company]',
    targetCustomer: '[Target audience - be specific about role, industry, company size]',
    problem: 'Customers currently struggle with [pain point] which costs them [time/money/effort]. Existing solutions are [inadequate because...].',
    solution: '[Product] solves this by [approach]. Customers simply [action] to get [result].',
    benefits: '- [Benefit 1 with specific outcome]\n- [Benefit 2 with specific outcome]\n- [Benefit 3 with specific outcome]',
    metrics: '[X]% faster, $[Y] saved, [Z]x improvement',
    location: 'Seattle, WA'
  },
  internalPlatform: {
    id: 'internalPlatform',
    name: 'Internal Platform',
    icon: '🔧',
    description: 'Internal tool or platform for engineering/ops teams',
    productName: '[Platform Name]',
    companyName: '[Company]',
    targetCustomer: '[Internal teams - e.g., "backend engineers", "DevOps teams", "data scientists"]',
    problem: 'Internal teams currently spend [X hours/week] on [manual process]. This leads to [reliability issues/slow deployments/inconsistent practices].',
    solution: '[Platform] provides [capability] that [automates/standardizes/simplifies] [process]. Teams can [action] without [previous friction].',
    benefits: '- Reduces [process] time from [X] to [Y]\n- Improves [reliability metric] by [Z]%\n- Eliminates [manual step/toil]',
    metrics: '[X]% reduction in deployment time, [Y]% fewer incidents, [Z] hours/week saved per team',
    location: 'Seattle, WA'
  },
  processImprovement: {
    id: 'processImprovement',
    name: 'Process Initiative',
    icon: '⚙️',
    description: 'Major operational or process improvement',
    productName: '[Initiative Name]',
    companyName: '[Company]',
    targetCustomer: '[Affected teams/roles - e.g., "engineering managers", "all product teams", "support staff"]',
    problem: 'Currently, [process] requires [X steps/hours/people]. This causes [delays/errors/frustration] and costs [time/money/quality].',
    solution: '[Initiative] changes [process] by [approach]. Teams will [new workflow] instead of [old workflow].',
    benefits: '- Reduces cycle time from [X] to [Y]\n- Improves [quality metric] by [Z]%\n- Frees up [N hours/week] for higher-value work',
    metrics: '[X]% faster cycle time, [Y]% reduction in defects, [Z] hours/week reclaimed',
    location: 'Seattle, WA'
  }
};

/**
 * Get a template by ID
 * @param {string} templateId - The template ID
 * @returns {PRFAQTemplate|null} The template or null if not found
 */
export function getTemplate(templateId) {
  return DOCUMENT_TEMPLATES[templateId] || null;
}

/**
 * Get all templates as an array
 * @returns {PRFAQTemplate[]} Array of all templates
 */
export function getAllTemplates() {
  return Object.values(DOCUMENT_TEMPLATES);
}

