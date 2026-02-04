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

- [One-Pager](https://github.com/bordenet/one-pager)
- [Power Statement Assistant](https://github.com/bordenet/power-statement-assistant)
- [PR/FAQ Assistant](https://github.com/bordenet/pr-faq-assistant)
- [Product Requirements Assistant](https://github.com/bordenet/product-requirements-assistant)
- [Strategic Proposal](https://github.com/bordenet/strategic-proposal)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE)
