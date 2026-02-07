/**
 * Import Document Module
 * @module import-document
 * Handles importing existing PR-FAQs from Word/Google Docs via paste
 */

import { validateDocument, getScoreColor, getScoreLabel } from './validator-inline.js';
import { createProject } from './projects.js';
import { navigateTo } from './router.js';
import { showToast } from './ui.js';

const DOC_TYPE = 'PR-FAQ';
const DOC_TYPE_SHORT = 'PR-FAQ';
const MINIMUM_VIABLE_SCORE = 30;

const LLM_CLEANUP_PROMPT = `You are a documentation assistant. Convert this pasted ${DOC_TYPE} content into clean, well-structured Markdown.

**Rules:**
- Preserve ALL substantive content
- Use proper Markdown headings (# ## ###)
- Convert bullet points to Markdown lists
- Convert tables to Markdown tables
- Remove formatting artifacts (font names, colors, etc.)
- Do NOT add commentary - output ONLY the cleaned Markdown

**Suggested ${DOC_TYPE} Structure:**
# PR-FAQ: [Product/Feature Name]
## Press Release
### Headline
### Subheadline
### Problem
### Solution
### Quote from Leadership
### Call to Action
## Frequently Asked Questions
### Customer FAQs
### Internal FAQs

**Content to convert:**
`;

export function convertHtmlToMarkdown(html) {
  if (typeof TurndownService === 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }
  const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  turndownService.addRule('tables', { filter: ['table'], replacement: (content) => '\n\n' + content + '\n\n' });
  return turndownService.turndown(html);
}

export function getImportModalHtml() {
  return `
    <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">📋 Import Existing ${DOC_TYPE_SHORT}</h2>
          <button id="import-modal-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto flex-1">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Paste your ${DOC_TYPE_SHORT} from Word, Google Docs, or any source below.</p>
          <div id="import-paste-step">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paste your content here</label>
            <div id="import-paste-area" contenteditable="true" class="w-full h-48 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"></div>
            <button id="import-convert-btn" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Convert to Markdown</button>
          </div>
          <div id="import-preview-step" class="hidden">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Converted Markdown</label>
              <div id="import-score-badge" class="text-sm font-medium"></div>
            </div>
            <textarea id="import-preview-area" class="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"></textarea>
            <div id="import-llm-suggestion" class="hidden mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p class="text-sm text-yellow-800 dark:text-yellow-200 mb-2">⚠️ The converted document may need cleanup. Copy this prompt to Claude/ChatGPT:</p>
              <button id="import-copy-prompt-btn" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm">Copy LLM Prompt</button>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button id="import-cancel-btn" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
          <button id="import-save-btn" class="hidden px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Save & Continue to Phase 1</button>
        </div>
      </div>
    </div>
  `;
}

export function showImportModal() {
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = getImportModalHtml();
  document.body.appendChild(modalContainer.firstElementChild);

  const modal = document.getElementById('import-modal');
  const pasteArea = document.getElementById('import-paste-area');
  const convertBtn = document.getElementById('import-convert-btn');
  const previewStep = document.getElementById('import-preview-step');
  const pasteStep = document.getElementById('import-paste-step');
  const previewArea = document.getElementById('import-preview-area');
  const scoreBadge = document.getElementById('import-score-badge');
  const llmSuggestion = document.getElementById('import-llm-suggestion');
  const saveBtn = document.getElementById('import-save-btn');
  const copyPromptBtn = document.getElementById('import-copy-prompt-btn');

  const closeModal = () => modal.remove();
  document.getElementById('import-modal-close').addEventListener('click', closeModal);
  document.getElementById('import-cancel-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  convertBtn.addEventListener('click', () => {
    const html = pasteArea.innerHTML;
    if (!html || html === '<br>' || html.trim() === '') { showToast('Please paste some content first', 'error'); return; }
    const markdown = convertHtmlToMarkdown(html);
    pasteStep.classList.add('hidden');
    previewStep.classList.remove('hidden');
    previewArea.value = markdown;
    const validation = validateDocument(markdown);
    const score = validation.totalScore;
    scoreBadge.innerHTML = `<span class="px-2 py-1 rounded text-${getScoreColor(score)}-700 dark:text-${getScoreColor(score)}-400 bg-${getScoreColor(score)}-100 dark:bg-${getScoreColor(score)}-900/30">${score}% · ${getScoreLabel(score)}</span>`;
    saveBtn.classList.remove('hidden');
    if (score < MINIMUM_VIABLE_SCORE) llmSuggestion.classList.remove('hidden');
  });

  copyPromptBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(LLM_CLEANUP_PROMPT + previewArea.value).then(() => showToast('Prompt copied! Paste into Claude or ChatGPT.', 'success'));
  });

  let isSaving = false;
  saveBtn.addEventListener('click', async () => {
    if (isSaving) return;
    isSaving = true; saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
    try {
      const markdown = previewArea.value;
      if (!markdown.trim()) { showToast('No content to save', 'error'); return; }
      const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m);
      const title = titleMatch ? titleMatch[1].replace(/^PR-FAQ:\s*/i, '').trim() : `Imported ${DOC_TYPE_SHORT}`;
      const project = await createProject({ title, problems: `(Imported from existing ${DOC_TYPE_SHORT})`, context: `(Imported from existing ${DOC_TYPE_SHORT})` });
      if (!project || !project.id) { showToast('Failed to create project', 'error'); return; }
      const { updateProject } = await import('./projects.js');
      await updateProject(project.id, { phases: { ...project.phases, 1: { ...project.phases[1], response: markdown, completed: false, startedAt: new Date().toISOString() } }, importedContent: markdown });
      closeModal();
      showToast(`${DOC_TYPE_SHORT} imported! Review and refine in Phase 1.`, 'success');
      navigateTo('project', project.id);
    } finally { isSaving = false; saveBtn.disabled = false; saveBtn.textContent = 'Save & Continue to Phase 1'; }
  });
  pasteArea.focus();
}

