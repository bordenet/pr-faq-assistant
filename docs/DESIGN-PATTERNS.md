# Design Patterns

This document describes the core design patterns used consistently across all genesis-tools repositories.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Web Application                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   UI Layer  │  │  Business   │  │   Storage    │  │  │
│  │  │  (Views)    │◄─┤   Logic     │◄─┤  (IndexedDB) │  │  │
│  │  │             │  │  (Workflow) │  │              │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Module Pattern (ES6 Modules)

**Purpose**: Single-responsibility modules with clear imports/exports.

**Standard Modules**:
| Module | Responsibility |
|--------|----------------|
| `app.js` | Entry point, initialization, global event listeners |
| `router.js` | Hash-based SPA routing |
| `views.js` | Home, new project, edit project forms |
| `project-view.js` | Project workflow view with phase tabs |
| `projects.js` | Project CRUD operations |
| `workflow.js` | Prompt generation, phase management |
| `storage.js` | IndexedDB abstraction |
| `ui.js` | Toast, clipboard, formatting utilities |
| `error-handler.js` | Global error handling |
| `ai-mock.js` | Mock AI responses for development |

---

## 2. Singleton Pattern

**Purpose**: Single instance of storage and app state.

```javascript
class Storage { /* ... */ }
const storage = new Storage();  // Single instance
export default storage;         // Same instance everywhere
```

---

## 3. Hash-based SPA Router

**Routes**:
| Hash | Route | Handler |
|------|-------|---------|
| `#` or empty | home | `renderProjectsList()` |
| `#new` | new-project | `renderNewProjectForm()` |
| `#project/{id}` | project | `renderProjectView(id)` |
| `#edit/{id}` | edit-project | `renderEditProjectForm(id)` |

---

## 4. Repository Pattern

**Purpose**: Abstract data storage operations behind a clean interface.

```javascript
class Storage {
  async saveProject(project) { /* IndexedDB put */ }
  async getProject(id) { /* IndexedDB get */ }
  async getAllProjects() { /* IndexedDB getAll */ }
  async deleteProject(id) { /* IndexedDB delete */ }
}
```

---

## 5. Multi-Phase State Machine

**Purpose**: Guide users through a structured 3-phase AI workflow.

```
Phase 1 (Draft) → Phase 2 (Review) → Phase 3 (Synthesis)
```

**Phase Types**:
- `mock`: AI interaction can be simulated (Phase 1, 3)
- `manual`: User must interact with external AI (Phase 2 - Gemini)

---

## 6. Form-to-Prompt Pattern

**Purpose**: Convert structured form data into AI prompts.

```javascript
function replaceTemplateVars(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '[Not provided]');
  }
  return result;
}
```

---

## 7. Defensive Coding Pattern

```javascript
// Input validation
if (!project?.id) throw new Error('Project ID required');

// Graceful degradation
const response = project.phases[0]?.response || '[Not completed]';

// Error boundaries
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  showToast('Something went wrong', 'error');
}
```

---

## 8. Mock Mode Pattern

**Purpose**: Enable offline development and testing without AI APIs.

- Mock toggle only visible on localhost
- Simulates network delay for realistic testing
- Phase-specific mock responses

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript (ES6 modules) |
| Styling | Tailwind CSS 3.x (CDN) |
| Storage | IndexedDB (native API) |
| Build | None (zero build step) |
| Testing | Jest with ES6 module support |
| Deployment | GitHub Pages (static) |

---

## Design Principles

1. **Zero Dependencies**: No npm packages in production code
2. **Privacy-First**: All data stays in browser (IndexedDB)
3. **Offline-Capable**: Works without network after initial load
4. **Mobile-Responsive**: Tailwind responsive utilities

---

## Related Repos

- [product-requirements-assistant](https://github.com/bordenet/product-requirements-assistant) - PRD generation
- [one-pager](https://github.com/bordenet/one-pager) - One-pager documents
- [power-statement-assistant](https://github.com/bordenet/power-statement-assistant) - Power statements
- [pr-faq-assistant](https://github.com/bordenet/pr-faq-assistant) - PR-FAQ documents
- [architecture-decision-record](https://github.com/bordenet/architecture-decision-record) - ADR documents
