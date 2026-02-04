/**
 * Project View Module
 * @module project-view
 * Handles rendering the project workflow view with phase tabs
 * @module project-view
 */

import { getProject, deleteProject, updatePhase, updateProject, getExportFilename, getFinalMarkdown } from './projects.js';
import { escapeHtml, showToast, copyToClipboard, copyToClipboardAsync, showPromptModal, confirm, showDocumentPreviewModal, createActionMenu } from './ui.js';
import { navigateTo } from './router.js';
import { Workflow, WORKFLOW_CONFIG, getPhaseMetadata } from './workflow.js';
import { preloadPromptTemplates } from './prompts.js';
import { computeWordDiff, renderDiffHtml, getDiffStats } from './diff-view.js';

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
                    <button id="compare-phases-btn" class="px-4 py-2 border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium">
                        🔄 Compare Phases
                    </button>
                    <a href="https://bordenet.github.io/pr-faq-assistant/validator/" target="_blank" rel="noopener noreferrer" class="px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
                        Full Validation ↗
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
            <div class="mb-6 flex justify-between items-start">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        ${phase.icon} ${phase.name}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-2">${phase.description}</p>
                    <div class="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                        <span class="mr-2">🤖</span>
                        Use with ${aiName}
                    </div>
                </div>
                <!-- Overflow Menu (top-right) -->
                <button id="more-actions-btn" class="action-menu-trigger text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                </button>
            </div>

            <!-- Step A: Copy Prompt to AI -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step A: Copy Prompt to AI
                </h4>
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
                    ${hasExistingOutput && workflow.currentPhase < WORKFLOW_CONFIG.phaseCount ? `
                        <button id="next-phase-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Next Phase →
                        </button>
                    ` : `
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            Paste response to complete this phase
                        </span>
                    `}
                    <button id="save-response-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${!hasExistingOutput || hasExistingOutput.trim().length < 10 ? 'disabled' : ''}>
                        Save Response
                    </button>
                </div>
            </div>
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

  // Compare phases button handler (shows diff with phase selectors)
  const comparePhasesBtn = document.getElementById('compare-phases-btn');
  if (comparePhasesBtn) {
    comparePhasesBtn.addEventListener('click', () => {
      const phases = {
        1: workflow.getPhaseOutput(1),
        2: workflow.getPhaseOutput(2),
        3: workflow.getPhaseOutput(3)
      };

      // Need at least 2 phases completed
      const completedPhases = Object.entries(phases).filter(([, v]) => v).map(([k]) => parseInt(k));
      if (completedPhases.length < 2) {
        showToast('At least 2 phases must be completed to compare', 'warning');
        return;
      }

      showDiffModal(phases, completedPhases);
    });
  }

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

    // Enable the response textarea
    if (responseTextarea) {
      responseTextarea.disabled = false;
      responseTextarea.focus();
    }
  };

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

  // Save Response - auto-advance to next phase (canonical pattern matching one-pager)
  // Use workflow.currentPhase (captured at render time) to prevent double-click issues
  const currentPhaseNumber = workflow.currentPhase;

  saveResponseBtn?.addEventListener('click', async () => {
    const response = responseTextarea?.value?.trim() || '';
    if (response.length < 10) {
      showToast('Please enter at least 10 characters', 'warning');
      return;
    }

    // Disable button immediately to prevent double-clicks
    if (saveResponseBtn) {
      saveResponseBtn.disabled = true;
      saveResponseBtn.textContent = 'Saving...';
    }

    try {
      // Re-fetch project to get fresh data for the prompt (not stale closure)
      const freshProject = await getProject(project.id);
      const currentPrompt = freshProject.phases?.[currentPhaseNumber]?.prompt || '';

      // Use canonical updatePhase - handles both saving AND auto-advance
      await updatePhase(project.id, currentPhaseNumber, currentPrompt, response);

      // Auto-advance to next phase if not on final phase
      if (currentPhaseNumber < WORKFLOW_CONFIG.phaseCount) {
        showToast('Response saved! Moving to next phase...', 'success');
        // Re-fetch the updated project (updatePhase already advanced the phase)
        const updatedProject = await getProject(project.id);
        const nextPhase = currentPhaseNumber + 1;

        const nextWorkflow = new Workflow(updatedProject);
        nextWorkflow.currentPhase = nextPhase;

        updatePhaseTabStyles(nextPhase);
        document.getElementById('phase-content').innerHTML = renderPhaseContent(nextWorkflow);
        setupPhaseContentListeners(updatedProject, nextWorkflow);
      } else {
        // Phase 3 complete - set phase to 4 (complete state)
        await updateProject(project.id, { phase: 4 });
        showToast('PR-FAQ Complete! You can now export your document.', 'success');
        renderProjectView(project.id);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      showToast(`Failed to save response: ${error.message}`, 'error');
      // Re-enable button on error
      if (saveResponseBtn) {
        saveResponseBtn.disabled = false;
        saveResponseBtn.textContent = 'Save Response';
      }
    }
  });

  // Next Phase - save phase to storage and re-render
  document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
    const nextPhase = workflow.currentPhase + 1;

    // Save the phase to storage
    await updateProject(project.id, { phase: nextPhase });

    // Re-fetch project from storage to get fresh data
    const freshProject = await getProject(project.id);
    const freshWorkflow = new Workflow(freshProject);
    freshWorkflow.currentPhase = nextPhase;

    showToast('Moving to next phase...', 'success');
    updatePhaseTabStyles(nextPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
    setupPhaseContentListeners(freshProject, freshWorkflow);
  });

  // Setup overflow "More" menu with secondary actions
  const moreActionsBtn = document.getElementById('more-actions-btn');
  if (moreActionsBtn) {
    const phaseData = project.phases?.[workflow.currentPhase] || {};
    const hasPrompt = !!phaseData.prompt;

    // Build menu items based on current state
    const menuItems = [];

    // View Prompt (only if prompt exists)
    if (hasPrompt) {
      menuItems.push({
        label: 'View Prompt',
        icon: '👁️',
        onClick: async () => {
          const prompt = await workflow.generatePrompt();
          showPromptModal(prompt, `Phase ${workflow.currentPhase}: ${phase.name} Prompt`, enableWorkflowProgression);
        }
      });
    }

    // Edit Details (always available)
    menuItems.push({
      label: 'Edit Details',
      icon: '✏️',
      onClick: () => navigateTo('edit/' + project.id)
    });

    // Compare Phases (only if 2+ phases completed)
    const completedCount = [1, 2, 3].filter(p => workflow.getPhaseOutput(p)).length;
    if (completedCount >= 2) {
      menuItems.push({
        label: 'Compare Phases',
        icon: '🔄',
        onClick: () => {
          const phases = {
            1: workflow.getPhaseOutput(1),
            2: workflow.getPhaseOutput(2),
            3: workflow.getPhaseOutput(3)
          };
          const completedPhases = Object.entries(phases).filter(([, v]) => v).map(([k]) => parseInt(k));
          showDiffModal(phases, completedPhases);
        }
      });
    }

    // Separator before destructive action
    menuItems.push({ separator: true });

    // Delete (destructive)
    menuItems.push({
      label: 'Delete...',
      icon: '🗑️',
      destructive: true,
      onClick: async () => {
        if (await confirm(`Are you sure you want to delete "${project.title}"?`, 'Delete Project')) {
          await deleteProject(project.id);
          showToast('Project deleted', 'success');
          navigateTo('home');
        }
      }
    });

    createActionMenu({
      triggerElement: moreActionsBtn,
      items: menuItems,
      position: 'bottom-end'
    });
  }
}

/**
 * Show diff modal with phase selectors
 * @param {Object} phases - Object with phase outputs {1: string, 2: string, 3: string}
 * @param {number[]} completedPhases - Array of completed phase numbers
 */
function showDiffModal(phases, completedPhases) {
  // Build phase names dynamically from WORKFLOW_CONFIG
  const phaseNames = {};
  completedPhases.forEach(p => {
    const meta = getPhaseMetadata(p);
    phaseNames[p] = `Phase ${p}: ${meta.name} (${meta.aiModel})`;
  });

  // Default to comparing first two completed phases
  let leftPhase = completedPhases[0];
  let rightPhase = completedPhases[1];

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

  function renderDiff() {
    const leftOutput = phases[leftPhase] || '';
    const rightOutput = phases[rightPhase] || '';
    const diff = computeWordDiff(leftOutput, rightOutput);
    const stats = getDiffStats(diff);
    const diffHtml = renderDiffHtml(diff);

    const optionsHtml = completedPhases.map(p =>
      `<option value="${p}">${phaseNames[p]}</option>`
    ).join('');

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">
              🔄 Phase Comparison
            </h3>
            <div class="flex items-center gap-2 flex-wrap">
              <select id="diff-left-phase" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                ${optionsHtml}
              </select>
              <span class="text-gray-500 dark:text-gray-400 font-medium">→</span>
              <select id="diff-right-phase" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                ${optionsHtml}
              </select>
              <div class="flex gap-2 ml-4 text-sm">
                <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  +${stats.additions} added
                </span>
                <span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                  -${stats.deletions} removed
                </span>
                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  ${stats.unchanged} unchanged
                </span>
              </div>
            </div>
          </div>
          <button id="close-diff-modal-btn" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto flex-1">
          <div id="diff-content" class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
            ${diffHtml}
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="bg-green-200 dark:bg-green-900/50 px-1">Green text</span> = added in right phase &nbsp;|&nbsp;
            <span class="bg-red-200 dark:bg-red-900/50 px-1 line-through">Red strikethrough</span> = removed from left phase
          </p>
        </div>
      </div>
    `;

    // Set selected values
    modal.querySelector('#diff-left-phase').value = leftPhase;
    modal.querySelector('#diff-right-phase').value = rightPhase;

    // Add change handlers
    modal.querySelector('#diff-left-phase').addEventListener('change', (e) => {
      leftPhase = parseInt(e.target.value);
      renderDiff();
    });
    modal.querySelector('#diff-right-phase').addEventListener('change', (e) => {
      rightPhase = parseInt(e.target.value);
      renderDiff();
    });

    // Close handlers
    modal.querySelector('#close-diff-modal-btn').addEventListener('click', closeModal);
  }

  const closeModal = () => modal.remove();

  document.body.appendChild(modal);
  renderDiff();

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
