/**
 * Project View Phase Content Module
 * Handles rendering individual phase content for PR-FAQ workflow
 * @module project-view-phase
 */

import { escapeHtml } from './ui.js';
import { validateDocument, getScoreColor, getScoreLabel } from '../../validator/js/validator.js';

/**
 * Render the content for a specific phase
 * @param {import('./types.js').Workflow} workflow - Workflow instance
 * @returns {string} HTML string
 */
export function renderPhaseContent(workflow) {
  const phase = workflow.getCurrentPhase();
  if (!phase) {
    console.error('Phase not found for currentPhase:', workflow.currentPhase, 'project.phase:', workflow.project.phase);
    return '<div class="p-4 text-red-600">Error: Invalid phase configuration. Please refresh or create a new project.</div>';
  }

  const phaseData = workflow.project.phases?.[workflow.currentPhase] || { prompt: '', response: '', completed: false };
  const hasExistingOutput = phaseData.response || workflow.getPhaseOutput(workflow.currentPhase);
  const aiUrl = phase.aiModel === 'Gemini' ? 'https://gemini.google.com' : 'https://claude.ai';
  const aiName = phase.aiModel;
  const isFullyComplete = workflow.isComplete();

  // Completion banner shown above Phase 3 content when workflow is complete
  let completionBanner = '';
  if (isFullyComplete) {
    const prfaqContent = phaseData?.response || '';
    completionBanner = renderCompletionBanner(prfaqContent);
  }

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
            <div>
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step B: Paste ${aiName}'s Response
                </h4>
                <textarea id="phase-output" rows="12"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    placeholder="Paste ${aiName}'s response here..."
                    ${!hasExistingOutput ? 'disabled' : ''}
                >${escapeHtml(hasExistingOutput || '')}</textarea>

                <div class="mt-3 flex justify-between items-center">
                    ${hasExistingOutput && workflow.currentPhase < 3 ? `
                        <button id="next-phase-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Next Phase →
                        </button>
                    ` : workflow.currentPhase < 3 ? `
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            Paste response to complete this phase
                        </span>
                    ` : '<span></span>'}
                    <button id="save-response-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${!hasExistingOutput || hasExistingOutput.trim().length < 10 ? 'disabled' : ''}>
                        Save Response
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render completion banner with inline score
 * @param {string} content - The document content
 * @returns {string} HTML string
 */
function renderCompletionBanner(content) {
  const validationResult = validateDocument(content);
  const scoreColor = getScoreColor(validationResult.totalScore);
  const scoreLabel = getScoreLabel(validationResult.totalScore);

  // Collect all issues for display (PR-FAQ validator fields)
  const allIssues = [
    ...validationResult.structure.issues,
    ...validationResult.content.issues,
    ...validationResult.professional.issues,
    ...validationResult.evidence.issues
  ];

  return `
        <div class="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-green-800 dark:text-green-300 flex items-center">
                        <span class="mr-2">🎉</span> Your Press Release Document is Complete!
                    </h4>
                    <p class="text-green-700 dark:text-green-400 mt-1">
                        <strong>Next steps:</strong> Preview & copy, then validate your document.
                    </p>
                </div>
                <div class="flex gap-3 flex-wrap items-center">
                    <button id="export-complete-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg">
                        📄 Preview & Copy
                    </button>
                    <a href="./validator/" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg">
                        📋 Full Validation ↗
                    </a>
                </div>
            </div>

            ${renderInlineScore(validationResult, scoreColor, scoreLabel)}

            ${allIssues.length > 0 && validationResult.totalScore < 70 ? renderIssuesSummary(allIssues) : ''}

            ${renderHelpSection()}
        </div>
    `;
}

/**
 * Render inline score breakdown
 */
function renderInlineScore(validationResult, scoreColor, scoreLabel) {
  return `
            <!-- Inline Quality Score -->
            <div class="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-semibold text-gray-900 dark:text-white flex items-center">
                        📊 Document Quality Rating
                    </h5>
                    <div class="flex items-center gap-2">
                        <span class="text-3xl font-bold text-${scoreColor}-600 dark:text-${scoreColor}-400">${validationResult.totalScore}</span>
                        <span class="text-gray-500 dark:text-gray-400">/100</span>
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-${scoreColor}-100 dark:bg-${scoreColor}-900/30 text-${scoreColor}-700 dark:text-${scoreColor}-300">${scoreLabel}</span>
                    </div>
                </div>

                <!-- Score Breakdown -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div class="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                        <div class="text-gray-500 dark:text-gray-400 text-xs">Structure</div>
                        <div class="font-semibold text-gray-900 dark:text-white">${validationResult.structure.score}/${validationResult.structure.maxScore}</div>
                    </div>
                    <div class="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                        <div class="text-gray-500 dark:text-gray-400 text-xs">Content</div>
                        <div class="font-semibold text-gray-900 dark:text-white">${validationResult.content.score}/${validationResult.content.maxScore}</div>
                    </div>
                    <div class="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                        <div class="text-gray-500 dark:text-gray-400 text-xs">Professional</div>
                        <div class="font-semibold text-gray-900 dark:text-white">${validationResult.professional.score}/${validationResult.professional.maxScore}</div>
                    </div>
                    <div class="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                        <div class="text-gray-500 dark:text-gray-400 text-xs">Evidence</div>
                        <div class="font-semibold text-gray-900 dark:text-white">${validationResult.evidence.score}/${validationResult.evidence.maxScore}</div>
                    </div>
                </div>
            </div>
    `;
}

/**
 * Render issues summary section
 */
function renderIssuesSummary(allIssues) {
  return `
                <!-- Improvement Suggestions -->
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <details>
                        <summary class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                            💡 ${allIssues.length} suggestion${allIssues.length > 1 ? 's' : ''} to improve your score
                        </summary>
                        <ul class="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                            ${allIssues.slice(0, 5).map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
                            ${allIssues.length > 5 ? `<li class="text-gray-400 dark:text-gray-500">...and ${allIssues.length - 5} more</li>` : ''}
                        </ul>
                    </details>
                </div>
    `;
}

/**
 * Render help section
 */
function renderHelpSection() {
  return `
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
                        <li>Use <strong><a href="./validator/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ Validator</a></strong> to score and improve your document</li>
                    </ol>
                    <p class="mt-3 text-gray-500 dark:text-gray-400 text-xs">
                        💡 The validator provides instant feedback and AI-powered suggestions for improvement.
                    </p>
                </div>
            </details>
    `;
}

