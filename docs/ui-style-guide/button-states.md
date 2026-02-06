# UI Style Guide: Button State Rules (CRITICAL!)

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

Buttons MUST follow this state diagram strictly. Incorrect states confuse users and break workflows.

## State Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE WORKFLOW STATE DIAGRAM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     Copy Prompt     ┌──────────────┐                      │
│  │ INITIAL      │ ─────────────────▶  │ PROMPT       │                      │
│  │              │                     │ COPIED       │                      │
│  └──────────────┘                     └──────────────┘                      │
│        │                                     │                              │
│        │                                     │ Type 3+ chars                │
│        ▼                                     ▼                              │
│  ┌──────────────┐                     ┌──────────────┐                      │
│  │ Buttons:     │                     │ Buttons:     │                      │
│  │ • Copy ✓     │                     │ • Copy ✓     │                      │
│  │ • Open AI ✗  │                     │ • Open AI ✓  │                      │
│  │ • Textarea ✗ │                     │ • Textarea ✓ │                      │
│  │ • Save ✗     │                     │ • Save ✓     │                      │
│  └──────────────┘                     └──────────────┘                      │
│                                              │                              │
│                                              │ Save Response                │
│                                              ▼                              │
│                                       ┌──────────────┐                      │
│                                       │ PHASE        │                      │
│                                       │ COMPLETE     │                      │
│                                       └──────────────┘                      │
│                                              │                              │
│                                              │ Shows:                       │
│                                              │ • Next Phase → (if < 3)      │
│                                              │ • Export CTA (if phase 3)    │
│                                              ▼                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Button States by Condition

| Button | Condition | State |
|--------|-----------|-------|
| **📋 Copy Prompt** | Always | ✅ Enabled |
| **🔗 Open AI** | Before prompt copied | ❌ Disabled (`opacity-50 cursor-not-allowed pointer-events-none aria-disabled="true"`) |
| **🔗 Open AI** | After prompt copied | ✅ Enabled |
| **Response Textarea** | Before prompt copied | ❌ Disabled (`disabled` attribute) |
| **Response Textarea** | After prompt copied | ✅ Enabled (auto-focus) |
| **Save Response** | Response < 3 chars | ❌ Disabled (`disabled` attribute) |
| **Save Response** | Response ≥ 3 chars | ✅ Enabled |
| **Next Phase →** | Phase NOT completed | ❌ Hidden (not rendered) |
| **Next Phase →** | Phase completed AND phase < 3 | ✅ Visible & enabled |
| **← Previous Phase** | Phase 1 | ❌ Hidden (show "← Edit Details" instead if no response) |
| **← Previous Phase** | Phase 2 or 3 | ✅ Visible & enabled |
| **📄 Export One-Pager** | Phase 3 NOT completed | ❌ Hidden |
| **📄 Export One-Pager** | Phase 3 completed | ✅ Visible & enabled |
| **Delete** | Always | ✅ Enabled (always visible) |

## Disabled Button Styling

```css
/* For <button> elements */
.disabled:opacity-50
.disabled:cursor-not-allowed
.disabled:hover:bg-[same-as-base]  /* Prevent hover color change */

/* For <a> elements (links styled as buttons) */
.opacity-50
.cursor-not-allowed
.pointer-events-none
aria-disabled="true"
```

## Enabling Buttons Dynamically

When enabling a previously disabled button:
1. Remove disabled classes: `opacity-50`, `cursor-not-allowed`, `pointer-events-none`
2. Add hover class: `hover:bg-[color]-700`
3. Remove `aria-disabled` attribute
4. For textareas: `element.disabled = false`
