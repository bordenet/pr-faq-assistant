# PR-FAQ Assistant 📰

[![CI](https://github.com/bordenet/pr-faq-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/bordenet/pr-faq-assistant/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/bordenet/pr-faq-assistant/graph/badge.svg)](https://codecov.io/gh/bordenet/pr-faq-assistant)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://bordenet.github.io/pr-faq-assistant/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Linting: ESLint](https://img.shields.io/badge/linting-ESLint-4B32C3)](https://eslint.org/)
[![Testing: Vitest](https://img.shields.io/badge/testing-Vitest-6E9F18)](https://vitest.dev/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/bordenet/pr-faq-assistant/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/bordenet/pr-faq-assistant.svg)](https://github.com/bordenet/pr-faq-assistant/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/bordenet/pr-faq-assistant.svg)](https://github.com/bordenet/pr-faq-assistant/pulls)

An opinionated, AI-assisted workflow helper for generating high-quality PR-FAQ documents that score well against journalistic standards.

**🌐 Try it now: [https://bordenet.github.io/pr-faq-assistant/](https://bordenet.github.io/pr-faq-assistant/)**

---

## What is a PR-FAQ?

A **PR-FAQ** (Press Release / Frequently Asked Questions) is Amazon's "Working Backwards" mechanism for product development. You write a fictitious press release for a product that doesn't exist yet, forcing you to articulate customer value before writing a single line of code.

**The format seems simple, but the discipline saves teams from building the wrong thing.**

> 📖 **Learn more:** [The PR-FAQ Mechanism](https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md) — Complete guide with examples, templates, and best practices

### When to Use PR-FAQs

| ✅ **Use For** | ❌ **Skip For** |
|----------------|-----------------|
| New products or major features with unclear value | Bug fixes or performance improvements |
| Initiatives requiring 6+ months, 10+ people | Features with obvious customer value |
| Cross-team alignment is critical | Small iterations on existing products |
| Validating "should we build this?" | When the team already has strong alignment |

**Simple test:** If writing the press release feels forced, you probably don't need one.

---

## What is This Tool?

This tool helps you write PR-FAQs that meet journalistic standards using a **3-phase adversarial AI workflow**. The key insight: **using two different AI models produces better results than one**.

### Why Two Different AIs?

Single-AI workflows suffer from **confirmation bias** — the same model that drafts your document will be too agreeable when reviewing it. By using Claude for drafting and Gemini for critical review (or vice versa), you get genuinely different perspectives that expose weak thinking.

**The differences between Claude and Gemini's viewpoints are what make rapid iteration possible.** Each model brings unique strengths that, when combined, create better documents than either could produce alone.

---

## How It Works

### Phase 1: Initial Draft (Claude)
Fill in the form with your product details. The tool generates a prompt optimized for Claude that produces a complete PR-FAQ draft following journalistic conventions.

### Phase 2: Critical Review (Gemini)
Copy your draft into Gemini with a review prompt. Gemini acts as an adversarial editor, scoring your draft against [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) criteria and identifying specific improvements.

### Phase 3: Final Synthesis (Claude)
Return to Claude with both the original draft and Gemini's critique. Claude synthesizes the feedback into a polished document targeting 70+ validator score.

**Result:** A PR-FAQ that reads like something TechCrunch would actually publish, not marketing fluff.

---

## Quick Start

### Option 1: Use Online (Recommended)

**🌐 [Launch Web App](https://bordenet.github.io/pr-faq-assistant/)**

No download required. Works on any device. 100% client-side and privacy-first.

### Option 2: Run Locally

```bash
git clone https://github.com/bordenet/pr-faq-assistant.git
cd pr-faq-assistant
./scripts/setup-macos.sh
npm run serve
# Open http://localhost:8080
```

---

## What Makes a Good PR-FAQ?

This tool generates prompts optimized for [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) scoring:

| Category | Points | Key Requirements |
|----------|--------|------------------|
| **Structure & Hook** | 30 | 8-15 word headline with action verb, dateline, 5 Ws in opening |
| **Content Quality** | 35 | Inverted pyramid structure, concrete details, measurable outcomes |
| **Professional Tone** | 20 | No marketing fluff, factual language, journalistic style |
| **Customer Evidence** | 15 | 2-4 quotes with specific quantitative metrics |

### 🚫 Words That Kill Your Score

| **Avoid** | **Replace With** |
|-----------|------------------|
| Revolutionary, game-changing | Specific improvement: "reduces time by 40%" |
| Excited to announce | Just announce it: "today announced" |
| Best-in-class, world-class | Customer evidence: "trusted by 500+ enterprises" |
| Innovative, cutting-edge | What it actually does: "automatically detects..." |
| Seamless integration | Concrete: "requires no configuration" |

### ✅ What Strong PR-FAQs Include

- **Specific numbers:** "reduced review cycles from 12 hours to 3 hours"
- **Multiple metric types:** percentages, time savings, cost savings, scale
- **Named customer quotes:** "said Sarah Chen, VP of Engineering at TechStart"
- **Quantified outcomes:** "saving our team 120 hours last quarter"

---

## Features

- **🔄 3-Phase Adversarial Workflow**: Leverage Claude and Gemini's different perspectives
- **🎯 Validator-Optimized**: Prompts designed to score 70+ on pr-faq-validator
- **💾 Local Storage**: Projects stored in browser (IndexedDB) - no server
- **📤 Export Options**: JSON for backup, Markdown for final documents
- **🌙 Dark Mode**: Full dark mode support
- **🔐 Privacy-First**: No tracking, no data collection, 100% client-side

---

## Development

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting errors
npm run lint:fix
```

### Deploy to GitHub Pages

**⚠️ Always use the deployment script (never manual git commands):**

```bash
./scripts/deploy-web.sh
```

The script enforces quality gates (linting, tests) before deploying.

---

## Privacy

All data is stored locally in your browser using IndexedDB. No data is ever sent to any server. You can export your projects as JSON files anytime.

---

## Related Projects

| Project | Description |
|---------|-------------|
| [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) | CLI tool to score PR-FAQ documents against journalistic standards |
| [product-requirements-assistant](https://github.com/bordenet/product-requirements-assistant) | Similar adversarial workflow for PRD documents |
| [one-pager](https://github.com/bordenet/one-pager) | Quick decision-making documents (500-700 words) |
| [The PR-FAQ Methodology](https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md) | Complete guide with examples and templates |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

