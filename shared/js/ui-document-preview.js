/**
 * UI Document Preview Modal Module
 * Displays markdown rendered as HTML with copy and download options
 * @module ui-document-preview
 */

import { escapeHtml } from './ui-formatters.js';
import { copyToClipboard } from './ui-clipboard.js';
import { showToast } from './ui-toast.js';

/**
 * Show formatted document preview modal
 * @param {string} markdown - Markdown content to display
 * @param {string} title - Modal title (default: 'Your Document is Ready')
 * @param {string} filename - Filename for download (default: 'document.md')
 * @param {Function} [onDownload] - Optional callback after download
 */
export function showDocumentPreviewModal(markdown, title = 'Your Document is Ready', filename = 'document.md', onDownload = null) {
  // Render markdown to HTML using marked.js
  // @ts-ignore - marked is loaded via CDN
  let renderedHtml;
  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    renderedHtml = marked.parse(markdown);
  } else if (typeof marked !== 'undefined' && typeof marked === 'function') {
    renderedHtml = marked(markdown);
  } else {
    renderedHtml = escapeHtml(markdown).replace(/\n/g, '<br>');
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">${escapeHtml(title)}</h3>
                <button id="close-preview-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="flex-1 overflow-auto p-6">
                <div id="preview-content" class="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                    prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300">
                    ${renderedHtml}
                </div>
            </div>
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    💡 <strong>Tip:</strong> Click "Copy Formatted Text", then paste into Word or Google Docs — the formatting transfers automatically.
                </p>
                <div class="flex flex-wrap justify-end gap-3">
                    <button id="copy-formatted-btn" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        📋 Copy Formatted Text
                    </button>
                    <button id="download-md-btn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        📄 Download .md File
                    </button>
                    <button id="download-docx-btn" class="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                        📝 Download .docx
                    </button>
                    <button id="close-modal-btn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector('#close-preview-modal').addEventListener('click', closeModal);
  modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);

  // Copy formatted text (selects the rendered HTML content)
  modal.querySelector('#copy-formatted-btn').addEventListener('click', async () => {
    try {
      const previewContent = modal.querySelector('#preview-content');
      const range = document.createRange();
      range.selectNodeContents(previewContent);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const successful = document.execCommand('copy');
      selection.removeAllRanges();

      if (successful) {
        showToast('Formatted text copied! Paste into Word or Google Docs.', 'success');
      } else {
        await copyToClipboard(markdown);
        showToast('Text copied! Paste into Word or Google Docs.', 'success');
      }
    } catch {
      try {
        await copyToClipboard(markdown);
        showToast('Text copied to clipboard.', 'success');
      } catch {
        showToast('Failed to copy. Please select and copy manually.', 'error');
      }
    }
  });

  // Download as .md file
  modal.querySelector('#download-md-btn').addEventListener('click', () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File downloaded!', 'success');
    if (onDownload) {
      onDownload();
    }
  });

  // Download as .docx file (Word document)
  modal.querySelector('#download-docx-btn').addEventListener('click', async () => {
    const btn = modal.querySelector('#download-docx-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Converting...';
    btn.disabled = true;

    try {
      const { default: markdownDocx, Packer } = await import('https://esm.sh/markdown-docx@1.5.1?bundle');
      const doc = await markdownDocx(markdown);
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.md$/i, '.docx');
      a.click();
      URL.revokeObjectURL(url);
      showToast('Word document downloaded!', 'success');
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Failed to generate Word document:', error);
      showToast('Failed to generate Word document. Try "Copy Formatted Text" instead.', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

