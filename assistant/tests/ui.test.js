import { formatDate, escapeHtml, confirm, showToast, copyToClipboard, showLoading, hideLoading, showPromptModal, showDocumentPreviewModal } from '../js/ui.js';

describe('UI Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('formatDate', () => {
    test('should return "Just now" for just now', () => {
      const now = new Date().toISOString();
      expect(formatDate(now)).toBe('Just now');
    });

    test('should return minutes ago for recent dates', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatDate(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    test('should return hours ago for today\'s dates', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatDate(twoHoursAgo)).toBe('2 hours ago');
    });

    test('should return "1 day ago" for yesterday\'s date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatDate(yesterday)).toBe('1 day ago');
    });

    test('should return "X days ago" for dates within a week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatDate(threeDaysAgo)).toBe('3 days ago');
    });

    test('should return formatted date for dates older than a week', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatDate(tenDaysAgo);
      // Returns format like "Jan 22, 2026"
      expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
    });
  });

  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    test('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should return empty string for null/undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    test('should handle normal text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('confirm', () => {
    test('should resolve true when confirm button is clicked', async () => {
      const confirmPromise = confirm('Are you sure?', 'Delete');

      // Wait for modal to be added
      await new Promise(resolve => setTimeout(resolve, 0));

      const confirmBtn = document.querySelector('#confirm-btn');
      expect(confirmBtn).toBeTruthy();
      confirmBtn.click();

      const result = await confirmPromise;
      expect(result).toBe(true);
    });

    test('should resolve false when cancel button is clicked', async () => {
      const confirmPromise = confirm('Are you sure?');

      await new Promise(resolve => setTimeout(resolve, 0));

      const cancelBtn = document.querySelector('#cancel-btn');
      expect(cancelBtn).toBeTruthy();
      cancelBtn.click();

      const result = await confirmPromise;
      expect(result).toBe(false);
    });

    test('should resolve false when backdrop is clicked', async () => {
      const confirmPromise = confirm('Are you sure?');

      await new Promise(resolve => setTimeout(resolve, 0));

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();

      // Simulate backdrop click
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: modal, enumerable: true });
      modal.dispatchEvent(event);

      const result = await confirmPromise;
      expect(result).toBe(false);
    });

    test('should display custom title and message', async () => {
      const confirmPromise = confirm('Delete this item?', 'Confirm Delete');

      await new Promise(resolve => setTimeout(resolve, 0));

      const modal = document.querySelector('.fixed');
      expect(modal.innerHTML).toContain('Confirm Delete');
      expect(modal.innerHTML).toContain('Delete this item?');

      // Clean up
      document.querySelector('#cancel-btn').click();
      await confirmPromise;
    });
  });

  describe('showPromptModal', () => {
    test('should display modal with prompt text', () => {
      showPromptModal('Test prompt content', 'Test Title');

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('Test Title');
      expect(modal.innerHTML).toContain('Test prompt content');

      // Clean up
      document.querySelector('#close-prompt-modal-btn').click();
    });

    test('should close modal when X button is clicked', () => {
      showPromptModal('Test prompt', 'Title');

      const closeBtn = document.querySelector('#close-prompt-modal');
      expect(closeBtn).toBeTruthy();
      closeBtn.click();

      const modal = document.querySelector('.fixed');
      expect(modal).toBeNull();
    });

    test('should close modal when Close button is clicked', () => {
      showPromptModal('Test prompt', 'Title');

      const closeBtn = document.querySelector('#close-prompt-modal-btn');
      expect(closeBtn).toBeTruthy();
      closeBtn.click();

      const modal = document.querySelector('.fixed');
      expect(modal).toBeNull();
    });

    test('should close modal when backdrop is clicked', () => {
      showPromptModal('Test prompt', 'Title');

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();

      // Simulate backdrop click (click on the modal overlay itself, not content)
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: modal, enumerable: true });
      modal.dispatchEvent(event);

      const modalAfter = document.querySelector('.fixed');
      expect(modalAfter).toBeNull();
    });

    test('should close modal on Escape key', () => {
      showPromptModal('Test prompt', 'Title');

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      const modalAfter = document.querySelector('.fixed');
      expect(modalAfter).toBeNull();
    });

    test('should escape HTML in prompt text', () => {
      showPromptModal('<script>alert("xss")</script>', 'Title');

      const modal = document.querySelector('.fixed');
      expect(modal.innerHTML).not.toContain('<script>');
      expect(modal.innerHTML).toContain('&lt;script&gt;');

      // Clean up
      document.querySelector('#close-prompt-modal-btn').click();
    });
  });

  describe('showToast', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Create toast container as required by showToast implementation
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50';
      document.body.appendChild(container);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should add toast to container', () => {
      showToast('Test message');
      const container = document.getElementById('toast-container');
      expect(container.children.length).toBe(1);
    });

    test('should display toast with correct message', () => {
      showToast('Success!', 'success');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast).toBeTruthy();
      expect(toast.textContent).toContain('Success!');
    });

    test('should apply correct color for success type', () => {
      showToast('Success!', 'success');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.className).toContain('bg-green-500');
    });

    test('should apply correct color for error type', () => {
      showToast('Error!', 'error');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.className).toContain('bg-red-500');
    });

    test('should apply correct color for warning type', () => {
      showToast('Warning!', 'warning');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.className).toContain('bg-yellow-500');
    });

    test('should apply correct color for info type', () => {
      showToast('Info!', 'info');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.className).toContain('bg-blue-500');
    });

    test('should default to info type', () => {
      showToast('Default message');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.className).toContain('bg-blue-500');
    });

    test('should include icon for each type', () => {
      showToast('Success!', 'success');
      const container = document.getElementById('toast-container');
      const toast = container.children[0];
      expect(toast.textContent).toContain('✓');
    });
  });

  describe('copyToClipboard', () => {
    test('should copy text to clipboard using ClipboardItem with Promise', async () => {
      const writeMock = jest.fn().mockResolvedValue();
      navigator.clipboard.write = writeMock;

      await copyToClipboard('Test text');

      // The new implementation uses ClipboardItem with Promise-wrapped Blob for Safari transient activation
      expect(writeMock).toHaveBeenCalledTimes(1);
      // Verify it was called with an array containing a ClipboardItem
      expect(writeMock).toHaveBeenCalledWith(expect.any(Array));
    });

    test('should complete successfully on successful copy', async () => {
      const writeMock = jest.fn().mockResolvedValue();
      navigator.clipboard.write = writeMock;

      // Should not throw - void return
      await expect(copyToClipboard('Test text')).resolves.not.toThrow();
    });

    test('should throw error if all clipboard methods fail', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock write (ClipboardItem) to fail
      navigator.clipboard.write = jest.fn().mockRejectedValue(new Error('Not allowed'));
      // Mock execCommand to also fail
      document.execCommand = jest.fn().mockReturnValue(false);

      await expect(copyToClipboard('Test text')).rejects.toThrow();

      consoleWarnSpy.mockRestore();
    });

    test('should fallback to execCommand when Clipboard API unavailable', async () => {
      // Remove clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      });
      document.execCommand = jest.fn().mockReturnValue(true);

      await copyToClipboard('Test text');
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('showLoading and hideLoading', () => {
    beforeEach(() => {
      const overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'hidden';
      const text = document.createElement('div');
      text.id = 'loading-text';
      overlay.appendChild(text);
      document.body.appendChild(overlay);
    });

    test('should show loading overlay with message', () => {
      showLoading('Processing...');

      const overlay = document.getElementById('loading-overlay');
      expect(overlay.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('loading-text').textContent).toBe('Processing...');
    });

    test('should use default message if none provided', () => {
      showLoading();

      expect(document.getElementById('loading-text').textContent).toBe('Loading...');
    });

    test('should hide loading overlay', () => {
      const overlay = document.getElementById('loading-overlay');
      overlay.classList.remove('hidden');

      hideLoading();

      expect(overlay.classList.contains('hidden')).toBe(true);
    });

  });

  describe('showDocumentPreviewModal', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      // Add toast container for showToast calls within showDocumentPreviewModal
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);

      window.getSelection = jest.fn(() => ({
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      }));
      document.createRange = jest.fn(() => ({
        selectNodeContents: jest.fn()
      }));
    });

    test('should display modal with rendered markdown content', () => {
      global.marked = { parse: (md) => `<p>${md}</p>` };

      showDocumentPreviewModal('# Test Content', 'Preview Title', 'test.md');

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('Preview Title');
      expect(modal.innerHTML).toContain('Test Content');

      document.querySelector('#close-preview-modal').click();
      delete global.marked;
    });

    test('should fallback to escaped HTML when marked is unavailable', () => {
      delete global.marked;

      showDocumentPreviewModal('Test **content**', 'Title', 'doc.md');

      const modal = document.querySelector('.fixed');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('Test **content**');

      modal.querySelector('#close-modal-btn').click();
    });

    test('should close modal when X button is clicked', () => {
      showDocumentPreviewModal('Content', 'Title');

      const closeBtn = document.querySelector('#close-preview-modal');
      expect(closeBtn).toBeTruthy();
      closeBtn.click();

      expect(document.querySelector('.fixed')).toBeNull();
    });

    test('should close modal when Close button is clicked', () => {
      showDocumentPreviewModal('Content', 'Title');

      const closeBtn = document.querySelector('#close-modal-btn');
      closeBtn.click();

      expect(document.querySelector('.fixed')).toBeNull();
    });

    test('should close modal when backdrop is clicked', () => {
      showDocumentPreviewModal('Content', 'Title');

      const modal = document.querySelector('.fixed');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: modal, enumerable: true });
      modal.dispatchEvent(event);

      expect(document.querySelector('.fixed')).toBeNull();
    });

    test('should close modal on Escape key', () => {
      showDocumentPreviewModal('Content', 'Title');

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(document.querySelector('.fixed')).toBeNull();
    });

    test('should copy formatted text when copy button is clicked', async () => {
      document.execCommand = jest.fn().mockReturnValue(true);

      showDocumentPreviewModal('Content', 'Title');

      const copyBtn = document.querySelector('#copy-formatted-btn');
      await copyBtn.click();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('should download markdown file when download button is clicked', () => {
      const mockUrl = 'blob:test-url';
      const mockAnchor = { href: '', download: '', click: jest.fn() };
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      const originalCreateElement = document.createElement.bind(document);

      URL.createObjectURL = jest.fn(() => mockUrl);
      URL.revokeObjectURL = jest.fn();
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement(tag);
      });

      const onDownload = jest.fn();

      showDocumentPreviewModal('Content', 'Title', 'test-doc.md', onDownload);

      const downloadBtn = document.querySelector('#download-md-btn');
      downloadBtn.click();

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('test-doc.md');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(onDownload).toHaveBeenCalled();

      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    });

    test('should use marked function directly if marked.parse is unavailable', () => {
      global.marked = (md) => `<strong>${md}</strong>`;

      showDocumentPreviewModal('Bold text', 'Title');

      const modal = document.querySelector('.fixed');
      expect(modal.innerHTML).toContain('<strong>');

      modal.querySelector('#close-modal-btn').click();
      delete global.marked;
    });
  });
});
