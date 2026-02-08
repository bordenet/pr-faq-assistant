# PR-FAQ Assistant Scoring Methods

This document describes the scoring methodology used by the PR-FAQ Validator to evaluate press release / FAQ documents.

## Overview

The validator scores PR/FAQs on a **100-point scale** across five dimensions aligned with Amazon's "Working Backwards" methodology. The scoring system is specifically calibrated to counteract **LLM over-scoring bias**—LLMs consistently rate PR/FAQs 20-30 points higher than deserved.

## Scoring Taxonomy

| Dimension | Points | What It Measures |
|-----------|--------|------------------|
| **Structure & Hook** | 20 | Headline quality, newsworthy hook, release date |
| **Content Quality** | 20 | 5 Ws coverage, structure, credibility |
| **Professional Quality** | 15 | Tone/readability, marketing fluff detection |
| **Customer Evidence** | 10 | Quotes with metrics |
| **FAQ Quality** | 35 | External/internal FAQs, hard questions, softball detection |

## Dimension Details

### 1. Structure & Hook (20 pts)

**Sub-dimensions:**
- **Headline Quality** (12 pts max, scaled): Customer benefit, specificity (numbers/%), mechanism (HOW it works)
- **Newsworthy Hook** (15 pts max, scaled): First paragraph urgency, "today announces" language, specificity
- **Release Date** (5 pts max, scaled): Date present in opening lines

**Detection Patterns:**
- Specificity patterns: `\d+%`, `\d+x`, `\$\d+`, `by \d+`
- Mechanism patterns: "using X", "via X", "through X", "by [method]", "with X"

### 2. Content Quality (20 pts)

**Sub-dimensions:**
- **5 Ws Analysis** (15 pts max, scaled): WHO (company), WHAT (product/service), WHEN (timing), WHERE (location/market)
- **Structure** (10 pts max, scaled): Paragraph count (ideal 3-7), average length, flow
- **Credibility** (10 pts, neutral start): Deductions for marketing hyperbole

**Detection Patterns:**
- Company patterns: `[A-Z][a-z]+ Inc/Corp/Company`, `**CompanyName**`
- Time patterns: date formats, "today", "this week/month"
- Location patterns: "Seattle, WA", dateline format

### 3. Professional Quality (15 pts)

**Sub-dimensions:**
- **Tone & Readability** (10 pts max, scaled): Sentence complexity, paragraph structure
- **Marketing Fluff Detection** (10 pts, full start): Deductions for buzzwords

**Fluff Patterns Detected:**
- revolutionary, groundbreaking, cutting-edge, world-class
- industry-leading, best-in-class, state-of-the-art
- game-changing, disruptive, unprecedented
- excited, thrilled, delighted, proud

### 4. Customer Evidence (10 pts)

**Scoring:**
- 0 quotes: 0 pts (issue: "No customer evidence")
- 1 quote: Partial credit
- 2 quotes with metrics: Full points (ideal standard)
- 3+ quotes: Penalty ("Quote stuffing detected")

**Quote Quality:**
- Base: 2 pts for having metrics
- Bonus: Percentage (+2), ratio (+2), absolute number (+1)
- Maximum per quote: 5 pts

### 5. FAQ Quality (35 pts)

**Structure (15 pts):**
- External FAQ section: 5 pts
- Internal FAQ section: 5 pts
- 3+ external questions: 3 pts
- 3+ internal questions: 2 pts

**Hard Questions (20 pts):**
- Risk patterns: "risk", "fail", "wrong", "worst case"
- Reversibility patterns: "one-way", "two-way", "undo", "roll back"
- Opportunity cost patterns: "opportunity cost", "alternative", "trade-off"

**Softball Detection (penalty):**
- Questions with "risk" or "challenge" + dismissive answers ("minimal", "unlikely", "easy")
- Pattern: Hard keyword + positive context within 30 chars = softball

## Adversarial Robustness

| Gaming Attempt | Why It Fails |
|----------------|--------------|
| Headline without mechanism | Mechanism detection requires "how" language, not just "what" |
| Adding 5+ customer quotes | Quote count penalty applies for >2 quotes |
| Softball FAQ questions | Hard question detection identifies "What if this fails?" style |
| Metric stuffing | Metrics must include context, not raw numbers |
| Fluff-heavy language | Revolutionary/game-changing triggers explicit penalties |

## Calibration Notes

### LLM Bias Correction
When LLMs evaluate their own PR/FAQ output, they grade generously. The validator applies strict scoring where "almost" meeting criteria = 0 points. This prevents 80+ scores for mediocre PR/FAQs.

### 2-Quote Standard
Reflects Amazon's actual PR/FAQ template: one Executive Vision quote (company perspective) and one Customer Relief quote (user perspective).

### Softball Detection
Questions like "Why is this product so great?" score zero. Questions like "What happens if adoption is slower than projected?" score full points.

## Score Interpretation

| Score Range | Grade | Interpretation |
|-------------|-------|----------------|
| 80-100 | A | Exceptional - ready for stakeholder review |
| 60-79 | B | Good - minor improvements needed |
| 40-59 | C | Fair - significant gaps to address |
| 20-39 | D | Poor - major rewrite needed |
| 0-19 | F | Failing - restart from principles |

## Related Files

- `validator/js/validator.js` - Implementation of scoring functions
- `validator/js/prompts.js` - LLM scoring prompt (aligned)
- `shared/prompts/phase1.md` - User-facing instructions (source of truth)

