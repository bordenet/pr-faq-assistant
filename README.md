# PR-FAQ Assistant 📰

[![CI](https://github.com/bordenet/pr-faq-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/bordenet/pr-faq-assistant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI-assisted PR-FAQ document generator optimized for [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) compatibility (70+ score target).**

🔗 **Live Demo**: [https://bordenet.github.io/pr-faq-assistant/](https://bordenet.github.io/pr-faq-assistant/)

## Features

- 📝 **3-Phase Workflow**: Initial Draft → Critical Review → Final Polish
- 🎯 **Validator-Optimized**: Prompts designed to score 70+ on pr-faq-validator
- 🔐 **100% Client-Side**: All data stored locally in IndexedDB - no server required
- 🌙 **Dark Mode**: Full dark mode support
- 📤 **Export/Import**: JSON export for backup, Markdown export for final documents
- 📱 **Responsive**: Works on desktop and mobile

## Quick Start

### Option 1: Use Online (Recommended)

Visit [https://bordenet.github.io/pr-faq-assistant/](https://bordenet.github.io/pr-faq-assistant/)

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/bordenet/pr-faq-assistant.git
cd pr-faq-assistant

# Run setup script (installs dependencies, runs tests)
./scripts/setup-macos.sh

# Start local server
npm run serve

# Open http://localhost:8080
```

## How It Works

### Phase 1: Initial Draft
Fill out the form with your product details. Copy the generated prompt to Claude/GPT-4 to create an initial PR-FAQ draft.

### Phase 2: Critical Review
Use a **different AI** (prevents groupthink) to review the draft. The prompt includes the pr-faq-validator scoring criteria.

### Phase 3: Final Polish
The AI synthesizes the original draft and review feedback into a polished document targeting 70+ validator score.

## Validator Compatibility

This tool generates prompts optimized for [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) scoring:

| Category | Points | Key Requirements |
|----------|--------|------------------|
| Structure & Hook | 30 | 6-12 word headline, dateline, 5 Ws in opening |
| Content Quality | 35 | Inverted pyramid, concrete details, mechanism |
| Professional Tone | 20 | No fluff words, factual language |
| Customer Evidence | 15 | 3-4 quotes with quantitative metrics |

### Words to Avoid (Reduce Score)
- revolutionary, groundbreaking, cutting-edge
- excited, pleased, thrilled, delighted
- comprehensive solution, seamless integration
- game-changing, innovative, transformative

### What to Include
- Specific numbers and percentages
- Concrete outcomes and results
- Customer quotes with metrics (e.g., "reduced costs by 40%")

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting errors
npm run lint:fix
```

## Deployment

**⚠️ Always use the deployment script (never manual git commands):**

```bash
./scripts/deploy-web.sh
```

The script enforces quality gates (linting, tests) before deploying.

## Privacy

All data is stored locally in your browser using IndexedDB. No data is ever sent to any server. You can export your projects as JSON files anytime.

## Related Projects

- [pr-faq-validator](https://github.com/bordenet/pr-faq-validator) - CLI tool to score PR-FAQ documents
- [product-requirements-assistant](https://github.com/bordenet/product-requirements-assistant) - Similar tool for PRDs

## License

MIT License - see [LICENSE](LICENSE) for details.

