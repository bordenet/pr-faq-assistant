/**
 * AI Mock Module
 * Provides mock AI responses for testing (localhost only)
 */

// Mock responses for each phase
const mockResponses = {
  1: `# [Product Name] - Press Release

**[City, State] - [Date]** — Today, [Company] announced [Product Name], a revolutionary solution that [key benefit].

## The Problem

[Target customers] have long struggled with [problem]. This leads to [negative consequences], costing [quantifiable impact].

## The Solution

[Product Name] addresses this by [how it works]. Key features include:

- **[Feature 1]**: [Benefit]
- **[Feature 2]**: [Benefit]
- **[Feature 3]**: [Benefit]

## Customer Quote

"[Product Name] has transformed how we [activity]," said [Customer Name], [Title] at [Company]. "[Specific benefit achieved]."

## Getting Started

[Product Name] is available starting [date]. To learn more, visit [website].

---

## FAQ

**Q: Who is this for?**
A: [Target customer description]

**Q: How much does it cost?**
A: [Pricing information]

**Q: How is this different from existing solutions?**
A: [Differentiation points]`,

  2: `## Review Feedback

### Strengths
1. Clear problem statement with quantifiable impact
2. Well-structured press release format
3. Includes customer perspective

### Areas for Improvement
1. **Headline**: Could be more specific about the benefit
2. **Problem section**: Add more concrete data points
3. **FAQ**: Expand with more customer questions
4. **Call to action**: Make it more compelling

### Suggested Revisions
- Replace generic placeholders with specific details
- Add a "What's Next" section for roadmap
- Include competitive differentiation
- Strengthen the customer quote with metrics`,

  3: `# [Product Name] - Press Release (Final)

**[City, State] - [Date]** — [Company] today announced [Product Name], delivering [specific measurable benefit] for [target customers].

## The Problem We're Solving

Every day, [target customers] waste [specific time/money] dealing with [specific problem]. Traditional solutions fall short because [reason]. The result: [quantified negative impact].

## Introducing [Product Name]

[Product Name] is a [category] that [core value proposition]. Unlike [alternatives], it [key differentiator].

### Key Capabilities

1. **[Capability 1]**: [Specific benefit with metric]
2. **[Capability 2]**: [Specific benefit with metric]
3. **[Capability 3]**: [Specific benefit with metric]

## Customer Success

"Since implementing [Product Name], we've [specific achievement]," said [Name], [Title] at [Customer Company]. "What used to take [old time] now takes [new time]."

## Availability

[Product Name] launches [date] with [pricing/availability details]. Visit [URL] to [specific action].

---

## Frequently Asked Questions

**Q: Who should use [Product Name]?**
A: [Product Name] is ideal for [specific persona] who need to [job to be done].

**Q: What makes this different?**
A: Unlike [competitor approach], [Product Name] [unique approach] resulting in [benefit].

**Q: What does it cost?**
A: [Specific pricing] with [terms].

**Q: How do I get started?**
A: [Specific steps to begin].`
};

let mockModeEnabled = false;

/**
 * Initialize mock mode from localStorage
 */
export function initMockMode() {
  const saved = localStorage.getItem('aiMockMode');
  mockModeEnabled = saved === 'true';

  // Show toggle only on localhost
  if (isLocalhost()) {
    const toggle = document.getElementById('aiMockToggle');
    if (toggle) {
      toggle.classList.remove('hidden');
      const checkbox = document.getElementById('mockModeCheckbox');
      if (checkbox) {
        checkbox.checked = mockModeEnabled;
      }
    }
  }

  return mockModeEnabled;
}

/**
 * Check if running on localhost
 */
function isLocalhost() {
  return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === '';
}

/**
 * Set mock mode enabled/disabled
 */
export function setMockMode(enabled) {
  mockModeEnabled = enabled;
  localStorage.setItem('aiMockMode', enabled.toString());

  const checkbox = document.getElementById('mockModeCheckbox');
  if (checkbox) {
    checkbox.checked = enabled;
  }

  return mockModeEnabled;
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode() {
  return mockModeEnabled;
}

/**
 * Get mock response for a phase
 */
export function getMockResponse(phaseNumber) {
  return mockResponses[phaseNumber] || 'Mock response not available for this phase.';
}

