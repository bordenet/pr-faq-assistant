# Genesis Feedback: Lessons from PR-FAQ Assistant Implementation

This document captures issues discovered while implementing pr-faq-assistant using Genesis templates. These should be incorporated into Genesis to prevent future projects from encountering the same problems.

---

## 1. CI Quality Gate: Template Variable Check Exclusions

### Problem
The CI workflow's "Verify Genesis cleanup" step checks for unreplaced `{{` template variables. However, it fails on legitimate `{{` syntax in:
- `.github/workflows/*.yml` (GitHub Actions expressions like `${{ secrets.TOKEN }}`)
- `coverage/` directory (generated coverage reports may contain `{{`)

### Fix Required in Genesis
Update the template variable check in `.github/workflows/ci.yml` to exclude these directories:

```yaml
# Check for unreplaced template variables (exclude .github, coverage, node_modules, .git)
if grep -r "{{" . --include="*.md" --include="*.js" --include="*.json" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.github --exclude-dir=coverage 2>/dev/null | grep -v "^Binary"; then
  echo "❌ ERROR: Found unreplaced template variables ({{...}})"
  exit 1
fi
```

---

## 2. .gitignore Template Variables

### Problem
The Genesis `.gitignore` template contains conditional blocks with unreplaced variables:
```
# IF {{ENABLE_BACKEND}}
{{PROJECT_NAME}}
# END IF
```

These should either be:
1. Cleaned up during project generation, OR
2. Not included if conditionals aren't being processed

### Fix Required
Clean the .gitignore template to remove conditional syntax and template variables.

---

## 3. Workflow UX: Progressive Disclosure Pattern

### Problem
Genesis-generated workflow apps show all UI elements immediately, leading to confused users who don't understand the required sequence of actions.

### Correct Pattern (Implemented in pr-faq-assistant)
**Step A → Step B progressive enablement:**

1. **Initial state:**
   - "Copy Prompt" button: **enabled**
   - "Open AI" button: **disabled** (grayed out)
   - Response textarea: **disabled**
   - "Save Response" button: **disabled**

2. **After Copy Prompt clicked:**
   - "Open AI" button: **enabled**
   - Response textarea: **enabled + focused**
   - "Save Response" button: still **disabled**

3. **After user types 10+ characters:**
   - "Save Response" button: **enabled**

### Code Pattern
```javascript
// Copy Prompt - enables the Open AI button and textarea
document.getElementById('copy-prompt-btn')?.addEventListener('click', () => {
    copyToClipboard(prompt);

    // Enable the "Open AI" button
    const openAiBtn = document.getElementById('open-ai-btn');
    if (openAiBtn) {
        openAiBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        openAiBtn.classList.add('hover:bg-green-700');
        openAiBtn.removeAttribute('aria-disabled');
    }

    // Enable the response textarea
    if (responseTextarea) {
        responseTextarea.disabled = false;
        responseTextarea.focus();
    }
});

// Update save button state as user types
responseTextarea?.addEventListener('input', () => {
    const hasEnoughContent = responseTextarea.value.trim().length >= 10;
    saveResponseBtn.disabled = !hasEnoughContent;
});
```

---

## 4. Auto-Advance After Save

### Problem
Users expect "Save Response" to advance them to the next phase. Without auto-advance, users must manually click "Next Phase" after every save.

### Correct Pattern
```javascript
saveResponseBtn?.addEventListener('click', async () => {
    workflow.savePhaseOutput(output);

    // Auto-advance to next phase if not on final phase
    if (workflow.currentPhase < WORKFLOW_CONFIG.phaseCount) {
        workflow.advancePhase();
        await storage.saveProject(currentProject);
        showToast('Response saved! Moving to next phase...', 'success');
        renderProjectView();
    } else {
        // Final phase - mark complete and return home
        currentProject.phase = WORKFLOW_CONFIG.phaseCount + 1;
        await storage.saveProject(currentProject);
        showToast('Complete!', 'success');
        renderHome();
    }
});
```

---

## 5. Export Button for Completed Projects

### Problem
Completed projects in the home view have no way to export the final document without re-opening the project.

### Correct Pattern
Show an "Export" button on completed projects in the project list:

```javascript
function renderProjectList(projects) {
    return projects.map(p => {
        const isComplete = p.phase > WORKFLOW_CONFIG.phaseCount;
        return `
            <div class="project-card">
                <div class="project-info">
                    <h3>${p.title}</h3>
                    ${isComplete ? `
                        <span class="badge badge-success">✓ Complete</span>
                    ` : `
                        <span>Phase ${p.phase} of ${WORKFLOW_CONFIG.phaseCount}</span>
                    `}
                </div>
                <div class="project-actions">
                    ${isComplete ? `
                        <button onclick="exportProject('${p.id}')" class="btn btn-success">
                            Export
                        </button>
                    ` : ''}
                    <button onclick="deleteProject('${p.id}')" class="btn btn-danger">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
```

---

## 6. Export Attribution

### Problem
Exported documents have no attribution, so readers don't know how they were generated or where to create their own.

### Correct Pattern
Add attribution footer to all exported markdown:

```javascript
exportAsMarkdown() {
    const finalOutput = this.getPhaseOutput(3);
    const attribution = '\n\n---\n\n*Generated with [Tool Name](https://url-to-tool/)*';

    if (finalOutput) {
        return finalOutput + attribution;
    }
    // ... fallback logic
}
```

---

## 7. README Template Improvements

### Problem
Genesis README template is generic and doesn't explain:
- What the document type is (PR-FAQ, PRD, One-Pager, etc.)
- The adversarial AI workflow methodology
- When to use/skip this document type
- Links to methodology documentation

### Correct Pattern
README should include:

1. **What is [Document Type]?** - Brief explanation with link to methodology
2. **When to Use** - Table showing appropriate vs. skip scenarios
3. **How It Works** - Explain adversarial AI approach:
   - Why two different AIs (prevents confirmation bias)
   - Phase-by-phase breakdown with which AI to use
4. **Quality Criteria** - What makes a good document, scoring breakdown
5. **Words to Avoid** - Common fluff words with better alternatives
6. **Related Projects** - Table linking to validators, other assistants, methodology docs

---

## 8. README Badges

### Problem
Genesis README template has minimal badges.

### Recommended Badges
```markdown
[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](...)
[![codecov](https://codecov.io/gh/USER/REPO/graph/badge.svg)](...)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](...)
[![Node.js 18+](https://img.shields.io/badge/node-18+-brightgreen.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](...)
[![Linting: ESLint](https://img.shields.io/badge/linting-ESLint-4B32C3)](...)
[![Testing: Vitest](https://img.shields.io/badge/testing-Vitest-6E9F18)](...)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](...)
[![GitHub issues](https://img.shields.io/github/issues/USER/REPO.svg)](...)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/USER/REPO.svg)](...)
```

---

## 9. Cross-Site Navigation Links

### Problem
Each assistant tool should link to related tools in the ecosystem.

### Correct Pattern
Include navigation links to related assistants:
- PR-FAQ Assistant
- PRD Assistant
- One-Pager Assistant
- ADR Assistant
- Validators

These should appear in both:
1. The app header/nav
2. The README "Related Projects" section

---

## 10. Landing Page Links

### Problem
Landing page doesn't link to the validator tool that scores documents.

### Correct Pattern
Empty state should include:
```html
<p class="text-sm text-gray-400">
    Documents are optimized for
    <a href="https://github.com/user/validator" target="_blank" class="text-blue-500 hover:underline">
        validator-tool
    </a>
    (70+ score target)
</p>
```

---

## Summary Checklist for Genesis Updates

### CI/CD
- [ ] Fix template variable grep to exclude `.github/` and `coverage/`
- [ ] Clean `.gitignore` of template variables and conditionals

### UX Patterns (for workflow apps)
- [ ] Progressive disclosure: disable elements until prerequisites met
- [ ] Auto-advance to next phase after saving response
- [ ] Final phase save → mark complete → return home
- [ ] Export button on completed projects in home view
- [ ] Attribution footer in exported documents

### README Template
- [ ] Add "What is [Document Type]?" section with methodology link
- [ ] Add "When to Use" table
- [ ] Explain adversarial AI workflow
- [ ] Include quality criteria/scoring
- [ ] Add "Words to Avoid" section
- [ ] Add comprehensive badge set
- [ ] Add "Related Projects" table

### Navigation
- [ ] Cross-link related tools in header/nav
- [ ] Link to validator in empty state

---

## Commits Reference

These changes were implemented in pr-faq-assistant:

1. `a573f2e` - Fix Phase 1 UX: add disabled Open AI button, enable after Copy Prompt
2. `b744aa9` - Auto-advance to next phase after saving response
3. `7e33de0` - Add Export button for completed projects
4. `809108d` - Fix CI quality gate and add README badges
5. `e6304a1` - Rewrite README with methodology and adversarial model explanation
6. `101fe8e` - Add more badges to README
7. `9b12b42` - Add attribution to exported markdown

---

*This document should be used to update Genesis templates so future projects don't need these manual fixes.*

