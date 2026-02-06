# UI Style Guide: Button Styles & Layout

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

## 🎨 Button Styles & Colors

### Primary Action Buttons

| Button Type | Color Class | Use Case |
|-------------|-------------|----------|
| **Copy/Primary** | `bg-blue-600 hover:bg-blue-700` | Main workflow actions (Copy Prompt, Next Phase) |
| **Save/Success** | `bg-green-600 hover:bg-green-700` | Save operations, external links (Open AI) |
| **Delete/Danger** | `bg-red-600 hover:bg-red-700` | Destructive actions (always requires confirmation) |
| **Secondary/Navigation** | `bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600` | Back, Previous Phase, Edit Details |
| **Tertiary/View** | `bg-gray-600 hover:bg-gray-700` | View Prompt, informational actions |

### Button Copy (IMPORTANT!)

Use these exact labels for consistency:

```
📋 Copy Prompt to Clipboard    (blue, primary action)
🔗 Open Claude                 (green, external link - Phase 1 & 3)
🔗 Open Gemini                 (green, external link - Phase 2)
👁️ View Prompt                 (gray, secondary action)
Save Response                  (green, after pasting AI response)
Next Phase →                   (blue, advances workflow)
← Previous Phase               (gray, goes back)
← Edit Details                 (gray, returns to form - Phase 1 only, before response saved)
📄 Export as Markdown          (green, prominent - Phase 3 complete ONLY)
Delete                         (red, destructive - always visible)
```

**Note:** "Export as Markdown" explicitly tells users the file format.

---

## 📐 Button Layout Patterns

### Data Entry Form (Initial Form)

```
[Next Phase →]                                              [Delete]
     ↑                                                          ↑
  Left side (blue)                                    Right side (red)
```

- **No Save button** - Next Phase saves automatically
- Footer is **outside** the card (below it)
- Required field asterisks displayed in **red** (`<span class="text-red-500">*</span>`)

### Phase Views (1, 2, 3)

```
[← Edit Details] or [← Previous Phase]  [Next Phase →]      [Delete]
         ↑                                    ↑                 ↑
   Left side (gray)                    Left side (blue)   Right side (red)
```

- Phase 1 before response: Shows "← Edit Details" (returns to form)
- Phase 1 after response: No back button
- Phases 2-3: Shows "← Previous Phase"
- "Next Phase →" only appears when current phase is completed
- Delete button **always visible** on the right

### Phase 3 Complete: Export Call-to-Action (CRITICAL!)

When Phase 3 is completed, users MUST see a prominent export CTA.

**Screen Position:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header with Back + Export buttons]                                        │
│  [Phase Tabs: 1 | 2 | 3✓]                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 3 Content Area                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🎉 Your One-Pager is Complete!              [📄 Export as Markdown]  │  │
│  │  Download your finished one-pager as a Markdown (.md) file.          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [← Previous Phase]                                              [Delete]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Container: `bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6`
- Heading: `text-lg font-semibold text-green-800 dark:text-green-300` with 🎉 emoji
- Button: `px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg`

**Rules:**
- Only appears on Phase 3 view when `phaseData.completed === true`
- Positioned at **BOTTOM of the phase content area**, immediately ABOVE the navigation footer
- Button triggers `exportFinalOnePager(project)` function

### Step A (Copy Prompt Section)

```
[📋 Copy Prompt to Clipboard]  [🔗 Open Claude/Gemini]     [👁️ View Prompt]
          ↑                            ↑                         ↑
    Left (blue)              Left (green, disabled       Right side (gray)
                             until prompt copied)
```

- "Open AI" link is **disabled** until prompt is copied (opacity-50, pointer-events-none)
- After copying, link becomes active and opens in named tab `target="ai-assistant-tab"`
