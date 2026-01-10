/**
 * Project View Module
 * Handles rendering the project workflow view with phase tabs
 */

import { getProject, deleteProject, savePhaseOutput, exportProjectAsMarkdown } from './projects.js';
import { escapeHtml, showToast, copyToClipboard, showPromptModal, confirm } from './ui.js';
import { navigateTo } from './router.js';
import { Workflow, WORKFLOW_CONFIG } from './workflow.js';

const PRFAQ_DOCS_URL = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';

/**
 * Render the project detail view
 */
export async function renderProjectView(projectId) {
  const project = await getProject(projectId);

  if (!project) {
    showToast('Project not found', 'error');
    navigateTo('home');
    return;
  }

  const workflow = new Workflow(project);
  const container = document.getElementById('app-container');
  const isFullyComplete = workflow.currentPhase > WORKFLOW_CONFIG.phaseCount ||
        (workflow.getPhaseOutput(WORKFLOW_CONFIG.phaseCount) && workflow.currentPhase === WORKFLOW_CONFIG.phaseCount);

  container.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <button id="back-home" class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to <a href="${PRFAQ_DOCS_URL}" target="_blank" rel="noopener noreferrer" class="hover:underline">PR-FAQs</a>
            </button>
            ${isFullyComplete ? `
                <button id="export-final-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    📄 Export as Markdown
                </button>
            ` : ''}
        </div>

        <!-- Phase Tabs -->
        <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex space-x-1">
                ${WORKFLOW_CONFIG.phases.map(p => {
    const isActive = workflow.currentPhase === p.number;
    const hasOutput = workflow.getPhaseOutput(p.number);
    return `
                    <button class="phase-tab px-6 py-3 font-medium transition-colors ${
  isActive
    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
}" data-phase="${p.number}">
                        <span class="mr-2">${p.icon}</span>
                        Phase ${p.number}
                        ${hasOutput ? '<span class="ml-2 text-green-500">✓</span>' : ''}
                    </button>
                `;
  }).join('')}
            </div>
        </div>

        <!-- Phase Content -->
        <div id="phase-content">
            ${renderPhaseContent(workflow)}
        </div>
    `;

  setupProjectViewListeners(project, workflow);
}

/**
 * Render content for the current phase
 */
function renderPhaseContent(workflow) {
  const phase = workflow.getCurrentPhase();
  const hasExistingOutput = workflow.getPhaseOutput(workflow.currentPhase);
  const aiUrl = phase.aiModel === 'Gemini' ? 'https://gemini.google.com' : 'https://claude.ai';
  const aiName = phase.aiModel;
  const isFullyComplete = workflow.currentPhase === WORKFLOW_CONFIG.phaseCount && hasExistingOutput;

  return `
        ${isFullyComplete ? `
        <!-- Phase 3 Complete: Export Call-to-Action -->
        <div class="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-green-800 dark:text-green-300 flex items-center">
                        <span class="mr-2">🎉</span> Your PR-FAQ is Complete!
                    </h4>
                    <p class="text-green-700 dark:text-green-400 mt-1">
                        Download your finished PR-FAQ document as a Markdown (.md) file.
                    </p>
                </div>
                <button id="export-complete-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg">
                    📄 Export as Markdown
                </button>
            </div>
        </div>
        ` : ''}

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="mb-6">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ${phase.icon} ${phase.name}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-2">${phase.description}</p>
                <div class="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                    <span class="mr-2">🤖</span>
                    Use with ${aiName}
                </div>
            </div>

            <!-- Step A: Copy Prompt to AI -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step A: Copy Prompt to AI
                </h4>
                <div class="flex justify-between items-center flex-wrap gap-3">
                    <div class="flex gap-3 flex-wrap">
                        <button id="copy-prompt-btn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            📋 Copy Prompt to Clipboard
                        </button>
                        <a id="open-ai-btn" href="${aiUrl}" target="ai-assistant-tab" rel="noopener noreferrer"
                            class="px-6 py-3 bg-green-600 text-white rounded-lg transition-colors font-medium opacity-50 cursor-not-allowed pointer-events-none"
                            aria-disabled="true">
                            🔗 Open ${aiName}
                        </a>
                    </div>
                    <button id="view-prompt-btn" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                        👁️ View Prompt
                    </button>
                </div>
            </div>

            <!-- Step B: Paste Response -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step B: Paste ${aiName}'s Response
                </h4>
                <textarea id="phase-output" rows="12"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Paste ${aiName}'s response here..."
                    disabled
                >${escapeHtml(hasExistingOutput || '')}</textarea>

                <div class="mt-3 flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        ${hasExistingOutput ? '✓ Phase completed' : 'Paste response to complete this phase'}
                    </span>
                    <button id="save-response-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Save Response
                    </button>
                </div>
            </div>

            <!-- Navigation -->
            ${renderPhaseNavigation(workflow, hasExistingOutput)}
        </div>
    `;
}

/**
 * Render phase navigation buttons
 */
function renderPhaseNavigation(workflow, hasExistingOutput) {
  return `
        <div class="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex gap-3">
                ${workflow.currentPhase === 1 && !hasExistingOutput ? `
                <button id="edit-details-btn" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    ← Edit Details
                </button>
                ` : workflow.currentPhase > 1 ? `
                <button id="prev-phase-btn" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    ← Previous Phase
                </button>
                ` : ''}
                ${hasExistingOutput && workflow.currentPhase < WORKFLOW_CONFIG.phaseCount ? `
                <button id="next-phase-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Next Phase →
                </button>
                ` : ''}
            </div>
            <button id="delete-project-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                Delete
            </button>
        </div>
    `;
}

/**
 * Setup project view event listeners
 */
function setupProjectViewListeners(project, workflow) {
  document.getElementById('back-home')?.addEventListener('click', () => navigateTo('home'));

  // Phase tabs - switch between phases
  document.querySelectorAll('.phase-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const targetPhase = parseInt(tab.dataset.phase);
      workflow.currentPhase = targetPhase;
      project.phase = targetPhase;
      updatePhaseTabStyles(targetPhase);
      document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
      setupPhaseContentListeners(project, workflow);
    });
  });

  // Export final PR-FAQ button (header)
  document.getElementById('export-final-btn')?.addEventListener('click', () => {
    exportProjectAsMarkdown(project.id);
  });

  setupPhaseContentListeners(project, workflow);
}

/**
 * Update phase tab visual styles
 */
function updatePhaseTabStyles(activePhase) {
  document.querySelectorAll('.phase-tab').forEach(tab => {
    const tabPhase = parseInt(tab.dataset.phase);
    if (tabPhase === activePhase) {
      tab.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-gray-200');
      tab.classList.add('border-b-2', 'border-blue-600', 'text-blue-600', 'dark:text-blue-400');
    } else {
      tab.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600', 'dark:text-blue-400');
      tab.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-gray-200');
    }
  });
}

/**
 * Setup event listeners for phase content (called when phase changes)
 */
function setupPhaseContentListeners(project, workflow) {
  const responseTextarea = document.getElementById('phase-output');
  const saveResponseBtn = document.getElementById('save-response-btn');
  const phase = workflow.getCurrentPhase();

  // Export complete button (Phase 3 completion CTA)
  document.getElementById('export-complete-btn')?.addEventListener('click', () => {
    exportProjectAsMarkdown(project.id);
  });

  // View Prompt button - shows modal
  document.getElementById('view-prompt-btn')?.addEventListener('click', () => {
    const prompt = workflow.generatePrompt();
    showPromptModal(prompt, `Phase ${workflow.currentPhase}: ${phase.name} Prompt`);
  });

  // Copy Prompt - enables the Open AI button and textarea
  document.getElementById('copy-prompt-btn')?.addEventListener('click', () => {
    const prompt = workflow.generatePrompt();
    copyToClipboard(prompt);

    // Enable the "Open AI" button
    const openAiBtn = document.getElementById('open-ai-btn');
    if (openAiBtn) {
      openAiBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
      openAiBtn.classList.add('hover:bg-green-700');
      openAiBtn.removeAttribute('aria-disabled');
    }

    // Enable the response textarea
    if (responseTextarea) {
      responseTextarea.disabled = false;
      responseTextarea.focus();
    }
  });

  // Update save button state as user types or pastes
  const updateSaveButtonState = () => {
    const hasEnoughContent = responseTextarea.value.trim().length >= 10;
    if (saveResponseBtn) {
      saveResponseBtn.disabled = !hasEnoughContent;
    }
  };
  responseTextarea?.addEventListener('input', updateSaveButtonState);
  responseTextarea?.addEventListener('paste', () => {
    setTimeout(updateSaveButtonState, 0);
  });

  // Save Response - auto-advance to next phase
  saveResponseBtn?.addEventListener('click', async () => {
    const output = responseTextarea?.value?.trim() || '';
    if (output.length < 10) {
      showToast('Please enter at least 10 characters', 'warning');
      return;
    }

    await savePhaseOutput(project.id, workflow.currentPhase, output);
    workflow.savePhaseOutput(output);

    // Auto-advance to next phase if not on final phase
    if (workflow.currentPhase < WORKFLOW_CONFIG.phaseCount) {
      workflow.advancePhase();
      project.phase = workflow.currentPhase;
      showToast('Response saved! Moving to next phase...', 'success');
      updatePhaseTabStyles(workflow.currentPhase);
      document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
      setupPhaseContentListeners(project, workflow);
    } else {
      // Final phase - mark complete and show export
      showToast('PR-FAQ Complete! You can now export your document.', 'success');
      renderProjectView(project.id);
    }
  });

  // Edit Details button (Phase 1 only, before response saved)
  document.getElementById('edit-details-btn')?.addEventListener('click', () => {
    navigateTo('edit/' + project.id);
  });

  // Previous Phase
  document.getElementById('prev-phase-btn')?.addEventListener('click', async () => {
    workflow.previousPhase();
    project.phase = workflow.currentPhase;
    updatePhaseTabStyles(workflow.currentPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
    setupPhaseContentListeners(project, workflow);
  });

  // Next Phase
  document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
    workflow.advancePhase();
    project.phase = workflow.currentPhase;
    showToast('Moving to next phase...', 'success');
    updatePhaseTabStyles(workflow.currentPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
    setupPhaseContentListeners(project, workflow);
  });

  // Delete project button
  document.getElementById('delete-project-btn')?.addEventListener('click', async () => {
    if (await confirm(`Are you sure you want to delete "${project.title}"?`, 'Delete Project')) {
      await deleteProject(project.id);
      showToast('Project deleted', 'success');
      navigateTo('home');
    }
  });
}

