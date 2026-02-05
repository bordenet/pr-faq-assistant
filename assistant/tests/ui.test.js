import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { showToast, showLoading, hideLoading, confirm, confirmWithRemember, formatDate, formatBytes, escapeHtml, copyToClipboard, copyToClipboardAsync, showPromptModal, showDocumentPreviewModal } from '../js/ui.js';

describe('UI Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="toast-container"></div>
      <div id="loading-overlay" class="hidden">
        <span id="loading-text">Loading...</span>
      </div>
    `;
        jest.clearAllTimers();
    });

    describe('showToast', () => {
        test('should create a toast element in the container', () => {
            showToast('Test message', 'success');
            const container = document.getElementById('toast-container');
            expect(container.children.length).toBe(1);
        });

        test('should display the correct message', () => {
            showToast('Hello World', 'info');
            const container = document.getElementById('toast-container');
            expect(container.innerHTML).toContain('Hello World');
        });

        test('should apply success styling', () => {
            showToast('Success!', 'success');
            const toast = document.querySelector('#toast-container > div');
            expect(toast.className).toContain('bg-green-500');
        });

        test('should apply error styling', () => {
            showToast('Error!', 'error');
            const toast = document.querySelector('#toast-container > div');
            expect(toast.className).toContain('bg-red-500');
        });

        test('should apply warning styling', () => {
            showToast('Warning!', 'warning');
            const toast = document.querySelector('#toast-container > div');
            expect(toast.className).toContain('bg-yellow-500');
        });

        test('should apply info styling by default', () => {
            showToast('Info');
            const toast = document.querySelector('#toast-container > div');
            expect(toast.className).toContain('bg-blue-500');
        });
    });

    describe('showLoading', () => {
        test('should show the loading overlay', () => {
            showLoading();
            const overlay = document.getElementById('loading-overlay');
            expect(overlay.classList.contains('hidden')).toBe(false);
        });

        test('should display custom loading text', () => {
            showLoading('Processing...');
            const text = document.getElementById('loading-text');
            expect(text.textContent).toBe('Processing...');
        });

        test('should use default text when none provided', () => {
            showLoading();
            const text = document.getElementById('loading-text');
            expect(text.textContent).toBe('Loading...');
        });
    });

    describe('hideLoading', () => {
        test('should hide the loading overlay', () => {
            const overlay = document.getElementById('loading-overlay');
            overlay.classList.remove('hidden');

            hideLoading();

            expect(overlay.classList.contains('hidden')).toBe(true);
        });
    });

    describe('confirm', () => {
        test('should resolve true when confirm button is clicked', async () => {
            const confirmPromise = confirm('Are you sure?', 'Delete');

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

    describe('confirmWithRemember', () => {
        test('should resolve with confirmed=true and remember=false when confirm clicked without checkbox', async () => {
            const confirmPromise = confirmWithRemember('Are you sure?', 'Warning');

            await new Promise(resolve => setTimeout(resolve, 0));

            const confirmBtn = document.querySelector('#confirm-btn');
            expect(confirmBtn).toBeTruthy();
            confirmBtn.click();

            const result = await confirmPromise;
            expect(result).toEqual({ confirmed: true, remember: false });
        });

        test('should resolve with confirmed=true and remember=true when checkbox is checked', async () => {
            const confirmPromise = confirmWithRemember('Are you sure?', 'Warning');

            await new Promise(resolve => setTimeout(resolve, 0));

            const checkbox = document.querySelector('#remember-checkbox');
            expect(checkbox).toBeTruthy();
            checkbox.checked = true;

            const confirmBtn = document.querySelector('#confirm-btn');
            confirmBtn.click();

            const result = await confirmPromise;
            expect(result).toEqual({ confirmed: true, remember: true });
        });

        test('should resolve with confirmed=false when cancel clicked', async () => {
            const confirmPromise = confirmWithRemember('Are you sure?', 'Warning');

            await new Promise(resolve => setTimeout(resolve, 0));

            const cancelBtn = document.querySelector('#cancel-btn');
            expect(cancelBtn).toBeTruthy();
            cancelBtn.click();

            const result = await confirmPromise;
            expect(result).toEqual({ confirmed: false, remember: false });
        });

        test('should display custom button text from options', async () => {
            const confirmPromise = confirmWithRemember('Continue?', 'Confirm', {
                confirmText: 'Yes, Continue',
                cancelText: 'No, Go Back',
                checkboxLabel: 'Remember my choice'
            });

            await new Promise(resolve => setTimeout(resolve, 0));

            const modal = document.querySelector('.fixed');
            expect(modal.innerHTML).toContain('Yes, Continue');
            expect(modal.innerHTML).toContain('No, Go Back');
            expect(modal.innerHTML).toContain('Remember my choice');

            // Clean up
            document.querySelector('#cancel-btn').click();
            await confirmPromise;
        });

        test('should resolve with confirmed=false when backdrop is clicked', async () => {
            const confirmPromise = confirmWithRemember('Are you sure?', 'Warning');

            await new Promise(resolve => setTimeout(resolve, 0));

            const modal = document.querySelector('.fixed');
            expect(modal).toBeTruthy();

            // Simulate backdrop click
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal, enumerable: true });
            modal.dispatchEvent(event);

            const result = await confirmPromise;
            expect(result).toEqual({ confirmed: false, remember: false });
        });
    });

    describe('formatDate', () => {
        test('should return "Today" for same-day dates', () => {
            const now = new Date().toISOString();
            expect(formatDate(now)).toBe('Today');
        });

        test('should return "Yesterday" for previous day', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(formatDate(yesterday)).toBe('Yesterday');
        });

        test('should return "X days ago" for dates within a week', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            expect(formatDate(threeDaysAgo)).toBe('3 days ago');
        });

        test('should return formatted date for dates older than a week', () => {
            const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
            const result = formatDate(tenDaysAgo);
            // Should return a localized date string (format varies by locale)
            expect(result).toBeTruthy();
        });
    });

    describe('formatBytes', () => {
        test('should return "0 Bytes" for 0', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
        });

        test('should format bytes correctly', () => {
            expect(formatBytes(512)).toBe('512 Bytes');
        });

        test('should format KB correctly', () => {
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1536)).toBe('1.5 KB');
        });

        test('should format MB correctly', () => {
            expect(formatBytes(1048576)).toBe('1 MB');
            expect(formatBytes(1572864)).toBe('1.5 MB');
        });

        test('should format GB correctly', () => {
            expect(formatBytes(1073741824)).toBe('1 GB');
        });
    });

    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });

        test('should return empty string for null/undefined', () => {
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });

        test('should escape ampersands', () => {
            expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });
    });

    describe('copyToClipboard', () => {
        test('should copy text to clipboard using ClipboardItem with Promise', async () => {
            const writeMock = jest.fn().mockResolvedValue();
            navigator.clipboard.write = writeMock;

            await copyToClipboard('test text');

            // The new implementation uses ClipboardItem with Promise-wrapped Blob for Safari transient activation
            expect(writeMock).toHaveBeenCalledTimes(1);
            // Verify it was called with an array containing a ClipboardItem
            expect(writeMock).toHaveBeenCalledWith(expect.any(Array));
        });

        test('should throw error if all clipboard methods fail', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Mock write (ClipboardItem) to fail
            navigator.clipboard.write = jest.fn().mockRejectedValue(new Error('Not allowed'));
            // Mock execCommand to also fail
            document.execCommand = jest.fn().mockReturnValue(false);

            await expect(copyToClipboard('test text')).rejects.toThrow();

            consoleWarnSpy.mockRestore();
        });

        test('should not show any toast notifications', async () => {
            const writeMock = jest.fn().mockResolvedValue();
            navigator.clipboard.write = writeMock;

            await copyToClipboard('test text');
            const container = document.getElementById('toast-container');
            expect(container.children.length).toBe(0);
        });

        test('should fallback to execCommand when Clipboard API unavailable', async () => {
            // Remove clipboard API
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                writable: true,
            });
            document.execCommand = jest.fn().mockReturnValue(true);

            await copyToClipboard('test text');
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });

    describe('copyToClipboardAsync', () => {
        beforeEach(() => {
            // Ensure clipboard API is available
            if (!navigator.clipboard) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: {},
                    writable: true,
                    configurable: true
                });
            }
        });

        test('should copy text from a promise', async () => {
            const writeMock = jest.fn().mockResolvedValue();
            Object.defineProperty(navigator.clipboard, 'write', {
                value: writeMock,
                writable: true,
                configurable: true
            });

            const textPromise = Promise.resolve('async text');
            await copyToClipboardAsync(textPromise);

            expect(writeMock).toHaveBeenCalledTimes(1);
            expect(writeMock).toHaveBeenCalledWith(expect.any(Array));
        });

        test('should handle delayed promise resolution', async () => {
            const writeMock = jest.fn().mockResolvedValue();
            Object.defineProperty(navigator.clipboard, 'write', {
                value: writeMock,
                writable: true,
                configurable: true
            });

            const delayedPromise = new Promise(resolve =>
                setTimeout(() => resolve('delayed text'), 10)
            );
            await copyToClipboardAsync(delayedPromise);

            expect(writeMock).toHaveBeenCalledTimes(1);
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

            // Simulate backdrop click
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal, enumerable: true });
            modal.dispatchEvent(event);

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

        test('should have a copy button', () => {
            showPromptModal('Test prompt', 'Title');

            const copyBtn = document.querySelector('#copy-prompt-modal-btn');
            expect(copyBtn).toBeTruthy();
            expect(copyBtn.textContent).toContain('Copy');

            // Clean up
            document.querySelector('#close-prompt-modal-btn').click();
        });
    });

    describe('showDocumentPreviewModal', () => {
        test('should display modal with document content', () => {
            showDocumentPreviewModal('# Test Document\n\nThis is content.', 'Preview', 'test.md');

            const modal = document.querySelector('.fixed');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Preview');

            // Clean up
            document.querySelector('#close-modal-btn').click();
        });

        test('should close modal when X button is clicked', () => {
            showDocumentPreviewModal('Content', 'Title', 'doc.md');

            const closeBtn = document.querySelector('#close-preview-modal');
            expect(closeBtn).toBeTruthy();
            closeBtn.click();

            const modal = document.querySelector('.fixed');
            expect(modal).toBeNull();
        });

        test('should close modal on Escape key', () => {
            showDocumentPreviewModal('Content', 'Title', 'doc.md');

            const modal = document.querySelector('.fixed');
            expect(modal).toBeTruthy();

            // Simulate Escape key
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            const modalAfter = document.querySelector('.fixed');
            expect(modalAfter).toBeNull();
        });

        test('should close modal when backdrop is clicked', () => {
            showDocumentPreviewModal('Content', 'Title', 'doc.md');

            const modal = document.querySelector('.fixed');
            expect(modal).toBeTruthy();

            // Simulate backdrop click
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal, enumerable: true });
            modal.dispatchEvent(event);

            const modalAfter = document.querySelector('.fixed');
            expect(modalAfter).toBeNull();
        });

        test('should have download button that creates file', () => {
            // Mock URL and createElement for download
            const mockUrl = 'blob:test';
            URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
            URL.revokeObjectURL = jest.fn();

            showDocumentPreviewModal('Content', 'Title', 'doc.md');

            const downloadBtn = document.querySelector('#download-md-btn');
            expect(downloadBtn).toBeTruthy();
            downloadBtn.click();

            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

            // Clean up
            document.querySelector('#close-modal-btn').click();
        });

        test('should call onDownload callback after download', () => {
            URL.createObjectURL = jest.fn().mockReturnValue('blob:test');
            URL.revokeObjectURL = jest.fn();

            const onDownload = jest.fn();
            showDocumentPreviewModal('Content', 'Title', 'doc.md', onDownload);

            const downloadBtn = document.querySelector('#download-md-btn');
            downloadBtn.click();

            expect(onDownload).toHaveBeenCalledTimes(1);

            // Clean up
            document.querySelector('#close-modal-btn').click();
        });

        test('should handle missing marked library gracefully', () => {
            // marked is not defined in test environment
            showDocumentPreviewModal('<b>Bold</b> text', 'Title', 'doc.md');

            const modal = document.querySelector('.fixed');
            expect(modal).toBeTruthy();
            // Should escape HTML when marked is unavailable
            expect(modal.innerHTML).toContain('&lt;b&gt;');

            // Clean up
            document.querySelector('#close-modal-btn').click();
        });
    });
});
