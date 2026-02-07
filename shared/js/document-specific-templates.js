/**
 * Document-Specific Templates for PR-FAQ
 * Pre-filled content for common PR-FAQ use cases
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
    name: 'Product Launch',
    icon: '🆕',
    description: 'Announce new product/feature',
    productName: '[Product Name] [Version]',
    companyName: '[Company]',
    targetCustomer: '[Target audience - be specific about role, industry, company size]',
    problem: 'Customers currently struggle with [pain point] which costs them [time/money/effort]. Existing solutions are [inadequate because...].',
    solution: '[Product] solves this by [approach]. Customers simply [action] to get [result].',
    benefits: '- [Benefit 1 with specific outcome]\n- [Benefit 2 with specific outcome]\n- [Benefit 3 with specific outcome]',
    metrics: '[X]% faster, $[Y] saved, [Z]x improvement',
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

