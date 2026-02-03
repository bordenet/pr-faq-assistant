/**
 * Project View Module
 * @module project-view
 * Handles rendering the project workflow view with phase tabs
 * @module project-view
 */

import { getProject, deleteProject, savePhaseOutput, advancePhase as advanceProjectPhase, getExportFilename, getFinalMarkdown } from './projects.js';
import { escapeHtml, showToast, copyToClipboardAsync, showPromptModal, confirm, showDocumentPreviewModal } from './ui.js';
import { navigateTo } from './router.js';
import { Workflow, WORKFLOW_CONFIG } from './workflow.js';
import { preloadPromptTemplates } from './prompts.js';

/**
 * Render the project detail view
 * @module project-view
 */
export async function renderProjectView(projectId) {
  // Preload prompt templates to avoid network delay on first clipboard operation
  // Fire-and-forget: don't await, let it run in parallel with project load
  preloadPromptTemplates().catch(() => {});

  const project = await getProject(projectId);

  if (!project) {
    showToast('Project not found', 'error');
    navigateTo('home');
    return;
  }

  const workflow = new Workflow(project);
  const container = document.getElementById('app-container');
  const isFullyComplete = workflow.isComplete();

  container.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <button id="back-home" class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to PR-FAQs
            </button>
            ${isFullyComplete ? `
                <button id="export-final-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    📄 Preview & Copy
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
 * @module project-view
 */
function renderPhaseContent(workflow) {
  const phase = workflow.getCurrentPhase();
  if (!phase) {
    console.error('Phase not found for currentPhase:', workflow.currentPhase, 'project.phase:', workflow.project.phase);
    return '<div class="p-4 text-red-600">Error: Invalid phase configuration. Please refresh or create a new project.</div>';
  }
  // Use phases object structure (canonical) with fallback to legacy phase${n}_output fields
  const phaseData = workflow.project.phases?.[workflow.currentPhase] || { prompt: '', response: '', completed: false };
  const hasExistingOutput = phaseData.response || workflow.getPhaseOutput(workflow.currentPhase);
  const aiUrl = phase.aiModel === 'Gemini' ? 'https://gemini.google.com' : 'https://claude.ai';
  const aiName = phase.aiModel;
  const isFullyComplete = workflow.isComplete();

  // Completion banner shown above Phase 3 content when workflow is complete
  const completionBanner = isFullyComplete ? `
        <div class="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-green-800 dark:text-green-300 flex items-center">
                        <span class="mr-2">🎉</span> Your PR-FAQ is Complete!
                    </h4>
                    <p class="text-green-700 dark:text-green-400 mt-1">
                        <strong>Next steps:</strong> Preview & copy, then validate your document.
                    </p>
                </div>
                <div class="flex gap-3 flex-wrap items-center">
                    <button id="export-complete-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg">
                        📄 Preview & Copy
                    </button>
                    <span class="text-gray-500 dark:text-gray-400">then</span>
                    <a href="https://bordenet.github.io/pr-faq-assistant/validator/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-medium text-lg">
                        Validate & Score ↗
                    </a>
                </div>
            </div>
            <!-- Expandable Help Section -->
            <details class="mt-4">
                <summary class="text-sm text-green-700 dark:text-green-400 cursor-pointer hover:text-green-800 dark:hover:text-green-300">
                    Need help using your document?
                </summary>
                <div class="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    <ol class="list-decimal list-inside space-y-2">
                        <li>Click <strong>"Preview & Copy"</strong> to see your formatted document</li>
                        <li>Click <strong>"Copy Formatted Text"</strong> in the preview</li>
                        <li>Open <strong>Microsoft Word</strong> or <strong>Google Docs</strong> and paste</li>
                        <li>Use <strong><a href="https://bordenet.github.io/pr-faq-assistant/validator/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ Validator</a></strong> to score and improve your document</li>
                    </ol>
                    <p class="mt-3 text-gray-500 dark:text-gray-400 text-xs">
                        💡 The validator provides instant feedback and AI-powered suggestions for improvement.
                    </p>
                </div>
            </details>
        </div>
  ` : '';

  return `
        ${completionBanner}

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
                            📋 ${hasExistingOutput ? 'Copy Prompt Again' : 'Generate & Copy Prompt'}
                        </button>
                        <a id="open-ai-btn" href="${aiUrl}" target="ai-assistant-tab" rel="noopener noreferrer"
                            class="px-6 py-3 bg-green-600 text-white rounded-lg transition-colors font-medium ${hasExistingOutput ? 'hover:bg-green-700' : 'opacity-50 cursor-not-allowed pointer-events-none'}"
                            ${hasExistingOutput ? '' : 'aria-disabled="true"'}>
                            🔗 Open ${aiName}
                        </a>
                    </div>
                    <button id="view-prompt-btn" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium ${hasExistingOutput ? '' : 'hidden'}">
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
                    ${!hasExistingOutput ? 'disabled' : ''}
                >${escapeHtml(hasExistingOutput || '')}</textarea>

                <div class="mt-3 flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        ${hasExistingOutput ? '✓ Phase completed' : 'Paste response to complete this phase'}
                    </span>
                    <button id="save-response-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${!hasExistingOutput || hasExistingOutput.trim().length < 10 ? 'disabled' : ''}>
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
 * @module project-view
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
 * @module project-view
 */
function setupProjectViewListeners(project, workflow) {
  document.getElementById('back-home')?.addEventListener('click', () => navigateTo('home'));

  // Phase tabs - switch between phases (re-fetch project to ensure fresh data)
  document.querySelectorAll('.phase-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const targetPhase = parseInt(tab.dataset.phase);

      // Re-fetch project from storage to get fresh data
      const freshProject = await getProject(project.id);

      // Guard: Can only navigate to a phase if all prior phases are complete
      // Phase 1 is always accessible
      if (targetPhase > 1) {
        const priorPhase = targetPhase - 1;
        const priorPhaseComplete = freshProject.phases?.[priorPhase]?.completed;
        if (!priorPhaseComplete) {
          showToast(`Complete Phase ${priorPhase} before proceeding to Phase ${targetPhase}`, 'warning');
          return;
        }
      }

      freshProject.phase = targetPhase;
      const freshWorkflow = new Workflow(freshProject);
      freshWorkflow.currentPhase = targetPhase;

      updatePhaseTabStyles(targetPhase);
      document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
      setupPhaseContentListeners(freshProject, freshWorkflow);
    });
  });

  // Export final PR-FAQ button (header - Preview & Copy)
  document.getElementById('export-final-btn')?.addEventListener('click', () => {
    const markdown = getFinalMarkdown(project, workflow);
    if (markdown) {
      showDocumentPreviewModal(markdown, 'Your PR-FAQ is Ready', getExportFilename(project));
    } else {
      showToast('No PR-FAQ content to export', 'warning');
    }
  });

  setupPhaseContentListeners(project, workflow);
}

/**
 * Update phase tab visual styles
 * @module project-view
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
 * @module project-view
 */
function setupPhaseContentListeners(project, workflow) {
  const responseTextarea = document.getElementById('phase-output');
  const saveResponseBtn = document.getElementById('save-response-btn');
  const phase = workflow.getCurrentPhase();

  // Export complete button (Phase 3 completion CTA - Preview & Copy)
  document.getElementById('export-complete-btn')?.addEventListener('click', () => {
    const markdown = getFinalMarkdown(project, workflow);
    if (markdown) {
      showDocumentPreviewModal(markdown, 'Your PR-FAQ is Ready', getExportFilename(project));
    } else {
      showToast('No PR-FAQ content to export', 'warning');
    }
  });

  /**
   * Enable workflow progression after prompt is copied
   * Called from both main copy button and modal copy button
   */
  const enableWorkflowProgression = () => {
    // Enable the "Open AI" button
    const openAiBtn = document.getElementById('open-ai-btn');
    if (openAiBtn) {
      openAiBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
      openAiBtn.classList.add('hover:bg-green-700');
      openAiBtn.removeAttribute('aria-disabled');
    }

    // Show and enable the View Prompt button now that prompt is generated
    const viewPromptBtn = document.getElementById('view-prompt-btn');
    if (viewPromptBtn) {
      viewPromptBtn.classList.remove('hidden', 'opacity-50', 'cursor-not-allowed');
      viewPromptBtn.disabled = false;
    }

    // Enable the response textarea
    if (responseTextarea) {
      responseTextarea.disabled = false;
      responseTextarea.focus();
    }
  };

  // View Prompt button - shows modal with copy callback for workflow progression
  document.getElementById('view-prompt-btn')?.addEventListener('click', async () => {
    const prompt = await workflow.generatePrompt();
    showPromptModal(prompt, `Phase ${workflow.currentPhase}: ${phase.name} Prompt`, enableWorkflowProgression);
  });

  // Copy Prompt - enables the Open AI button and textarea
  // CRITICAL: Safari transient activation fix - call copyToClipboardAsync synchronously
  document.getElementById('copy-prompt-btn')?.addEventListener('click', () => {
    const promptPromise = workflow.generatePrompt();

    copyToClipboardAsync(promptPromise)
      .then(() => {
        showToast('Prompt copied to clipboard!', 'success');
        enableWorkflowProgression();
      })
      .catch(() => {
        showToast('Failed to copy to clipboard', 'error');
      });
  });

  // Update save button state as user types
  if (responseTextarea) {
    responseTextarea.addEventListener('input', () => {
      const hasEnoughContent = responseTextarea.value.trim().length >= 10;
      if (saveResponseBtn) {
        saveResponseBtn.disabled = !hasEnoughContent;
      }
    });
  }

  // Save Response - auto-advance to next phase
  saveResponseBtn?.addEventListener('click', async () => {
    const output = responseTextarea?.value?.trim() || '';
    if (output.length < 10) {
      showToast('Please enter at least 10 characters', 'warning');
      return;
    }

    try {
      // Re-fetch project to get fresh data (avoid stale closure)
      const freshProjectBefore = await getProject(project.id);
      const currentPhase = freshProjectBefore.phase || 1;

      await savePhaseOutput(project.id, currentPhase, output);

      // Always advance phase (including from phase 3 to 4 for completion)
      await advanceProjectPhase(project.id);

      // Re-fetch project from storage to get fresh data with updated phases
      const freshProject = await getProject(project.id);
      const freshWorkflow = new Workflow(freshProject);

      if (freshWorkflow.isComplete()) {
        // Final phase complete - show export view
        showToast('PR-FAQ Complete! You can now export your document.', 'success');
        renderProjectView(project.id);
      } else {
        // Move to next phase - freshProject.phase was already advanced by advanceProjectPhase
        showToast('Response saved! Moving to next phase...', 'success');
        updatePhaseTabStyles(freshWorkflow.currentPhase);
        document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
        setupPhaseContentListeners(freshProject, freshWorkflow);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      showToast(`Failed to save response: ${error.message}`, 'error');
    }
  });

  // Edit Details button (Phase 1 only, before response saved)
  document.getElementById('edit-details-btn')?.addEventListener('click', () => {
    navigateTo('edit/' + project.id);
  });

  // Previous Phase - re-fetch project to ensure fresh data
  document.getElementById('prev-phase-btn')?.addEventListener('click', async () => {
    const prevPhase = workflow.currentPhase - 1;
    if (prevPhase < 1) return;

    // Re-fetch project from storage to get fresh data
    const freshProject = await getProject(project.id);
    freshProject.phase = prevPhase;
    const freshWorkflow = new Workflow(freshProject);
    freshWorkflow.currentPhase = prevPhase;

    updatePhaseTabStyles(prevPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
    setupPhaseContentListeners(freshProject, freshWorkflow);
  });

  // Next Phase - re-fetch project to ensure fresh data
  document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
    const nextPhase = workflow.currentPhase + 1;
    // Re-fetch project from storage to get fresh data
    const freshProject = await getProject(project.id);
    freshProject.phase = nextPhase;
    const freshWorkflow = new Workflow(freshProject);
    freshWorkflow.currentPhase = nextPhase;

    showToast('Moving to next phase...', 'success');
    updatePhaseTabStyles(nextPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
    setupPhaseContentListeners(freshProject, freshWorkflow);
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
