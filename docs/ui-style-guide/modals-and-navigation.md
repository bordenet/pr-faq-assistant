# UI Style Guide: Modals & Navigation

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

## 🪟 Modal Dialogs

### View Prompt Modal

- **Background**: `bg-black bg-opacity-50` (semi-transparent overlay)
- **Modal container**: `bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh]`
- **Header**: Title + close button (×) in top-right
- **Content area**: Scrollable, monospace font, `bg-gray-50 dark:bg-gray-900` background
- **Footer**: Single "Close" button (gray)
- **Dismissal**: Click ×, click Close button, click backdrop, or press Escape

### Confirmation Dialog

- Same modal structure as View Prompt
- Two buttons: "Cancel" (gray, left) and action button (red for delete, blue for others)
- Title clearly states the action
- Body explains consequences

---

## 🧭 Navigation Patterns

### Footer Button Placement

- **Left side**: Navigation/back actions, then forward actions
- **Right side**: Destructive actions (Delete)
- **Spacing**: `flex justify-between items-center`
- **Button groups**: `flex space-x-3` for multiple buttons on same side

### Phase Tab Navigation

- Three tabs (Phase 1, Phase 2, Phase 3) at top of project view
- Active tab: `bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300`
- Completed phases show checkmark icon
- Clicking tab switches view without navigation
