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

**CRITICAL: This is a "Working Backwards" document. The FAQs are equally important as the Press Release.**

### Structure & Hook (20 points)

**Headline (8 pts)**
- Uses strong action verb (Launches, Announces, Unveils): 2 pts
- 8-15 words in length: 2 pts
- Includes MECHANISM (how, not just what): 2 pts
- Includes specific metric: 2 pts

**Newsworthy Opening (8 pts)**
- Opens with dateline (CITY, Date): 2 pts
- First sentence includes measurable outcome: 2 pts
- Describes customer pain with empathy, then relief: 2 pts
- Avoids marketing fluff in hook: 2 pts

**Price & Availability (4 pts)**
- Includes specific launch date: 2 pts
- Includes pricing or availability info: 2 pts

### Content Quality (20 points)

**5 Ws Coverage (10 pts)**
- WHO: Company clearly identified: 2 pts
- WHAT: Product/action clearly described: 2 pts
- WHEN: Timing/availability stated: 2 pts
- WHERE: Market/geography mentioned: 2 pts
- WHY: Customer benefit explained: 2 pts

**Mechanism Clarity (5 pts)**
- Explains HOW the product works, not just WHAT it does: 3 pts
- Specific technical or process change described: 2 pts

**Competitive Differentiation (5 pts)**
- Identifies the current alternative (what customers do today): 3 pts
- Explains why current alternative is insufficient: 2 pts

### Professional Quality (15 points)

**Tone & Readability (8 pts)**
- Written for general audience, not engineers: 2 pts
- Uses active voice: 2 pts
- Avoids unnecessary jargon: 2 pts
- Sentences are clear and concise: 2 pts

**Fluff Avoidance (7 pts)**
- No "revolutionary", "game-changing", etc.: 3 pts
- No "excited to announce": 2 pts
- Professional, journalistic tone: 2 pts

### Customer Evidence (10 points)

**Quote Quality (10 pts)**
- Exactly 2 quotes (1 Executive Vision, 1 Customer Relief): 3 pts
- Each quote contains specific metrics: 3 pts
- Quotes attributed to named individuals with titles: 2 pts
- Quotes sound like different people with different purposes: 2 pts

### FAQ Quality (35 points) — THE "WORKING BACKWARDS" TEST

**External FAQ (10 pts)**
- 5-7 customer-facing questions present: 3 pts
- Addresses pricing and availability: 2 pts
- Addresses compatibility/migration: 2 pts
- Includes "How is this different from [Alternative]?": 3 pts

**Internal FAQ Presence (10 pts)**
- 5-7 stakeholder questions present: 3 pts
- Addresses business model/unit economics: 3 pts
- Addresses technical dependencies: 2 pts
- Addresses competitive positioning: 2 pts

**Internal FAQ Rigor (15 pts) — MANDATORY HARD QUESTIONS**
- Includes RISK question ("What is the most likely reason this fails?"): 5 pts
- Includes REVERSIBILITY ("Is this a One-Way Door or Two-Way Door?"): 5 pts
- Includes OPPORTUNITY COST ("What are we NOT doing if we build this?"): 5 pts

**FAQ PENALTY:** If Internal FAQ is missing or contains only "softball" questions (no Risk, Reversibility, or Opportunity Cost), cap the maximum total score at 50/100.

---

## The Document to Score

\`\`\`markdown
${markdown}
\`\`\`

---

## Your Task

Provide a detailed evaluation with:

1. **SCORES** - Score each dimension and sub-dimension. Format as:
   - Structure & Hook: X/20
     - Headline: X/8
     - Newsworthy Opening: X/8
     - Price & Availability: X/4
   - Content Quality: X/20
     - 5 Ws Coverage: X/10
     - Mechanism Clarity: X/5
     - Competitive Differentiation: X/5
   - Professional Quality: X/15
     - Tone & Readability: X/8
     - Fluff Avoidance: X/7
   - Customer Evidence: X/10
     - Quote Quality: X/10
   - FAQ Quality: X/35 — **THE "WORKING BACKWARDS" TEST**
     - External FAQ: X/10
     - Internal FAQ Presence: X/10
     - Internal FAQ Rigor: X/15
   - **TOTAL: X/100**

   **FAQ PENALTY CHECK:** If Internal FAQ is missing Risk, Reversibility, OR Opportunity Cost questions, cap total at 50.

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

  if (validationResult.structure && validationResult.structure.score / 20 < 0.6) {
    weakDimensions.push(`- Structure & Hook: ${validationResult.structure.score}/20`);
  }
  if (validationResult.content && validationResult.content.score / 20 < 0.6) {
    weakDimensions.push(`- Content Quality: ${validationResult.content.score}/20`);
  }
  if (validationResult.professional && validationResult.professional.score / 15 < 0.6) {
    weakDimensions.push(`- Professional Quality: ${validationResult.professional.score}/15`);
  }
  if (validationResult.evidence && validationResult.evidence.score / 10 < 0.6) {
    weakDimensions.push(`- Customer Evidence: ${validationResult.evidence.score}/10`);
  }
  if (validationResult.faq && validationResult.faq.score / 35 < 0.6) {
    weakDimensions.push(`- FAQ Quality: ${validationResult.faq.score}/35 — THE "WORKING BACKWARDS" TEST`);
  }

  const issuesList = validationResult.issues?.length > 0
    ? validationResult.issues.map(i => `- ${i}`).join('\n')
    : '- No specific issues detected';

  return `You are a senior product manager helping improve a PR-FAQ document.

## Current Score: ${validationResult.totalScore}/100

${weakDimensions.length > 0 ? `### Weak Areas:\n${weakDimensions.join('\n')}` : ''}

### Issues Detected:
${issuesList}

## The Document

\`\`\`markdown
${markdown}
\`\`\`

## YOUR TASK

Help the author improve this PR-FAQ by asking clarifying questions.

## REQUIRED OUTPUT FORMAT

**Score Summary:** ${validationResult.totalScore}/100

**Top 3 Issues:**
1. [Most critical gap - be specific]
2. [Second most critical gap]
3. [Third most critical gap]

**Questions to Improve Your PR-FAQ:**
1. **[Question about missing/weak area]**
   _Why this matters:_ [How answering this improves the score]

2. **[Question about another gap]**
   _Why this matters:_ [Score impact]

3. **[Question about headline/FAQ/evidence]**
   _Why this matters:_ [Score impact]

(Provide 3-5 questions total, focused on the weakest dimensions)

**Quick Wins (fix these now):**
- [Specific fix that doesn't require user input]
- [Another immediate improvement]

<output_rules>
- Start directly with "**Score Summary:**" (no preamble)
- Do NOT include a revised PR-FAQ document
- Only provide questions and quick wins
- Focus questions on: headline mechanism, customer quotes, FAQ depth
</output_rules>`;
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
