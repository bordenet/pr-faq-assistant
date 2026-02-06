# UI Style Guide for One-Pager Tool

**Purpose**: This document captures the visual design patterns and UX conventions established for the One-Pager tool. Use this as a reference when implementing similar tools or achieving design parity across projects.

## 🧬 Project Lineage

**All projects in this ecosystem derive from https://github.com/bordenet/genesis/**

This style guide ensures UI consistency across all sibling projects. When building new tools or features, these patterns are **mandatory** to maintain a cohesive user experience across the ecosystem.

---

## Quick Navigation

> **For AI Agents**: Load only the section you need to minimize context usage.

| Section | Topics |
|---------|--------|
| [Button Styles & Layout](./ui-style-guide/button-styles.md) | Colors, labels, layout patterns, export CTA |
| [Button State Rules](./ui-style-guide/button-states.md) | State diagram, conditions, disabled styling (CRITICAL!) |
| [Modals & Navigation](./ui-style-guide/modals-and-navigation.md) | Modal dialogs, footer placement, phase tabs |
| [Forms & Dark Mode](./ui-style-guide/forms-and-dark-mode.md) | Field patterns, dark mode requirements (MANDATORY!) |
| [Utility Functions](./ui-style-guide/utility-functions.md) | copyToClipboard, showToast conventions (CRITICAL!) |
| [Testing](./ui-style-guide/testing.md) | Required test cases, clipboard test example |

---

## Reference

See `js/ui.js`, `js/views.js`, and `js/project-view.js` for implementation details.
