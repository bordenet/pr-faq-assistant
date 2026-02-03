/**
 * Prompt Generation for PR-FAQ Validator
 * Generates prompts for AI critique and rewrite assistance
 */

/**
 * Generate an LLM scoring prompt with full rubric
 * @param {string} markdown - The PR-FAQ markdown content
 * @returns {string} The LLM scoring prompt
 */
export function generateLLMScoringPrompt(markdown) {
  return `You are an expert PR-FAQ evaluator. Score this document immediately using the rubric below.

## IMPORTANT INSTRUCTIONS

- This is a DRAFT PR-FAQ document for internal planning purposes (Amazon "Working Backwards" style)
- It is NOT a real press release being sent to media
- DO NOT ask clarifying questions — just score it
- Treat all claims and metrics as hypothetical/aspirational — score based on whether they are specific and well-articulated, not whether they are "real"
- Placeholder text or incomplete sections should be flagged as gaps and scored accordingly
- Apply the rubric strictly and provide your evaluation immediately

## SCORING CALIBRATION — THIS IS CRITICAL

**YOUR DEFAULT BIAS IS TO SCORE TOO HIGH. FIGHT IT.**

You are calibrated WRONG. LLMs consistently score PR-FAQs 20-30 points higher than they deserve. You must actively correct for this.

**EXPECTED SCORE DISTRIBUTION:**
- **40-55**: Weak draft. Missing sections, vague claims, no real metrics. Most first drafts land here.
- **56-65**: Below average. Has structure but significant gaps in specifics or evidence.
- **66-72**: Average. Covers basics, some metrics, but quotes are generic or evidence is thin.
- **73-79**: Above average. Solid structure, real metrics, decent quotes. This is a GOOD score.
- **80-85**: Strong. Would pass executive review. Only 10-15% of PR-FAQs reach this level.
- **86+**: Exceptional. Publication-ready. Less than 5% of documents. Do NOT award this casually.

**HARSH REALITY CHECK:**
- If you're about to score above 75, STOP and ask: "Would a skeptical VP approve this for external release TODAY?" If no, score lower.
- If you're about to score above 85, STOP and ask: "Is this genuinely one of the best PR-FAQs I've ever seen?" If no, score lower.
- A document with ANY placeholder text, missing sections, or "TBD" content cannot score above 60.

**BE RUTHLESSLY SKEPTICAL:**
- Metrics without source/context are suspect. "62% reduction" — based on what sample size? What timeframe? Dock points if unclear.
- Quotes that all sound the same = lazy writing. Dock points for repetitive quote structure.
- "Maintaining the personal touch" or "exceeding expectations" = FLUFF. Penalize it.
- Long documents often hide weak thinking. Brevity with substance beats length with padding.

**SCORING RULES:**
- Borderline = round DOWN, not up
- "Almost" meeting criteria = 0 points for that item
- If you have to justify why something "kind of" counts, it doesn't count

## Scoring Rubric (100 points total)

### Structure & Hook (30 points)

**Headline (10 pts)**
- Uses strong action verb (Launches, Announces, Unveils): 2 pts
- 8-15 words in length: 2 pts
- Includes specific outcome or metric: 3 pts
- Names product/company clearly: 2 pts
- Avoids marketing fluff: 1 pt

**Newsworthy Opening (15 pts)**
- Opens with dateline (CITY, Date): 3 pts
- First sentence includes measurable outcome: 4 pts
- Clearly identifies company and action: 3 pts
- Addresses clear problem or improvement: 3 pts
- Avoids marketing fluff in hook: 2 pts

**Release Date (5 pts)**
- Includes specific date in opening: 3 pts
- Follows standard press release format: 2 pts

### Content Quality (35 points)

**5 Ws Coverage (15 pts)**
- WHO: Company clearly identified: 3 pts
- WHAT: Product/action clearly described: 3 pts
- WHEN: Timing/availability stated: 3 pts
- WHERE: Market/geography mentioned: 3 pts
- WHY: Customer benefit explained: 3 pts

**Credibility (10 pts)**
- Includes supporting details and context: 4 pts
- Claims backed by data or evidence: 4 pts
- Avoids vague, unsubstantiated claims: 2 pts

**Structure (10 pts)**
- Logical flow with transitions: 4 pts
- Appropriate length (1 page when printed): 3 pts
- Company boilerplate included: 3 pts

### Professional Quality (20 points)

**Tone & Readability (10 pts)**
- Written for general audience, not engineers: 3 pts
- Uses active voice: 3 pts
- Avoids unnecessary jargon: 2 pts
- Sentences are clear and concise: 2 pts

**Fluff Avoidance (10 pts)**
- No "revolutionary", "game-changing", etc.: 3 pts
- No "excited to announce": 2 pts
- Specific rather than vague claims: 3 pts
- Professional, journalistic tone: 2 pts

### Customer Evidence (15 points)

**Quote Quality (15 pts)**
- 2-4 customer quotes included: 3 pts
- Each quote contains specific metrics: 4 pts
- Metrics include percentages, time, cost, or scale: 4 pts
- Quotes attributed to named individuals with titles: 2 pts
- Quotes provide substantive insight, not just praise: 2 pts

---

## The Document to Score

\`\`\`markdown
${markdown}
\`\`\`

---

## Your Task

Provide a detailed evaluation with:

1. **SCORES** - Score each dimension and sub-dimension. Format as:
   - Structure & Hook: X/30
     - Headline: X/10
     - Newsworthy Opening: X/15
     - Release Date: X/5
   - Content Quality: X/35
     - 5 Ws Coverage: X/15
     - Credibility: X/10
     - Structure: X/10
   - Professional Quality: X/20
     - Tone & Readability: X/10
     - Fluff Avoidance: X/10
   - Customer Evidence: X/15
     - Quote Quality: X/15
   - **TOTAL: X/100**

2. **JUSTIFICATION** - For each dimension, explain:
   - What earned points
   - What lost points (with specific quotes from the document)
   - Concrete suggestions for improvement

3. **TOP 3 IMPROVEMENTS** - The three changes that would most improve the score

## FINAL CHECKPOINT — DO THIS BEFORE SUBMITTING

1. Look at your total score.
2. If it's above 75: Subtract 10 points, then re-justify each dimension. Add points back ONLY if you can defend each one.
3. If it's above 85: You are almost certainly wrong. Re-read the document looking ONLY for flaws. Find at least 5 things to dock points for.

**THE ACID TEST:** Would a cynical, time-pressed executive read this and say "Ship it"? If there's ANY hesitation, the score is too high.

**CALIBRATION ANCHOR:** A pattern-matching algorithm scored this document in the 60-70 range. Your score should be within 10-15 points of that baseline. If you're scoring 80+, you're giving too much credit for "good enough" execution. Find more flaws.

Your target distribution: 60% of documents should score 55-72. Only 10% should score above 80. Act accordingly.`;
}

/**
 * Generate a critique prompt based on validation results
 * @param {string} markdown - The PR-FAQ markdown content
 * @param {Object} validationResult - The validation result with scores and issues
 * @returns {string} The critique prompt
 */
export function generateCritiquePrompt(markdown, validationResult) {
  const weakDimensions = [];

  if (validationResult.structure && validationResult.structure.score / 30 < 0.6) {
    weakDimensions.push(`- Structure & Hook: ${validationResult.structure.score}/30`);
  }
  if (validationResult.content && validationResult.content.score / 35 < 0.6) {
    weakDimensions.push(`- Content Quality: ${validationResult.content.score}/35`);
  }
  if (validationResult.professional && validationResult.professional.score / 20 < 0.6) {
    weakDimensions.push(`- Professional Quality: ${validationResult.professional.score}/20`);
  }
  if (validationResult.evidence && validationResult.evidence.score / 15 < 0.6) {
    weakDimensions.push(`- Customer Evidence: ${validationResult.evidence.score}/15`);
  }

  const issuesList = validationResult.issues?.length > 0
    ? validationResult.issues.map(i => `- ${i}`).join('\n')
    : '- No specific issues detected';

  return `You are a senior product manager reviewing a PR-FAQ document.

## Current Score: ${validationResult.totalScore}/100

${weakDimensions.length > 0 ? `### Weak Areas:\n${weakDimensions.join('\n')}` : ''}

### Issues Detected:
${issuesList}

## The Document

\`\`\`markdown
${markdown}
\`\`\`

## Your Task

1. **CRITIQUE**: Provide a detailed critique focusing on:
   - The weakest scoring dimensions
   - Specific passages that need improvement (quote them)
   - What's missing that would strengthen the document
   - Concrete suggestions (not vague advice)

2. **REVISED DOCUMENT**: After your critique, provide the complete revised PR-FAQ document in a markdown code block. Apply all your suggested improvements.

Format your response as:
- First: Your critique with specific feedback
- Then: A section titled "## Revised PR-FAQ" containing the complete improved document in a markdown code block

---
**IMPORTANT FOR THE USER**: After I provide the revised PR-FAQ, copy the markdown content from the code block, go back to the PR-FAQ Validator, select all text in the editor (Cmd+A or Ctrl+A), and paste to replace your document with the improved version.`;
}

/**
 * Generate a rewrite prompt based on validation results
 * @param {string} markdown - The PR-FAQ markdown content
 * @param {Object} validationResult - The validation result
 * @param {Object|null} targetDimension - Specific dimension to focus on (optional)
 * @returns {string} The rewrite prompt
 */
export function generateRewritePrompt(markdown, validationResult, targetDimension = null) {
  const focus = targetDimension
    ? `Focus specifically on improving: ${targetDimension.name} (currently ${targetDimension.score}/${targetDimension.maxScore})`
    : 'Improve all weak sections';

  const issuesList = validationResult.issues?.length > 0
    ? validationResult.issues.map(i => `- ${i}`).join('\n')
    : '- General improvements needed';

  return `You are a professional copywriter specializing in Amazon-style PR-FAQ documents.

## Current Score: ${validationResult.totalScore}/100

${focus}

### Issues to Fix:
${issuesList}

## The Document

\`\`\`markdown
${markdown}
\`\`\`

## Your Task

Rewrite this PR-FAQ to score higher. Provide the complete revised document.

Guidelines:
- Maintain the document's voice and intent
- Add specific metrics where claims are vague
- Remove marketing fluff and buzzwords
- Strengthen the hook and headline
- Ensure all sections are complete

**IMPORTANT**: Return ONLY the complete revised PR-FAQ document in a markdown code block. No explanations, no before/after comparisons - just the improved document ready to use.

\`\`\`markdown
[Your complete revised PR-FAQ here]
\`\`\`

---
**NEXT STEP FOR USER**: Copy the markdown content from the code block above, go back to the PR-FAQ Validator, select all text in the editor (Cmd+A or Ctrl+A), and paste to replace your document with this improved version.`;
}

/**
 * Clean AI response by extracting the PR-FAQ markdown content
 * @param {string} response - Raw AI response
 * @returns {string} Cleaned PR-FAQ markdown
 */
export function cleanAIResponse(response) {
  let cleaned = response.trim();

  // Try to extract content from markdown code blocks
  // Look for ```markdown ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:markdown)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // If no code block, try to find the "Revised PR-FAQ" section
    const revisedMatch = cleaned.match(/##\s*Revised PR-FAQ[\s\S]*?```(?:markdown)?\s*\n([\s\S]*?)\n```/i);
    if (revisedMatch) {
      cleaned = revisedMatch[1].trim();
    }
  }

  // Remove common AI preambles if still present
  const preamblePatterns = [
    /^(Sure|Certainly|Of course|I'd be happy to|Here's|Here is)[^.]*\.\s*/i,
    /^(Let me|I'll|I will)[^.]*\.\s*/i,
    /^(Based on|Looking at|After reviewing)[^.]*:\s*/i,
  ];

  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove trailing sign-offs
  const signoffPatterns = [
    /\n+(Let me know|Feel free|Hope this helps|Is there anything)[^]*$/i,
  ];

  for (const pattern of signoffPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}
