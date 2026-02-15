/**
 * Project View Events Module
 * Handles event listeners for phase interactions in PR-FAQ workflow
 * @module project-view-events
 */

import { getProject, deleteProject, updatePhase, updateProject } from './projects.js';
import { escapeHtml, showToast, copyToClipboard, copyToClipboardAsync, showPromptModal, confirm, confirmWithRemember, showDocumentPreviewModal, createActionMenu } from './ui.js';
import { navigateTo } from './router.js';
import { Workflow, WORKFLOW_CONFIG, getPhaseMetadata, detectPromptPaste } from './workflow.js';
import { renderPhaseContent } from './project-view-phase.js';
import { computeWordDiff, renderDiffHtml, getDiffStats } from './diff-view.js';
import { getFinalMarkdown, getExportFilename } from './projects.js';

// Injected helpers to avoid circular imports
let extractTitleFromMarkdownFn = null;
let updatePhaseTabStylesFn = null;
let renderProjectViewFn = null;

/**
 * Set helper functions from main module (avoids circular imports)
 */
export function setHelpers(helpers) {
  extractTitleFromMarkdownFn = helpers.extractTitleFromMarkdown;
  updatePhaseTabStylesFn = helpers.updatePhaseTabStyles;
  renderProjectViewFn = helpers.renderProjectView;
}

/**
 * Attach event listeners for phase interactions
 * @param {import('./types.js').Project} project - Project data
 * @param {import('./types.js').Workflow} workflow - Workflow instance
 * @returns {void}
 */
export function attachPhaseEventListeners(project, workflow) {
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
  document.getElementById('copy-prompt-btn')?.addEventListener('click', async () => {
    // Check if warning was previously acknowledged
    const warningAcknowledged = localStorage.getItem('external-ai-warning-acknowledged');

    if (!warningAcknowledged) {
      const result = await confirmWithRemember(
        'You are about to copy a prompt that may contain proprietary data.\n\n' +
                '• This prompt will be pasted into an external AI service (Claude/Gemini)\n' +
                '• Data sent to these services is processed on third-party servers\n' +
                '• For sensitive documents, use an internal tool like LibreGPT instead\n\n' +
                'Do you want to continue?',
        'External AI Warning',
        { confirmText: 'Copy Prompt', cancelText: 'Cancel' }
      );

      if (!result.confirmed) {
        showToast('Copy cancelled', 'info');
        return;
      }

      // Remember the choice permanently if checkbox was checked
      if (result.remember) {
        localStorage.setItem('external-ai-warning-acknowledged', 'true');
      }
    }

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

    // Check if user accidentally pasted the prompt instead of the AI response
    const promptCheck = detectPromptPaste(response);
    if (promptCheck.isPrompt) {
      showToast(promptCheck.reason, 'error');
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

        updatePhaseTabStylesFn(nextPhase);
        document.getElementById('phase-content').innerHTML = renderPhaseContent(nextWorkflow);
        attachPhaseEventListeners(updatedProject, nextWorkflow);
      } else {
        // Phase 3 complete - set phase to 4 (complete state)
        await updateProject(project.id, { phase: 4 });
        showToast('PR-FAQ Complete! You can now export your document.', 'success');
        renderProjectViewFn(project.id);
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
    updatePhaseTabStylesFn(nextPhase);
    document.getElementById('phase-content').innerHTML = renderPhaseContent(freshWorkflow);
    attachPhaseEventListeners(freshProject, freshWorkflow);
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
export function showDiffModal(phases, completedPhases) {
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

