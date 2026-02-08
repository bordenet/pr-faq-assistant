// ============================================================
// PR-FAQ Web Validator - Main Application
// ============================================================

import { validatePRFAQ } from './validator.js';
import { showToast, copyToClipboard, debounce, getScoreColor, showPromptModal, createStorage } from './core/index.js';
import { generateCritiquePrompt, generateRewritePrompt, generateLLMScoringPrompt } from './prompts.js';

// ============================================================
// Initialize storage with factory
// ============================================================

const storage = createStorage('pr-faq-validator-history');

// ============================================================
// State
// ============================================================

let currentResult = null;
let _lastSavedContent = ''; // eslint-disable-line no-unused-vars -- reserved for future dirty-state tracking
let currentPrompt = null;
let isLLMMode = false;

// ============================================================
// DOM Elements
// ============================================================

const editor = document.getElementById('editor');
const scoreTotal = document.getElementById('score-total');
const scoreStructure = document.getElementById('score-structure');
const scoreContent = document.getElementById('score-content');
const scoreProfessional = document.getElementById('score-professional');
const scoreEvidence = document.getElementById('score-evidence');
const aiPowerups = document.getElementById('ai-powerups');
const btnCritique = document.getElementById('btn-critique');
const btnRewrite = document.getElementById('btn-rewrite');
const btnSave = document.getElementById('btn-save');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const versionInfo = document.getElementById('version-info');
const lastSaved = document.getElementById('last-saved');
const storageInfoEl = document.getElementById('storage-info');
const toastContainer = document.getElementById('toast-container');
const btnDarkMode = document.getElementById('btn-dark-mode');
const btnAbout = document.getElementById('btn-about');
const btnOpenClaude = document.getElementById('btn-open-claude');
const btnViewPrompt = document.getElementById('btn-view-prompt');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const quickScorePanel = document.getElementById('quick-score-panel');
const llmScorePanel = document.getElementById('llm-score-panel');
const modeLabelQuick = document.getElementById('mode-label-quick');
const modeLabelLLM = document.getElementById('mode-label-llm');
const btnCopyLLMPrompt = document.getElementById('btn-copy-llm-prompt');
const btnViewLLMPrompt = document.getElementById('btn-view-llm-prompt');
const btnOpenClaudeLLM = document.getElementById('btn-open-claude-llm');

// ============================================================
// Score Display
// ============================================================

function updateScoreDisplay(result) {
  if (!result) return;

  // Update total score with color
  scoreTotal.textContent = result.totalScore;
  scoreTotal.className = `text-4xl font-bold ${getScoreColor(result.totalScore, 100)}`;

  // Update dimension scores (just the score number - max is hardcoded in HTML)
  scoreStructure.textContent = result.structure.score;
  scoreContent.textContent = result.content.score;
  scoreProfessional.textContent = result.professional.score;
  scoreEvidence.textContent = result.evidence.score;

  // Apply colors to dimension scores
  scoreStructure.className = getScoreColor(result.structure.score, result.structure.maxScore);
  scoreContent.className = getScoreColor(result.content.score, result.content.maxScore);
  scoreProfessional.className = getScoreColor(result.professional.score, result.professional.maxScore);
  scoreEvidence.className = getScoreColor(result.evidence.score, result.evidence.maxScore);

  // Update progress bars
  const totalPercent = (result.totalScore / 100) * 100;
  const structurePercent = (result.structure.score / result.structure.maxScore) * 100;
  const contentPercent = (result.content.score / result.content.maxScore) * 100;
  const professionalPercent = (result.professional.score / result.professional.maxScore) * 100;
  const evidencePercent = (result.evidence.score / result.evidence.maxScore) * 100;

  const scoreBar = document.getElementById('score-bar');
  const structureBar = document.getElementById('score-structure-bar');
  const contentBar = document.getElementById('score-content-bar');
  const professionalBar = document.getElementById('score-professional-bar');
  const evidenceBar = document.getElementById('score-evidence-bar');

  if (scoreBar) scoreBar.style.width = `${totalPercent}%`;
  if (structureBar) structureBar.style.width = `${structurePercent}%`;
  if (contentBar) contentBar.style.width = `${contentPercent}%`;
  if (professionalBar) professionalBar.style.width = `${professionalPercent}%`;
  if (evidenceBar) evidenceBar.style.width = `${evidencePercent}%`;
}

// ============================================================
// Validation
// ============================================================

function runValidation() {
  const content = editor.value || '';
  currentResult = validatePRFAQ(content);
  updateScoreDisplay(currentResult);

  // Show/hide AI power-ups based on content length
  if (content.length > 200) {
    aiPowerups.classList.remove('hidden');
  } else {
    aiPowerups.classList.add('hidden');
  }

  // Highlight fluff words (only if there are any)
  if (currentResult.fluffWords && currentResult.fluffWords.length > 0) {
    // Don't re-highlight on every keystroke - causes cursor issues
    // Just update on blur or explicit refresh
  }
}

const debouncedValidation = debounce(runValidation, 300);

// ============================================================
// Version Control
// ============================================================

function updateVersionDisplay() {
  const version = storage.getCurrentVersion();
  if (version) {
    versionInfo.textContent = `Version ${version.versionNumber} of ${version.totalVersions}`;
    lastSaved.textContent = storage.getTimeSince(version.savedAt);
    btnBack.disabled = !version.canGoBack;
    btnForward.disabled = !version.canGoForward;
  } else {
    versionInfo.textContent = 'No saved versions';
    lastSaved.textContent = '';
    btnBack.disabled = true;
    btnForward.disabled = true;
  }
  updateStorageInfo();
}

async function updateStorageInfo() {
  const estimate = await storage.getStorageEstimate();
  if (estimate && storageInfoEl) {
    storageInfoEl.textContent = `Storage: ${storage.formatBytes(estimate.usage)} / ${storage.formatBytes(estimate.quota)} (${estimate.percentage}%)`;
  } else if (storageInfoEl) {
    storageInfoEl.textContent = 'Storage: Available';
  }
}

function handleSave() {
  const content = editor.value || '';
  if (!content.trim()) {
    showToast('Nothing to save', 'warning', toastContainer);
    return;
  }

  const result = storage.saveVersion(content);
  if (result.success) {
    _lastSavedContent = content;
    showToast(`Saved as version ${result.versionNumber}`, 'success', toastContainer);
    updateVersionDisplay();
  } else if (result.reason === 'no-change') {
    showToast('No changes to save', 'info', toastContainer);
  } else {
    showToast('Failed to save', 'error', toastContainer);
  }
}

function handleGoBack() {
  const version = storage.goBack();
  if (version) {
    editor.value = version.markdown;
    _lastSavedContent = version.markdown;
    runValidation();
    updateVersionDisplay();
    showToast(`Restored version ${version.versionNumber}`, 'info', toastContainer);
  }
}

function handleGoForward() {
  const version = storage.goForward();
  if (version) {
    editor.value = version.markdown;
    _lastSavedContent = version.markdown;
    runValidation();
    updateVersionDisplay();
    showToast(`Restored version ${version.versionNumber}`, 'info', toastContainer);
  }
}

// ============================================================
// AI Power-ups
// ============================================================

function enableClaudeButton() {
  if (btnOpenClaude) {
    btnOpenClaude.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed', 'pointer-events-none');
    btnOpenClaude.classList.add('bg-orange-600', 'dark:bg-orange-500', 'hover:bg-orange-700', 'dark:hover:bg-orange-600', 'text-white');
    btnOpenClaude.removeAttribute('aria-disabled');
  }
}

function enableViewPromptButton() {
  if (btnViewPrompt) {
    btnViewPrompt.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed');
    btnViewPrompt.classList.add('bg-teal-600', 'hover:bg-teal-700', 'text-white');
    btnViewPrompt.disabled = false;
    btnViewPrompt.removeAttribute('aria-disabled');
  }
}

function handleCritique() {
  const content = editor.value || '';
  if (!content || !currentResult) {
    showToast('Add some content first', 'warning', toastContainer);
    return;
  }

  const prompt = generateCritiquePrompt(content, currentResult);
  currentPrompt = { text: prompt, type: 'Critique' };

  // Enable buttons immediately since prompt is generated
  enableClaudeButton();
  enableViewPromptButton();

  copyToClipboard(prompt).then(success => {
    if (success) {
      showToast('Critique prompt copied! Now open Claude.ai and paste.', 'success', toastContainer);
    } else {
      showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
    }
  }).catch(() => {
    showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
  });
}

function handleRewrite() {
  const content = editor.value || '';
  if (!content || !currentResult) {
    showToast('Add some content first', 'warning', toastContainer);
    return;
  }

  const prompt = generateRewritePrompt(content, currentResult);
  currentPrompt = { text: prompt, type: 'Rewrite' };

  // Enable buttons immediately since prompt is generated
  enableClaudeButton();
  enableViewPromptButton();

  copyToClipboard(prompt).then(success => {
    if (success) {
      showToast('Rewrite prompt copied! Now open Claude.ai and paste.', 'success', toastContainer);
    } else {
      showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
    }
  }).catch(() => {
    showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
  });
}

// ============================================================
// Scoring Mode Toggle
// ============================================================

function toggleScoringMode() {
  isLLMMode = !isLLMMode;

  // Update toggle button appearance
  const toggleKnob = btnToggleMode.querySelector('span');
  if (isLLMMode) {
    btnToggleMode.classList.remove('bg-slate-500');
    btnToggleMode.classList.add('bg-indigo-600');
    toggleKnob.style.transform = 'translateX(24px)';
    btnToggleMode.setAttribute('aria-checked', 'true');
    modeLabelQuick.classList.remove('text-white');
    modeLabelQuick.classList.add('text-slate-400');
    modeLabelLLM.classList.remove('text-slate-400');
    modeLabelLLM.classList.add('text-white');
  } else {
    btnToggleMode.classList.remove('bg-indigo-600');
    btnToggleMode.classList.add('bg-slate-500');
    toggleKnob.style.transform = 'translateX(0)';
    btnToggleMode.setAttribute('aria-checked', 'false');
    modeLabelQuick.classList.remove('text-slate-400');
    modeLabelQuick.classList.add('text-white');
    modeLabelLLM.classList.remove('text-white');
    modeLabelLLM.classList.add('text-slate-400');
  }

  // Toggle panels
  if (isLLMMode) {
    quickScorePanel.classList.add('hidden');
    llmScorePanel.classList.remove('hidden');
  } else {
    quickScorePanel.classList.remove('hidden');
    llmScorePanel.classList.add('hidden');
  }

  // Save preference
  localStorage.setItem('scoringMode', isLLMMode ? 'llm' : 'quick');
}

function initScoringMode() {
  const saved = localStorage.getItem('scoringMode');
  if (saved === 'llm') {
    isLLMMode = false; // Will be toggled to true
    toggleScoringMode();
  }
}

function enableViewLLMPromptButton() {
  if (btnViewLLMPrompt) {
    btnViewLLMPrompt.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed');
    btnViewLLMPrompt.classList.add('bg-teal-600', 'hover:bg-teal-700', 'text-white');
    btnViewLLMPrompt.disabled = false;
    btnViewLLMPrompt.removeAttribute('aria-disabled');
  }
}

function enableClaudeLLMButton() {
  if (btnOpenClaudeLLM) {
    btnOpenClaudeLLM.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed', 'pointer-events-none');
    btnOpenClaudeLLM.classList.add('bg-orange-600', 'hover:bg-orange-700', 'text-white');
    btnOpenClaudeLLM.removeAttribute('aria-disabled');
  }
}

function handleCopyLLMPrompt() {
  const content = editor.value || '';
  if (!content.trim()) {
    showToast('Add some content first', 'warning', toastContainer);
    return;
  }

  const prompt = generateLLMScoringPrompt(content);
  currentPrompt = { text: prompt, type: 'LLM Scoring' };

  enableViewLLMPromptButton();
  enableClaudeLLMButton();

  copyToClipboard(prompt).then(success => {
    if (success) {
      showToast('LLM scoring prompt copied! Paste into Claude.ai for detailed evaluation.', 'success', toastContainer);
    } else {
      showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
    }
  }).catch(() => {
    showToast('Prompt ready but copy failed. Use View Prompt to copy manually.', 'warning', toastContainer);
  });
}

function handleViewLLMPrompt() {
  if (!currentPrompt || currentPrompt.type !== 'LLM Scoring') {
    showToast('Copy the scoring prompt first', 'warning', toastContainer);
    return;
  }

  showPromptModal(currentPrompt.text, 'LLM Scoring Prompt');
}

// ============================================================
// Dark Mode
// ============================================================

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
}

// ============================================================
// About Modal
// ============================================================

function showAbout() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
      <h2 class="text-xl font-bold mb-4 dark:text-white">PR-FAQ Validator</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        A client-side tool for validating PR-FAQ documents against Amazon's press release best practices.
      </p>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        <strong>Scoring Dimensions:</strong><br>
        • Structure & Hook (20 pts)<br>
        • Content Quality (20 pts)<br>
        • Professional Quality (15 pts)<br>
        • Customer Evidence (10 pts)<br>
        • FAQ Quality (35 pts)
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        100% client-side. Your content never leaves your browser.
      </p>
      <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded" onclick="this.closest('.fixed').remove()">
        Close
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ============================================================
// Initialize
// ============================================================

function init() {
  // Initialize dark mode and scoring mode
  initDarkMode();
  initScoringMode();

  // Load last saved version on startup
  const draft = storage.loadDraft();
  if (draft && draft.markdown) {
    editor.value = draft.markdown;
    _lastSavedContent = draft.markdown;
  }
  updateVersionDisplay();

  // Event listeners
  editor.addEventListener('input', () => {
    debouncedValidation();
  });

  // Note: Fluff word highlighting removed - not supported in textarea elements
  // Would require switching to contenteditable div for inline highlighting

  btnCritique.addEventListener('click', handleCritique);
  btnRewrite.addEventListener('click', handleRewrite);
  btnSave.addEventListener('click', handleSave);
  btnBack.addEventListener('click', handleGoBack);
  btnForward.addEventListener('click', handleGoForward);
  btnDarkMode.addEventListener('click', toggleDarkMode);
  btnAbout.addEventListener('click', showAbout);

  // Scoring mode toggle
  if (btnToggleMode) {
    btnToggleMode.addEventListener('click', toggleScoringMode);
  }

  // LLM scoring buttons
  if (btnCopyLLMPrompt) {
    btnCopyLLMPrompt.addEventListener('click', handleCopyLLMPrompt);
  }
  if (btnViewLLMPrompt) {
    btnViewLLMPrompt.addEventListener('click', handleViewLLMPrompt);
  }

  // Keyboard shortcut: Cmd+S to save
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  });

  // View Prompt button - shows modal with the current prompt
  if (btnViewPrompt) {
    btnViewPrompt.addEventListener('click', () => {
      if (currentPrompt && currentPrompt.text) {
        showPromptModal(currentPrompt.text, `${currentPrompt.type} Prompt`);
      }
    });
  }

  // Update version display periodically (for time since save)
  setInterval(updateVersionDisplay, 60000);

  // Initial validation if there's content
  if (editor.value.trim()) {
    runValidation();
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
