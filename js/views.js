/**
 * Views Module
 * @module views
 * Handles rendering different views/screens
 * @module views
 */

import { getAllProjects, createProject, deleteProject, getExportFilename, getFinalMarkdown } from './projects.js';
import { formatDate, escapeHtml, confirm, showToast, showDocumentPreviewModal } from './ui.js';
import { navigateTo } from './router.js';
import { WORKFLOW_CONFIG, Workflow } from './workflow.js';

const PRFAQ_DOCS_URL = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';

/**
 * Render the projects list view (home)
 * @module views
 */
export async function renderProjectsList() {
  const projects = await getAllProjects();
  const container = document.getElementById('app-container');

  container.innerHTML = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Your <a href="${PRFAQ_DOCS_URL}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a> Projects</h2>
            <button id="new-project-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + New PR-FAQ
            </button>
        </div>
        ${projects.length === 0 ? renderEmptyState() : renderProjectCards(projects)}
    `;

  // Event listeners
  document.getElementById('new-project-btn')?.addEventListener('click', () => navigateTo('new'));
  document.getElementById('empty-state-new-btn')?.addEventListener('click', () => navigateTo('new'));

  // Project card clicks
  container.querySelectorAll('[data-project-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn') && !e.target.closest('.preview-btn')) {
        navigateTo('project/' + card.dataset.projectId);
      }
    });
  });

  // Preview buttons (for completed projects)
  container.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const projectId = btn.dataset.projectId;
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const workflow = new Workflow(project);
        const markdown = getFinalMarkdown(project, workflow);
        if (markdown) {
          showDocumentPreviewModal(markdown, 'Your PR-FAQ is Ready', getExportFilename(project));
        } else {
          showToast('No content to preview', 'warning');
        }
      }
    });
  });

  // Delete buttons
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const projectId = btn.dataset.projectId;
      const project = projects.find(p => p.id === projectId);
      if (await confirm(`Are you sure you want to delete "${project?.title}"?`, 'Delete Project')) {
        await deleteProject(projectId);
        showToast('Project deleted', 'success');
        renderProjectsList();
      }
    });
  });
}

/**
 * Render empty state
 * @module views
 */
function renderEmptyState() {
  return `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div class="text-6xl mb-4">📰</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No PR-FAQs yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Create your first <a href="${PRFAQ_DOCS_URL}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ Document</a></p>
            <button id="empty-state-new-btn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                + Create Your First PR-FAQ
            </button>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-6">Documents are optimized for <a href="https://github.com/bordenet/pr-faq-validator" target="_blank" rel="noopener" class="text-blue-500 dark:text-blue-400 hover:underline">pr-faq-validator</a> (70+ score target)</p>
        </div>
    `;
}

/**
 * Render project cards grid
 * @module views
 */
function renderProjectCards(projects) {
  return `
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${projects.map(p => {
    const isComplete = p.phase > WORKFLOW_CONFIG.phaseCount;
    const progress = ((p.phase || 1) / WORKFLOW_CONFIG.phaseCount) * 100;
    return `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer" data-project-id="${p.id}">
                    <div class="p-5">
                        <div class="flex items-start justify-between mb-3">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">${escapeHtml(p.title)}</h3>
                            <div class="flex items-center space-x-2 ml-2">
                                ${isComplete ? `
                                <button class="preview-btn text-gray-400 hover:text-blue-600 transition-colors" data-project-id="${p.id}" title="Preview & Copy">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </button>
                                ` : ''}
                                <button class="delete-btn text-gray-400 hover:text-red-600 transition-colors" data-project-id="${p.id}" title="Delete">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="flex items-center space-x-2 mb-1">
                                ${isComplete ? `
                                    <span class="text-sm font-medium text-green-600 dark:text-green-400">✓ Complete</span>
                                ` : `
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Phase ${p.phase || 1}/${WORKFLOW_CONFIG.phaseCount}</span>
                                `}
                                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : ''}" style="width: ${isComplete ? 100 : progress}%"></div>
                                </div>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">${escapeHtml(p.formData?.problem || '')}</p>
                        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Updated ${formatDate(p.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            `;
  }).join('')}
        </div>
    `;
}

/**
 * Render new project form
 * @module views
 */
export function renderNewProjectForm() {
  const container = document.getElementById('app-container');

  container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Create New <a href="${PRFAQ_DOCS_URL}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a></h2>
            <form id="new-project-form" class="space-y-4">
                ${renderFormFields()}
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex gap-3">
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Create</button>
                        <button type="button" id="cancel-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                    <button type="button" class="px-4 py-2 bg-red-400 text-white rounded-lg cursor-not-allowed opacity-50" disabled title="Nothing to delete yet">Delete</button>
                </div>
            </form>
        </div>
    `;

  document.getElementById('new-project-form')?.addEventListener('submit', handleNewProject);
  document.getElementById('cancel-btn')?.addEventListener('click', () => navigateTo('home'));
}

/**
 * Render edit project form
 * @module views
 */
export function renderEditProjectForm(project) {
  const container = document.getElementById('app-container');
  const data = project.formData || {};

  container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit <a href="${PRFAQ_DOCS_URL}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a> Details</h2>
            <div class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-300">
                    💡 Update your project details below. Changes will be saved when you continue to Phase 1.
                </p>
            </div>
            <form id="edit-project-form" class="space-y-4">
                ${renderFormFields(data)}
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Next Phase →
                    </button>
                    <button type="button" id="delete-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                </div>
            </form>
        </div>
    `;

  document.getElementById('edit-project-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formObj = Object.fromEntries(formData);
    const { updateProject } = await import('./projects.js');

    await updateProject(project.id, {
      title: formObj.productName,
      formData: formObj
    });

    showToast('Changes saved!', 'success');
    navigateTo('project/' + project.id);
  });

  document.getElementById('delete-btn')?.addEventListener('click', async () => {
    if (await confirm(`Are you sure you want to delete "${project.title}"?`, 'Delete Project')) {
      await deleteProject(project.id);
      showToast('Project deleted', 'success');
      navigateTo('home');
    }
  });
}

/**
 * Render form fields (shared by new and edit forms)
 * @module views
 */
function renderFormFields(data = {}) {
  return `
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product/Feature Name <span class="text-red-500">*</span></label>
            <input type="text" name="productName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., DataSync Pro" value="${escapeHtml(data.productName || '')}">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name <span class="text-red-500">*</span></label>
            <input type="text" name="companyName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., AcmeCorp" value="${escapeHtml(data.companyName || '')}">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Customer <span class="text-red-500">*</span></label>
            <input type="text" name="targetCustomer" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., Enterprise IT teams" value="${escapeHtml(data.targetCustomer || '')}">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Being Solved <span class="text-red-500">*</span></label>
            <textarea name="problem" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="What pain point does this solve?">${escapeHtml(data.problem || '')}</textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solution/How It Works <span class="text-red-500">*</span></label>
            <textarea name="solution" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="How does your product solve the problem?">${escapeHtml(data.solution || '')}</textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Benefits <span class="text-red-500">*</span></label>
            <textarea name="benefits" required rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="List 3-5 key benefits">${escapeHtml(data.benefits || '')}</textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metrics/Results (optional)</label>
            <textarea name="metrics" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., 40% faster, $1.5M savings, 3x improvement">${escapeHtml(data.metrics || '')}</textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input type="text" name="location" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Seattle, WA" value="${escapeHtml(data.location || 'Seattle, WA')}">
        </div>
    `;
}

/**
 * Handle new project form submission
 * @module views
 */
async function handleNewProject(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  const project = await createProject(data);
  showToast('Project created!', 'success');
  navigateTo('project/' + project.id);
}
