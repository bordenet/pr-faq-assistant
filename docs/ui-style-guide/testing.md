# UI Style Guide: Test Coverage for UI Workflows

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

## Required Test Cases

Ensure these test cases exist:

1. **Button rendering**: Verify correct buttons appear on each view
2. **Button state**: Test disabled/enabled states (e.g., Open AI disabled until copy)
3. **Modal behavior**: Test open, close (all methods), escape key
4. **Navigation flow**: Test phase transitions, back navigation
5. **Form validation**: Test required fields, error messages
6. **Confirmation dialogs**: Test cancel vs. confirm behavior
7. **Clipboard operations**: Test `copyToClipboard` throws on error, calls clipboard API
8. **Dark mode rendering**: Verify text visibility in both themes

---

## Clipboard Test Example

```javascript
describe('copyToClipboard', () => {
  let writeTextSpy;

  beforeEach(() => {
    writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  });

  it('should call clipboard.writeText with provided text', async () => {
    await copyToClipboard('test text');
    expect(writeTextSpy).toHaveBeenCalledWith('test text');
  });

  it('should throw error on failure (callers must handle)', async () => {
    writeTextSpy.mockRejectedValueOnce(new Error('Clipboard access denied'));
    await expect(copyToClipboard('test')).rejects.toThrow('Clipboard access denied');
  });

  it('should not show any toast notifications internally', async () => {
    document.body.innerHTML = '';
    await copyToClipboard('test text');
    expect(document.getElementById('toast-container')).toBeNull();
  });
});
```

---

**Reference**: See `js/ui.js`, `js/views.js`, and `js/project-view.js` for implementation details.
