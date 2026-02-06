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
  },
  fundingRound: {
    id: 'fundingRound',
    name: 'Funding Round',
    icon: '💵',
    description: 'Investment announcement',
    productName: 'Series [A/B/C] Funding',
    companyName: '[Company]',
    targetCustomer: 'Investors, partners, and customers in [industry]',
    problem: 'The [industry] market is experiencing [growth/challenge], creating opportunity for [solution type].',
    solution: '[Company] is solving this with [approach]. This funding will accelerate [specific initiatives].',
    benefits: '- Expand [market/region]\n- Scale [team/infrastructure]\n- Launch [new capabilities]',
    metrics: '$[X]M raised, [Y]x valuation, [Z] customers',
    location: 'Seattle, WA'
  },
  companyMilestone: {
    id: 'companyMilestone',
    name: 'Company Milestone',
    icon: '🎉',
    description: 'Celebrate achievement',
    productName: '[Milestone Achievement]',
    companyName: '[Company]',
    targetCustomer: 'Customers, partners, and stakeholders',
    problem: '[Context about the journey and challenges overcome]',
    solution: 'Through [strategy/approach], we achieved [milestone].',
    benefits: '- [What this means for customers]\n- [What this means for the industry]\n- [What comes next]',
    metrics: '[X] customers, $[Y] revenue, [Z]% growth',
    location: 'Seattle, WA'
  },
  crisisResponse: {
    id: 'crisisResponse',
    name: 'Crisis Response',
    icon: '🚨',
    description: 'Address issue transparently',
    productName: '[Issue/Incident] Resolution',
    companyName: '[Company]',
    targetCustomer: 'Affected customers and stakeholders',
    problem: 'On [date], [what happened]. [X] customers were affected for [duration].',
    solution: 'We immediately [actions taken]. Root cause was [explanation]. We have [prevention measures].',
    benefits: '- [Compensation/remediation offered]\n- [Prevention measures implemented]\n- [Commitment to transparency]',
    metrics: '[X]% restored within [time], [Y] support tickets resolved',
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

