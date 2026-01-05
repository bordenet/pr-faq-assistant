/**
 * PR-FAQ Prompts Module
 * Optimized for pr-faq-validator compatibility (target: 70+ score)
 *
 * Scoring Categories:
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
            aiModel: 'Claude/GPT-4',
            description: 'AI generates initial PR-FAQ from your inputs'
        },
        {
            number: 2,
            name: 'Critical Review',
            aiModel: 'Different AI',
            description: 'Different AI reviews and critiques (prevents groupthink)'
        },
        {
            number: 3,
            name: 'Final Polish',
            aiModel: 'Claude/GPT-4',
            description: 'AI synthesizes feedback into final document'
        }
    ]
};

/**
 * Phase 1 Prompt: Initial Draft Generation
 * Emphasizes validator requirements from the start
 */
export function generatePhase1Prompt(formData) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const releaseDate = futureDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    return `You are an expert at writing Amazon-style PR-FAQ documents. Generate a press release that would score 70+ on the pr-faq-validator tool.

## CRITICAL REQUIREMENTS FOR HIGH SCORES

### Structure (30 points)
- **Headline**: 6-12 words, strong action verb, specific metric if possible
  - Good: "AcmeCorp Launches DataSync, Reducing Data Migration Time by 75%"
  - Bad: "AcmeCorp Announces Exciting New Product"
- **Dateline**: Must include city, state abbreviation, and date
  - Format: "Seattle, WA — ${releaseDate} —"
- **Opening paragraph**: Must answer WHO, WHAT, WHEN, WHERE, WHY in first 2 sentences

### Content Quality (35 points)
- Use inverted pyramid structure (most important info first)
- Include concrete details, not vague claims
- Explain HOW the product works (mechanism)
- Address WHY this matters to customers

### Professional Tone (20 points)
⚠️ AVOID THESE WORDS (they reduce score):
- revolutionary, groundbreaking, cutting-edge, world-class, best-in-class
- excited, pleased, proud, thrilled, delighted (in quotes)
- comprehensive solution, seamless integration, enhanced productivity
- game-changing, innovative, transformative

✅ USE INSTEAD:
- Specific numbers and percentages
- Concrete outcomes and results
- Direct, factual language

### Customer Evidence (15 points)
Include 3-4 customer quotes with QUANTITATIVE METRICS:
- "reduced costs by 40%"
- "saves 2 hours per day"
- "$1.5M in annual savings"
- "3x faster than before"

## INPUT DATA

**Product/Feature Name**: ${formData.productName}
**Company Name**: ${formData.companyName}
**Target Customer**: ${formData.targetCustomer}
**Problem Being Solved**: ${formData.problem}
**Solution/How It Works**: ${formData.solution}
**Key Benefits**: ${formData.benefits}
**Metrics/Results**: ${formData.metrics || 'Generate realistic metrics'}
**Location**: ${formData.location || 'Seattle, WA'}

## OUTPUT FORMAT

Generate a complete PR-FAQ document with:
1. **Press Release** (headline, dateline, body paragraphs, 3-4 customer quotes, boilerplate)
2. **External FAQ** (5-7 questions customers would ask)
3. **Internal FAQ** (5-7 questions stakeholders would ask)

Begin the press release now:`;
}

/**
 * Phase 2 Prompt: Critical Review
 * Different AI reviews for objectivity (prevents groupthink)
 */
export function generatePhase2Prompt(phase1Output) {
    return `You are a critical reviewer for PR-FAQ documents. Your job is to identify weaknesses and suggest improvements based on the pr-faq-validator scoring criteria.

## SCORING CRITERIA TO EVALUATE

### Structure & Hook (30 points)
- [ ] Headline: 6-12 words? Strong action verb? Specific metric?
- [ ] Dateline: City, state abbreviation, date present?
- [ ] Opening: Answers WHO, WHAT, WHEN, WHERE, WHY?
- [ ] Newsworthy hook with timeliness?

### Content Quality (35 points)
- [ ] Inverted pyramid structure (most important first)?
- [ ] All 5 Ws clearly covered?
- [ ] Concrete mechanism explained (HOW it works)?
- [ ] Credibility established?

### Professional Tone (20 points)
- [ ] NO marketing fluff words? (revolutionary, groundbreaking, exciting, etc.)
- [ ] Factual, direct language?
- [ ] Good readability (sentences under 25 words)?
- [ ] No passive voice overuse?

### Customer Evidence (15 points)
- [ ] 3-4 customer quotes present?
- [ ] Each quote has QUANTITATIVE metrics? (%, $, hours, ratios)
- [ ] NO emotional fluff in quotes? (excited, thrilled, pleased)
- [ ] Diverse metric types? (percentages, absolutes, ratios)

## DOCUMENT TO REVIEW

${phase1Output}

## YOUR TASK

Provide a structured critique:

1. **SCORE ESTIMATE**: Estimate the current score (0-100)
2. **STRENGTHS**: What's working well
3. **CRITICAL ISSUES**: Problems that significantly hurt the score
4. **SPECIFIC FIXES**: Line-by-line suggestions with before/after examples
5. **MISSING ELEMENTS**: What needs to be added

Be specific and actionable. Quote exact phrases that need changing.`;
}

/**
 * Phase 3 Prompt: Final Polish
 * Synthesizes original + critique into final document
 */
export function generatePhase3Prompt(phase1Output, phase2Output) {
    return `You are finalizing a PR-FAQ document. Incorporate the review feedback to create a polished document that scores 70+ on the pr-faq-validator.

## ORIGINAL DOCUMENT

${phase1Output}

## CRITICAL REVIEW

${phase2Output}

## YOUR TASK

1. Address ALL critical issues identified in the review
2. Keep what's working well
3. Ensure the final document meets ALL these requirements:

### MANDATORY CHECKLIST
- [ ] Headline: 6-12 words, action verb, specific metric
- [ ] Dateline: "City, ST — Month Day, Year —" format
- [ ] Opening 2 sentences answer WHO, WHAT, WHEN, WHERE, WHY
- [ ] 3-4 customer quotes, EACH with quantitative metric
- [ ] NO fluff words: revolutionary, groundbreaking, excited, thrilled, cutting-edge
- [ ] "About [Company]" boilerplate at end
- [ ] External FAQ: 5-7 customer questions
- [ ] Internal FAQ: 5-7 stakeholder questions

### OUTPUT FORMAT

Produce the FINAL PR-FAQ document only. No commentary or explanations.
Start directly with the headline.`;
}

/**
 * Get phase metadata
 */
export function getPhaseMetadata(phaseNumber) {
    return WORKFLOW_CONFIG.phases.find(p => p.number === phaseNumber);
}

