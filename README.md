# PR/FAQ Assistant

Write Amazon-style press releases and FAQs with AI. Three phases: draft, review, refine.

[![Star this repo](https://img.shields.io/github/stars/bordenet/pr-faq-assistant?style=social)](https://github.com/bordenet/pr-faq-assistant)

**Try it**: [Assistant](https://bordenet.github.io/pr-faq-assistant/) · [Validator](https://bordenet.github.io/pr-faq-assistant/validator/)

> **What is a PR/FAQ?** A PR/FAQ (Press Release / Frequently Asked Questions) is Amazon's "Working Backwards" document format. You write a future press release announcing the finished product, then answer anticipated customer and stakeholder questions. This forces clarity on customer benefit before building. See [The PR-FAQ](https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md) for background.

[![CI](https://github.com/bordenet/pr-faq-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/bordenet/pr-faq-assistant/actions)
[![codecov](https://codecov.io/gh/bordenet/pr-faq-assistant/branch/main/graph/badge.svg)](https://codecov.io/gh/bordenet/pr-faq-assistant)

---

## Quick Start

1. Open the [demo](https://bordenet.github.io/pr-faq-assistant/)
2. Enter product vision, customer problem, solution
3. Copy prompt → paste into Claude → paste response back
4. Repeat for review (Gemini) and synthesis (Claude)
5. Export as Markdown

## What It Does

- **Draft → Review → Synthesize**: Claude writes, Gemini critiques, Claude refines
- **Browser storage**: Data stays in IndexedDB, nothing leaves your machine
- **No login**: Just open and use
- **Dark mode**: Toggle in the UI

## How the Phases Work

**Phase 1** — You describe the product. Claude drafts a PR/FAQ.

**Phase 2** — Gemini reviews: Are claims supported? What FAQs are missing? What's unconvincing?

**Phase 3** — Claude takes the draft plus critique and produces a final version.

---

## Scoring Methodology

The validator scores PR/FAQs on a 100-point scale across five dimensions aligned with Amazon's "Working Backwards" methodology. This scoring system is specifically calibrated to counteract LLM over-scoring bias—LLMs consistently rate PR/FAQs 20-30 points higher than deserved.

### Scoring Taxonomy

| Category | Weight | Rationale |
|----------|--------|-----------|
| **Structure & Hook** | 20 pts | Validates press release format with newsworthy headline |
| **Content Quality** | 20 pts | Ensures 5 Ws coverage with mechanism clarity |
| **Professional Quality** | 15 pts | Enforces tone, readability, and fluff avoidance |
| **Evidence** | 10 pts | Validates customer quotes and supporting data |
| **FAQ Quality** | 35 pts | Scores FAQ section structure and hard question coverage |

### Why These Weights?

**Structure & Hook (20 pts)** validates the press release format that makes PR/FAQs distinctive:
- **Headline** (8 pts): Strong action verb + mechanism (how, not just what) + specific metric
- **Newsworthy opening** (8 pts): Dateline format, measurable outcome in first sentence, customer pain/relief arc
- **Price & availability** (4 pts): Specific launch date and pricing information

**Content Quality (20 pts)** ensures the body covers essential journalism elements:
- **5 Ws coverage** (10 pts): WHO (company), WHAT (product), WHEN (timing), WHERE (market), WHY (benefit)
- **Mechanism clarity** (5 pts): Explains HOW the product works, not just WHAT it does
- **Competitive differentiation** (5 pts): Identifies current alternative and why it's insufficient

**Professional Quality (15 pts)** addresses tone and readability:
- **Tone & readability** (8 pts): Written for general audience, active voice, minimal jargon
- **Fluff avoidance** (7 pts): No "revolutionary," "game-changing," "cutting-edge" without substantiation

**Evidence (10 pts)** validates supporting proof:
- **Customer quotes** (10 pts): Exactly 2 quotes—Executive Vision quote and Customer Relief quote
- **Quote collision penalty** (-2 pts): More than 2 quotes dilutes impact

**FAQ Quality (35 pts)** receives the highest weight because the FAQ section is where PR/FAQs succeed or fail:
- **FAQ section structure** (15 pts): Minimum 5 FAQs, properly formatted Q&A
- **Hard question coverage** (20 pts): Must address pricing, timeline, competitors, risks

### Adversarial Robustness

The scoring system addresses common PR/FAQ manipulation strategies:

| Gaming Attempt | Why It Fails |
|----------------|--------------|
| Headline without mechanism | Mechanism detection requires "how" language, not just "what" claims |
| Adding 5+ customer quotes | Quote count penalty applies for >2 quotes |
| Softball FAQ questions | Hard question detection identifies "What if this fails?" style questions |
| Metric stuffing | Metric patterns must include context, not raw numbers |
| Fluff-heavy language | Revolutionary/game-changing triggers explicit fluff penalties |

### Calibration Notes

The **LLM bias correction** is critical. When LLMs evaluate their own PR/FAQ output, they grade generously. The validator applies strict scoring where "almost" meeting criteria = 0 points for that item. This prevents the common failure mode of 80+ scores for mediocre PR/FAQs.

The **2-quote standard** reflects Amazon's actual PR/FAQ template: one Executive Vision quote (company perspective) and one Customer Relief quote (user perspective). More quotes signal padding; fewer signals incomplete stakeholder representation.

The **softball detection** algorithm identifies FAQ questions that avoid hard truths. Questions like "Why is this product so great?" score zero; questions like "What happens if adoption is slower than projected?" score full points.

---

## Validate Your PR-FAQ

Once you've completed your PR-FAQ, run it through the **[PR-FAQ Validator](https://bordenet.github.io/pr-faq-assistant/validator/)** for instant scoring and AI-powered improvement suggestions. The validator checks headline quality, newsworthy hooks, 5 Ws coverage, customer evidence, and professional tone—giving you a 0-100 score with actionable feedback.

→ **[Try the Validator](https://bordenet.github.io/pr-faq-assistant/validator/)**

## Usage

1. Open the app
2. Click "New Project", fill in your inputs
3. Copy each phase's prompt to the appropriate AI, paste responses back
4. Export when done

**Mock mode**: On localhost, toggle "AI Mock Mode" (bottom-right) to skip the copy/paste loop. Useful for testing.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/bordenet/pr-faq-assistant.git
cd pr-faq-assistant
npm install
```

### Testing

```bash
npm test        # Run all tests
npm run lint    # Run linting
npm run lint:fix # Fix lint issues
```

### Local Development

```bash
npm run serve   # Start local server at http://localhost:8000
```

## Project Structure

```
pr-faq-assistant/
├── js/                    # JavaScript modules
│   ├── app.js            # Main application entry
│   ├── workflow.js       # Phase orchestration
│   ├── storage.js        # IndexedDB operations
│   └── ...
├── tests/                 # Jest test files
├── prompts/              # AI prompt templates
│   ├── phase1.md
│   ├── phase2.md
│   └── phase3.md
└── index.html            # Main HTML file
```

## Part of Genesis Tools

Built with [Genesis](https://github.com/bordenet/genesis). Related tools:

- [Acceptance Criteria Assistant](https://github.com/bordenet/acceptance-criteria-assistant)
- [Architecture Decision Record](https://github.com/bordenet/architecture-decision-record)
- [Business Justification Assistant](https://github.com/bordenet/business-justification-assistant)
- [JD Assistant](https://github.com/bordenet/jd-assistant)
- [One-Pager](https://github.com/bordenet/one-pager)
- [Power Statement Assistant](https://github.com/bordenet/power-statement-assistant)
- [PR/FAQ Assistant](https://github.com/bordenet/pr-faq-assistant)
- [Product Requirements Assistant](https://github.com/bordenet/product-requirements-assistant)
- [Strategic Proposal](https://github.com/bordenet/strategic-proposal)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE)
