/**
 * UI Clipboard Module
 * Clipboard copy functionality with Safari transient activation support
 * @module ui-clipboard
 */

/**
 * Copy text to clipboard - wrapper for copyToClipboardAsync
 *
 * IMPORTANT: For async operations (like generating prompts), use copyToClipboardAsync()
 * instead to preserve Safari's transient activation window.
 *
 * @param {string} text - Text to copy (must be available synchronously)
 * @returns {Promise<void>} Resolves if successful, throws if failed
 * @throws {Error} If clipboard access fails
 */
export async function copyToClipboard(text) {
  return copyToClipboardAsync(Promise.resolve(text));
}

/**
 * Copy text to clipboard with async text generation - Safari transient activation safe
 *
 * CRITICAL: This function MUST be called synchronously within a user gesture handler.
 * Safari's transient activation window (~2-3 seconds) is preserved because we call
 * navigator.clipboard.write() immediately, passing a Promise-wrapped Blob that
 * resolves later when the async work completes.
 *
 * @param {Promise<string>} textPromise - Promise that resolves to text to copy
 * @returns {Promise<void>} Resolves if successful, throws if failed
 * @throws {Error} If clipboard access fails
 *
 * @example
 * // In click handler - call synchronously with Promise
 * button.addEventListener('click', () => {
 *     const textPromise = generatePromptAsync();
 *     copyToClipboardAsync(textPromise)
 *         .then(() => showToast('Copied!', 'success'))
 *         .catch(() => showToast('Failed to copy', 'error'));
 * });
 */
export async function copyToClipboardAsync(textPromise) {
  // Safari transient activation fix: Call clipboard.write() SYNCHRONOUSLY with Promise-wrapped Blob
  // The transient activation is evaluated when write() is called, not when Promise resolves
  if (navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
    try {
      // Create a Promise that resolves to a Blob - this preserves transient activation
      const blobPromise = textPromise.then(text => new Blob([text], { type: 'text/plain' }));
      const item = new ClipboardItem({ 'text/plain': blobPromise });
      await navigator.clipboard.write([item]);
      return;
    } catch (err) {
      console.warn('ClipboardItem with Promise failed, trying execCommand:', err?.message);
    }
  }

  // Fallback: Wait for text and use execCommand
  // This may fail on Safari if transient activation expired, but it's our last resort
  const text = await textPromise;

  // Legacy execCommand fallback
  // CRITICAL: Position IN viewport - iOS Safari rejects off-screen elements
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('contenteditable', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0.01';
  textarea.style.fontSize = '16px'; // Prevent iOS zoom

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy returned false');
    }
  } catch (err) {
    throw new Error('Failed to copy to clipboard: ' + (err?.message || 'unknown error'), { cause: err });
  } finally {
    if (document.body.contains(textarea)) {
      document.body.removeChild(textarea);
    }
  }
}

