# ADVERSARIAL REVIEW: pr-faq-assistant

## CONTEXT

You are an expert prompt engineer performing an **ADVERSARIAL review** of LLM prompts for a PR-FAQ assistant tool. This tool generates Amazon-style "Working Backwards" documents with Press Release and FAQs.

This tool uses a **3-phase LLM chain** plus **dual scoring systems**:
1. **Phase 1 (Claude)** - Generates initial PR-FAQ draft
2. **Phase 2 (Gemini)** - Reviews for rigor and logic
3. **Phase 3 (Claude)** - Synthesizes final PR-FAQ
4. **LLM Scoring (prompts.js)** - Sends document to LLM for evaluation
5. **JavaScript Scoring (validator.js)** - Deterministic regex/pattern matching

---

## ⚠️ CRITICAL: WORKING BACKWARDS PHILOSOPHY

A PR-FAQ is a **logic test**, not marketing:
- Press Release defines customer value proposition
- External FAQ anticipates customer objections
- Internal FAQ is where the idea gets "punched in the face" (risks, costs, hard truths)

**Key Question:** If the metrics in the PR are achieved, does the business case in the Internal FAQ close?

---

## CURRENT TAXONOMY (5 dimensions, 100 pts total)

| Dimension | prompts.js | validator.js | Weight Description |
|-----------|------------|--------------|-------------------|
| Structure & Hook | 20 pts | 20 pts | Headline, newsworthy opening, price/availability |
| Content Quality | 20 pts | 20 pts | 5 Ws, mechanism clarity, competitive differentiation |
| Professional Quality | 15 pts | 15 pts | Tone, fluff avoidance |
| External FAQ | 25 pts | 25 pts | Customer objections, comparison, usage |
| Internal FAQ | 20 pts | 20 pts | Business model, risks, team/dependencies |

---

## COMPONENT 1: phase1.md (Claude - Initial Draft)

See: `shared/prompts/phase1.md` (203 lines)

**Key Elements:**

### Headline (8 pts)
- Strong action verb (Launches, Announces, Unveils): 2 pts
- 8-15 words: 2 pts
- Includes MECHANISM (how, not just what): 2 pts
- Includes specific metric: 2 pts

✅ GOOD: "Acme Launches DataSync, Using Edge-Caching to Cut Data Migration Time by 75%"
❌ BAD: "Acme Announces Exciting New Data Solution"

### Newsworthy Opening (8 pts)
- Opens with dateline (CITY, Date): 2 pts
- First sentence includes measurable outcome: 2 pts
- Describes customer pain, then relief: 2 pts
- Avoids marketing fluff: 2 pts

### Mechanism Clarity (5 pts)
- Explains HOW it works, not just WHAT: 3 pts
- Specific technical/process change: 2 pts
- ❌ "Uses advanced AI to improve outcomes"
- ✅ "Analyzes 50+ data points per transaction to flag anomalies within 200ms"

---

## COMPONENT 4: prompts.js (LLM Scoring Rubric)

See: `validator/js/prompts.js` (347 lines)

**Calibration (CRITICAL):**
- 40-55: Weak. Missing FAQs, vague claims.
- 56-65: Below average. Structure but softball Internal FAQ.
- 66-72: Average. Basics but no competitive differentiation.
- 73-79: Above average. MINIMUM target.
- 80-85: Strong. Would pass VP review (10-15% of docs).
- 86+: Exceptional. <5% of documents.

---

# YOUR ADVERSARIAL REVIEW TASK

## SPECIFIC QUESTIONS TO ANSWER

### 1. HEADLINE DETECTION
Does validator.js detect all 4 headline elements?

| Element | Points | Validator Detects? |
|---------|--------|-------------------|
| Strong action verb | 2 pts | ? |
| 8-15 words | 2 pts | ? |
| MECHANISM | 2 pts | ? |
| Specific metric | 2 pts | ? |

### 2. DATELINE DETECTION
Phase1.md requires "CITY, Date" format. Does validator.js detect this?

Look for: `dateline`, city patterns, date patterns

### 3. FAQ SECTION DETECTION
Does validator.js distinguish between:
- External FAQ (customer objections)?
- Internal FAQ (business risks, costs)?

### 4. MECHANISM vs FEATURE
prompts.js rewards explaining HOW, not just WHAT. Does validator.js:
- ✅ Detect mechanism language?
- ✅ Penalize feature-only descriptions?

### 5. FLUFF AVOIDANCE
prompts.js penalizes "revolutionary", "game-changing", "excited to announce". Does validator.js detect all?

### 6. SLOP DETECTION
Does validator.js import and apply slop penalties?

```bash
grep -n "getSlopPenalty\|calculateSlopScore\|slop" validator.js
```

---

## DELIVERABLES

### 1. CRITICAL FAILURES
For each issue: Issue, Severity, Evidence, Fix

### 2. ALIGNMENT TABLE
| Component | Dimension | Weight | Aligned? | Issue |

### 3. GAMING VULNERABILITIES
- Fake metrics in headline
- Softball Internal FAQ questions
- Marketing fluff disguised as mechanism

### 4. RECOMMENDED FIXES (P0/P1/P2)

---

**VERIFY CLAIMS. Evidence before assertions.**

