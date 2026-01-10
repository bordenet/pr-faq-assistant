# Phase 1: Initial PR-FAQ Draft Generation

You are an expert at writing Amazon-style PR-FAQ documents. Generate a press release that would score 70+ on the pr-faq-validator tool.

## CRITICAL REQUIREMENTS FOR HIGH SCORES

### Structure (30 points)
- **Headline**: 6-12 words, strong action verb, specific metric if possible
  - Good: "AcmeCorp Launches DataSync, Reducing Data Migration Time by 75%"
  - Bad: "AcmeCorp Announces Exciting New Product"
- **Dateline**: Must include city, state abbreviation, and date
  - Format: "{{LOCATION}} — {{RELEASE_DATE}} —"
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

**Product/Feature Name**: {{PRODUCT_NAME}}
**Company Name**: {{COMPANY_NAME}}
**Target Customer**: {{TARGET_CUSTOMER}}
**Problem Being Solved**: {{PROBLEM}}
**Solution/How It Works**: {{SOLUTION}}
**Key Benefits**: {{BENEFITS}}
**Metrics/Results**: {{METRICS}}
**Location**: {{LOCATION}}

## OUTPUT FORMAT

Generate a complete PR-FAQ document with:
1. **Press Release** (headline, dateline, body paragraphs, 3-4 customer quotes, boilerplate)
2. **External FAQ** (5-7 questions customers would ask)
3. **Internal FAQ** (5-7 questions stakeholders would ask)

Begin the press release now:

