# Adversarial Review Plan - Genesis Tools

**Created:** 2026-02-08
**Updated:** 2026-02-08
**Purpose:** Recovery document for Gemini-assisted adversarial review process
**Status:** ✅ COMPLETE - pr-faq-assistant, business-justification-assistant | Next: jd-assistant

---

## What We're Doing

We are systematically reviewing all 9 Genesis tools for **5-component alignment**:
1. `phase1.md` - User-facing prompt (generates content)
2. `phase2.md` - Review prompt
3. `phase3.md` - Synthesis prompt  
4. `prompts.js` - LLM scoring prompt (sent to AI evaluator)
5. `validator.js` - JavaScript pattern-matching scorer

**The Problem:** If phase1.md tells users to generate Format X, but prompts.js/validator.js reward Format Y, users get penalized for following instructions.

---

## Review Queue

| # | Tool | Status | Findings File |
|---|------|--------|---------------|
| 1 | pr-faq-assistant | ✅ COMPLETE | `Gemini_Response.md` |
| 2 | business-justification-assistant | ✅ COMPLETE | `Gemini_Response.md` |
| 3 | jd-assistant | ⏳ Queued | TBD |
| 4 | one-pager | ⏳ Queued | TBD |

---

## Process Per Tool

### Step 1: Create Prompt (Agent)
- Read phase1.md, prompts.js, validator.js
- Create self-contained adversarial review prompt
- Copy to clipboard

### Step 2: Run Gemini (User)
- Paste prompt into Gemini
- Save response to `Gemini_Response.md` in the tool's repo
- Tell agent when ready

### Step 3: Verify Findings (Agent)
- Read `Gemini_Response.md`
- **CRITICAL:** Verify each claim against actual code
- Previous experience: ~75% of Gemini findings are FALSE POSITIVES
- Categorize as: REAL ISSUE, FALSE POSITIVE, or NEEDS INVESTIGATION

### Step 4: Implement Fixes (Agent)
- Fix REAL ISSUES only
- Run tests to confirm no regressions
- Commit with descriptive message

### Step 5: GENERALIZE (Agent)
- **Check sibling repos for same pattern**
- If phase1.md→validator.js mismatch exists in pr-faq, likely exists in others
- Apply same fix pattern across all affected repos
- Track in this document

---

## Gemini Findings Verification (pr-faq-assistant)

### Finding A: Mechanism Detection Gap
- **Gemini Claim:** validator.js has "zero logic" to detect mechanism in headline
- **Verification:** ✅ **REAL ISSUE** - Confirmed. `analyzeHeadlineQuality()` checks length, verbs, metrics, banned words - NO mechanism detection
- **Impact:** 2 pts mismatch between LLM and JS scorer
- **Fix:** Add mechanism detection (patterns: "using", "via", "through", "by", "with")

### Finding B: Quote Count Collision
- **Gemini Claim:** validator.js rewards more quotes, doesn't enforce "exactly 2"
- **Verification:** ⚠️ **PARTIAL** - Line 211-214 shows validator DOES flag >2 quotes as an issue, but doesn't penalize score
- **Evidence:** `if (quotes.length > 2) { result.issues.push('Consider reducing to 2 quotes...') }`
- **Impact:** Issue flagged but no score penalty - LLM would penalize, JS doesn't
- **Fix:** Add score penalty for 3+ quotes

### Finding C: Softball Loophole
- **Gemini Claim:** Keyword-based detection is gameable ("Is there a risk this is too successful?")
- **Verification:** ✅ **REAL ISSUE** - Confirmed. `checkHardQuestions()` uses simple regex `/risk/i` with no context
- **Impact:** 15 pts can be gamed with softball questions containing keywords
- **Fix:** Add softball detection pattern (risk + positive sentiment = softball)

### Finding D: Metric Spam Gaming
- **Gemini Claim:** "0% risk" or "1% better" triggers metric points without value
- **Verification:** ⚠️ **LOW PRIORITY** - True but edge case, hard to fix without NLP
- **Action:** Document as known limitation, don't fix now

### Finding E: About Section Hack
- **Gemini Claim:** Boilerplate "About" section can satisfy WHO requirement
- **Verification:** ❌ **FALSE POSITIVE** - `analyzeFiveWs()` checks first 2-3 paragraphs only (line 474-478)
- **Evidence:** `for (let i = 0; i < Math.min(3, paragraphs.length); i++)`

---

## Prioritized Fixes

| Priority | Issue | Impact | Effort | Generalizable? |
|----------|-------|--------|--------|----------------|
| P0 | Mechanism detection | 2 pts | Low | Yes - all tools with headlines |
| P1 | Quote count penalty | 3 pts | Low | Yes - tools with quote requirements |
| P2 | Softball detection | 15 pts | Medium | Yes - tools with hard question requirements |

---

## Generalization Patterns Found

### Pattern 1: Mechanism Detection Missing
- **Found in:** pr-faq-assistant
- **Checked in:** one-pager, business-justification-assistant, strategic-proposal, product-requirements-assistant
- **Verdict:** ❌ N/A - Mechanism detection is **PR-FAQ specific**. Only pr-faq-assistant has `analyzeHeadlineQuality()` (press release headlines). Other tools use Problem/Solution/Impact scoring.
- **Fix applied to:** pr-faq-assistant only

### Pattern 2: Quote Count Not Enforced
- **Found in:** pr-faq-assistant
- **Checked in:** one-pager, business-justification-assistant, product-requirements-assistant
- **Verdict:** ❌ N/A - Quote count is **PR-FAQ specific**. The "exactly 2 quotes" standard (1 Executive Vision + 1 Customer Relief) is a PR-FAQ format convention. Other tools don't have structured quote requirements.
- **Fix applied to:** pr-faq-assistant only

### Pattern 3: Keyword-Only Hard Question Detection (Softball Vulnerability)
- **Found in:** pr-faq-assistant
- **Checked in:** product-requirements-assistant (door type detection), strategic-proposal (risk detection), business-justification-assistant
- **Verdict:** ❌ N/A - Softball detection is **PR-FAQ specific**. Other tools use door/risk patterns differently:
  - **PRD:** Door type detection tags *requirements* (not FAQ questions) as reversible/irreversible
  - **Strategic Proposal:** Risk detection counts keywords in *document sections* (not FAQ questions)
  - **Business Justification:** Cost-of-inaction detection is for *document sections* (not FAQ questions)
- The softball attack ("risk of success") only works against FAQ-style hard question detection, which only exists in pr-faq-assistant.
- **Fix applied to:** pr-faq-assistant only

---

## What Agent Will Do With Gemini Response

1. **Parse the response** - Extract Critical Failures, Alignment Table, Gaming Vulnerabilities, Prioritized Fixes
2. **Verify each claim** - Grep validator.js for claimed missing patterns
3. **Categorize findings:**
   - ✅ REAL: Code change needed
   - ❌ FALSE POSITIVE: Feature exists, Gemini missed it
   - 🔍 INVESTIGATE: Unclear, needs manual review
4. **For REAL issues:**
   - Determine if it's a prompts.js issue, validator.js issue, or phase1.md issue
   - Implement fix
   - Run `npm test`
   - Commit
5. **For GENERALIZABLE patterns:**
   - Search all 9 repos for same issue
   - Apply fix to all affected repos
   - Track in this document

---

## Recovery Information

If agent crashes:
1. This file contains the full plan
2. `Gemini_Response.md` contains the raw Gemini output
3. Resume by reading both files and continuing from where we left off

---

## Previous Lessons Learned

### From product-requirements-assistant review:
- **3 FALSE POSITIVES:** Gemini claimed missing features that existed
- **1 REAL ISSUE:** User Story vs FR format mismatch (7-point scoring impact)
- **Fix applied:** Updated prompts.js and validator.js to accept FR format

### Key Insight:
Gemini is good at identifying POTENTIAL issues but bad at verifying they're REAL. Always grep before implementing.

---

## pr-faq-assistant Review Summary (COMPLETE)

### Fixes Implemented

| Finding | Verdict | Fix | Commit |
|---------|---------|-----|--------|
| A. Mechanism Detection Gap | ✅ REAL | Added mechanism patterns to `analyzeHeadlineQuality()` | `e50c2dd` |
| B. Quote Count Collision | ⚠️ PARTIAL | Added score penalty for 3+ quotes | `e50c2dd` |
| C. Softball Loophole | ✅ REAL | Added `isSoftballQuestion()` function | `e50c2dd` |
| D. Metric Spam | ⚠️ LOW PRIORITY | Skipped - edge case, hard to fix without NLP | N/A |
| E. About Section Hack | ❌ FALSE POSITIVE | N/A - code already limits 5Ws check to first 3 paragraphs | N/A |

### Sibling Repo Analysis

All three patterns were **PR-FAQ specific** and don't apply to sibling repos:
- Mechanism detection → headline scoring is press-release only
- Quote count → 2-quote standard is PR-FAQ format
- Softball detection → FAQ hard questions only exist in pr-faq-assistant

### Code Changes Summary

**validator.js:**
- Lines 271-302: Added mechanism detection patterns (`using`, `via`, `through`, `by`, `with`, `leveraging`, `powered by`)
- Lines 202-227: Added quote count penalty (-2 pts for 3+ quotes)
- Lines 1105-1127: Added `isSoftballQuestion()` function
- Lines 1133-1168: Updated `checkHardQuestions()` to filter softballs
- Lines 1224-1252: Updated `scoreFAQQuality()` to report softball detection

**validator.test.js:**
- Line 494: Updated `maxScore` expectation to 12 (was 10) for mechanism detection bonus

### Tests
All 517 tests pass.

---

## Gemini Findings Verification (business-justification-assistant)

### Finding A: "Full Investment" Ghost Option
- **Gemini Claim:** validator.js has no pattern for "Full Investment" or "Option C"
- **Verification:** ⚠️ **PARTIAL** - `alternatives` pattern includes `option.?[abc123]` (matches "Option C") but not "Full Investment" or "Strategic Transformation"
- **Impact:** 10 pts - documents using business-friendly labels like "Strategic Transformation" wouldn't get full credit
- **Fix:** Added `fullInvestment` pattern to OPTIONS_PATTERNS

### Finding B: ROI Formula Trap
- **Gemini Claim:** regex expects digits, not variable names like "(Total Savings - Implementation)"
- **Verification:** ⚠️ **PARTIAL** - Already has `\(.*benefit.*[-−–].*cost.*\)` but doesn't handle all variations
- **Impact:** 10 pts - users using descriptive variable names in formulas wouldn't get credit
- **Fix:** Expanded `roiFormula` regex to support variable names: `\([^)]+[-−–][^)]+\)\s*[\/÷]\s*\S+`

### Finding C: Stakeholder Vocabulary "Silo"
- **Gemini Claim:** "equity" not in stakeholderConcerns regex
- **Verification:** ❌ **FALSE POSITIVE** - Line 70 already includes `equity` in the regex
- **Evidence:** `stakeholderConcerns: /\b(finance|fp&a|...equity|liability...)\b/gi`
- **Fix:** N/A - already covered

### Gaming Vulnerabilities (Confirmed but Low Priority)
- **Do-nothing keyword stuffing** - 2+ mentions = 10 pts without quantification check
- **Gartner anchor** - mentioning source name without using data gets credit
- **Timeline mimicry** - number + "months" anywhere triggers payback credit
- **Status:** Not fixed - requires NLP/proximity checks beyond regex capability

### Fixes Summary

| Finding | Verdict | Fix Applied | Commit |
|---------|---------|-----|--------|
| A. Full Investment Ghost Option | ⚠️ PARTIAL | Added `fullInvestment` pattern to OPTIONS_PATTERNS | `124312d` |
| B. ROI Formula Trap | ⚠️ PARTIAL | Expanded `roiFormula` regex for variable names | `124312d` |
| C. Stakeholder/Equity | ❌ FALSE POSITIVE | N/A - already in regex | N/A |

### Sibling Repo Analysis

Both patterns were **business-justification specific** and don't apply to sibling repos:
- ROI formula detection → only BJ Assistant requires explicit ROI calculations
- 3-option investment pattern (do-nothing, minimal, full) → standard business justification format only

### Tests
All 456 tests pass.

---

## Expanded Adversarial Review Guidance

### Pattern Categories

Based on this review, adversarial findings fall into three categories:

1. **Format-Specific Patterns** - Features unique to one document type (headlines, quotes, FAQs) that don't generalize
2. **Cross-Cutting Patterns** - Common issues across all tools (slop detection, section detection, scoring taxonomy alignment)
3. **False Positives** - Gemini claims about missing features that actually exist (expect ~20-30%)

### Future Reviews Should Check

For each Gemini finding, ask:
1. **Is this format-specific?** Headlines (PR-FAQ), quotes (PR-FAQ), FAQs (PR-FAQ), door types (PRD), ROI formulas (BizJust)
2. **Does the code already handle this?** Always grep before implementing
3. **What's the point impact?** Prioritize high-impact fixes (15+ pts)
4. **Is this gameable?** Keyword-only detection is always vulnerable

