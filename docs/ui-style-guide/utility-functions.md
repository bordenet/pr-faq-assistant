# UI Style Guide: Utility Function Conventions (CRITICAL!)

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

## Clipboard Operations (`copyToClipboard`)

The `copyToClipboard` function follows a **throw-on-error** pattern. This is mandatory across all projects.

### Implementation Pattern

```javascript
/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>} Resolves if successful, throws if failed
 */
export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
```

### Caller Pattern

```javascript
document.getElementById('copy-btn').addEventListener('click', async () => {
  try {
    await copyToClipboard(textToCopy);
    showToast('Copied to clipboard!', 'success');
  } catch {
    showToast('Failed to copy to clipboard', 'error');
  }
});
```

### Rules

1. ✅ `copyToClipboard` MUST throw on error (not return boolean)
2. ✅ `copyToClipboard` MUST NOT show toast internally
3. ✅ Callers MUST handle their own success/error toasts
4. ✅ Callers MAY customize toast message for context (e.g., "Prompt copied!")

### Why This Pattern?

- Callers have context for appropriate messages ("Prompt copied" vs "URL copied")
- Error handling is explicit and visible in calling code
- No hidden side effects in utility functions
- Testable: can verify function throws without mocking toast

---

## Toast Notifications (`showToast`)

```javascript
/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'info'} type - Toast type for styling
 */
export function showToast(message, type = 'info') {
  // Implementation creates/manages toast container
}
```

### Rules

1. Toast types: `'success'` (green), `'error'` (red), `'info'` (gray)
2. Toasts auto-dismiss after 3-5 seconds
3. Toast container ID: `toast-container`
4. Position: top-right of viewport
