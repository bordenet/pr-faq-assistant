/**
 * Main Application Module
 * PR-FAQ Assistant - AI-assisted PR-FAQ document generator
 */

import storage from './storage.js';
import { showToast, showLoading, hideLoading, confirm, formatDate, formatBytes, copyToClipboard, showPromptModal } from './ui.js';
import { Workflow, WORKFLOW_CONFIG } from './workflow.js';
import { initMockMode, setMockMode } from './ai-mock.js';

// Application state
let currentProject = null;
// eslint-disable-next-line no-unused-vars
let currentView = 'home';

/**
 * Initialize the application
 */
async function init() {
    try {
        showLoading('Initializing...');
        await storage.init();

        setupEventListeners();
        setupThemeToggle();
        setupRelatedProjects();
        setupPrivacyNotice();
        initMockMode();
        updateStorageInfo();

        renderHome();
        hideLoading();
    } catch (error) {
        console.error('Failed to initialize:', error);
        hideLoading();
        showToast('Failed to initialize application', 'error');
    }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Export all button
    document.getElementById('export-all-btn')?.addEventListener('click', exportAllProjects);

    // Import button
    document.getElementById('import-btn')?.addEventListener('click', () => {
        document.getElementById('import-file-input')?.click();
    });

    document.getElementById('import-file-input')?.addEventListener('change', handleImport);

    // Privacy notice close (with localStorage persistence)
    document.getElementById('close-privacy-notice')?.addEventListener('click', () => {
        document.getElementById('privacy-notice')?.classList.add('hidden');
        localStorage.setItem('privacy-notice-dismissed', 'true');
    });

    // AI Mock mode toggle
    document.getElementById('mockModeCheckbox')?.addEventListener('change', (e) => {
        setMockMode(e.target.checked);
        showToast(
            e.target.checked ? 'AI Mock Mode enabled' : 'AI Mock Mode disabled',
            'info'
        );
    });

    // About link
    document.getElementById('about-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showAboutModal();
    });
}

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');

    // Check saved preference or system preference
    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    toggle?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}

/**
 * Setup related projects dropdown
 */
function setupRelatedProjects() {
    const btn = document.getElementById('related-projects-btn');
    const menu = document.getElementById('related-projects-menu');

    btn?.addEventListener('click', () => {
        menu?.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!btn?.contains(e.target) && !menu?.contains(e.target)) {
            menu?.classList.add('hidden');
        }
    });
}

/**
 * Setup privacy notice (show if not dismissed)
 */
function setupPrivacyNotice() {
    if (!localStorage.getItem('privacy-notice-dismissed')) {
        document.getElementById('privacy-notice')?.classList.remove('hidden');
    }
}

/**
 * Update storage info in footer
 */
async function updateStorageInfo() {
    const info = await storage.getStorageInfo();
    const el = document.getElementById('storage-info');

    if (info && el) {
        el.textContent = `Storage: ${formatBytes(info.usage)} used (${info.percentage}%)`;
    } else if (el) {
        el.textContent = 'Storage info unavailable';
    }
}

/**
 * Show about modal
 */
function showAboutModal() {
    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">About PR-FAQ Assistant</h3>
            <div class="text-gray-600 dark:text-gray-400 space-y-3">
                <p>A privacy-first tool for creating high-quality <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ documents</a> using Amazon's Working Backwards methodology with AI assistance.</p>
                <p><strong>Features:</strong></p>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>100% client-side processing</li>
                    <li>No data sent to servers</li>
                    <li>3-phase adversarial AI workflow</li>
                    <li>Optimized for PR-FAQ Validator (70+ score)</li>
                    <li>Multiple project management</li>
                    <li>Import/export capabilities</li>
                </ul>
                <p class="text-sm">All your data stays in your browser's local storage.</p>
            </div>
            <div class="flex justify-end mt-6">
                <button id="close-about" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-about').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Export all projects
 */
async function exportAllProjects() {
    try {
        const data = await storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `pr-faq-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showToast(`Exported ${data.projectCount} project(s)`, 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed', 'error');
    }
}

/**
 * Handle import
 */
async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        showLoading('Importing...');
        const text = await file.text();
        const data = JSON.parse(text);
        const count = await storage.importAll(data);
        hideLoading();
        showToast(`Imported ${count} project(s)`, 'success');
        renderHome();
    } catch (error) {
        console.error('Import failed:', error);
        hideLoading();
        showToast('Import failed - invalid file', 'error');
    }

    event.target.value = '';
}

/**
 * Render home view (project list)
 */
async function renderHome() {
    currentView = 'home';
    currentProject = null;

    const projects = await storage.getAllProjects();
    const container = document.getElementById('app-container');

    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';
    container.innerHTML = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Your <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a> Projects</h2>
            <button id="new-project-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + New PR-FAQ
            </button>
        </div>
        ${projects.length === 0 ? renderEmptyState() : renderProjectList(projects)}
    `;

    document.getElementById('new-project-btn')?.addEventListener('click', renderNewProjectForm);
    setupProjectListeners();
}

/**
 * Render empty state
 */
function renderEmptyState() {
    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';
    return `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div class="text-6xl mb-4">📰</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No PR-FAQs yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Create your first <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">PR-FAQ Document</a></p>
            <button id="empty-state-new-btn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                + Create Your First PR-FAQ
            </button>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-6">Documents are optimized for <a href="https://github.com/bordenet/pr-faq-validator" target="_blank" rel="noopener" class="text-blue-500 dark:text-blue-400 hover:underline">pr-faq-validator</a> (70+ score target)</p>
        </div>
    `;
}

/**
 * Render project list
 */
function renderProjectList(projects) {
    return `
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${projects.map(p => {
        const isComplete = p.phase > WORKFLOW_CONFIG.phaseCount;
        const progress = ((p.phase || 1) / WORKFLOW_CONFIG.phaseCount) * 100;
        return `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer" onclick="openProject('${p.id}')">
                    <div class="p-5">
                        <div class="flex items-start justify-between mb-3">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">${escapeHtml(p.title)}</h3>
                            <button class="delete-btn text-gray-400 hover:text-red-600 transition-colors ml-2" onclick="event.stopPropagation(); deleteProject('${p.id}')">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
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
                            ${isComplete ? `
                                <button onclick="event.stopPropagation(); exportProject('${p.id}')" class="text-green-600 hover:text-green-700 font-medium" title="Export">
                                    Export
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
    }).join('')}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupProjectListeners() {
    // Empty state "Create Your First PR-FAQ" button
    document.getElementById('empty-state-new-btn')?.addEventListener('click', renderNewProjectForm);
}

/**
 * Open a project
 */
async function openProject(id) {
    const project = await storage.getProject(id);
    if (project) {
        currentProject = project;
        renderProjectView();
    }
}

/**
 * Delete a project
 */
async function deleteProject(id) {
    const confirmed = await confirm('Are you sure you want to delete this project?', 'Delete Project');
    if (confirmed) {
        await storage.deleteProject(id);
        showToast('Project deleted', 'success');
        renderHome();
    }
}

/**
 * Export a project as Markdown
 */
async function exportProject(id) {
    const project = await storage.getProject(id);
    if (!project) {
        showToast('Project not found', 'error');
        return;
    }

    const workflow = new Workflow(project);
    downloadMarkdown(workflow, project.title);
}

/**
 * Download markdown file from workflow
 */
function downloadMarkdown(workflow, title = null) {
    const projectTitle = title || currentProject?.title || 'pr-faq';
    const md = workflow.exportAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-prfaq.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PR-FAQ downloaded as Markdown!', 'success');
}

/**
 * Render new project form
 */
function renderNewProjectForm() {
    currentView = 'new';
    const container = document.getElementById('app-container');

    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Create New <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a></h2>
            <form id="new-project-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product/Feature Name <span class="text-red-500">*</span></label>
                    <input type="text" name="productName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., DataSync Pro">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name <span class="text-red-500">*</span></label>
                    <input type="text" name="companyName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., AcmeCorp">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Customer <span class="text-red-500">*</span></label>
                    <input type="text" name="targetCustomer" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., Enterprise IT teams">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Being Solved <span class="text-red-500">*</span></label>
                    <textarea name="problem" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="What pain point does this solve?"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solution/How It Works <span class="text-red-500">*</span></label>
                    <textarea name="solution" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="How does your product solve the problem?"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Benefits <span class="text-red-500">*</span></label>
                    <textarea name="benefits" required rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="List 3-5 key benefits"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metrics/Results (optional)</label>
                    <textarea name="metrics" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., 40% faster, $1.5M savings, 3x improvement"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input type="text" name="location" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Seattle, WA" value="Seattle, WA">
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex gap-3">
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Create</button>
                        <button type="button" id="cancel-new" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                    <button type="button" id="delete-new-disabled" class="px-4 py-2 bg-red-400 text-white rounded-lg cursor-not-allowed opacity-50" disabled title="Nothing to delete yet">Delete</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('new-project-form')?.addEventListener('submit', handleNewProject);
    document.getElementById('cancel-new')?.addEventListener('click', renderHome);
}

/**
 * Handle new project creation
 */
async function handleNewProject(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    const project = {
        id: crypto.randomUUID(),
        title: data.productName,
        phase: 1,
        formData: data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await storage.saveProject(project);
    currentProject = project;
    showToast('Project created!', 'success');
    renderProjectView();
}

/**
 * Render edit project form (allows editing initial input before Phase 1 response is saved)
 */
function renderEditProjectForm() {
    if (!currentProject) return;
    currentView = 'edit';
    const container = document.getElementById('app-container');
    const data = currentProject.formData || {};
    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';

    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Edit <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300">PR-FAQ</a> Input</h2>
            <form id="edit-project-form" class="space-y-4">
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
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex gap-3">
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Save Changes</button>
                        <button type="button" id="cancel-edit" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                    <button type="button" id="delete-from-edit" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('edit-project-form')?.addEventListener('submit', handleEditProject);
    document.getElementById('cancel-edit')?.addEventListener('click', renderProjectView);
    document.getElementById('delete-from-edit')?.addEventListener('click', async () => {
        if (currentProject) {
            await deleteProject(currentProject.id);
        }
    });
}

/**
 * Handle edit project form submission
 */
async function handleEditProject(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    currentProject.title = data.productName;
    currentProject.formData = data;
    currentProject.updatedAt = new Date().toISOString();

    await storage.saveProject(currentProject);
    showToast('Changes saved!', 'success');
    renderProjectView();
}

/**
 * Render project view (workflow phases) - One-Pager style with phase tabs
 */
function renderProjectView() {
    if (!currentProject) return;
    currentView = 'project';

    const workflow = new Workflow(currentProject);
    const container = document.getElementById('app-container');
    const prfaqDocsUrl = 'https://github.com/bordenet/Engineering_Culture/blob/main/SDLC/The_PR-FAQ.md';

    // Check if project is fully complete (all 3 phases done)
    const isFullyComplete = workflow.currentPhase > WORKFLOW_CONFIG.phaseCount ||
        (workflow.getPhaseOutput(WORKFLOW_CONFIG.phaseCount) && workflow.currentPhase === WORKFLOW_CONFIG.phaseCount);

    container.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <button id="back-home" class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to <a href="${prfaqDocsUrl}" target="_blank" rel="noopener noreferrer" class="hover:underline">PR-FAQs</a>
            </button>
            ${isFullyComplete ? `
                <button id="export-final-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    ✓ Export Final PR-FAQ
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

    setupProjectViewListeners(workflow);
}

/**
 * Render content for the current phase
 */
function renderPhaseContent(workflow) {
    const phase = workflow.getCurrentPhase();
    const hasExistingOutput = workflow.getPhaseOutput(workflow.currentPhase);
    const aiUrl = phase.aiModel === 'Gemini' ? 'https://gemini.google.com' : 'https://claude.ai';
    const aiName = phase.aiModel;

    return `
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
                <button id="delete-project-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    `;
}

/**
 * Setup project view event listeners
 */
function setupProjectViewListeners(workflow) {
    document.getElementById('back-home')?.addEventListener('click', renderHome);

    // Phase tabs - switch between phases
    document.querySelectorAll('.phase-tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            const targetPhase = parseInt(tab.dataset.phase);
            workflow.currentPhase = targetPhase;
            currentProject.phase = targetPhase;
            updatePhaseTabStyles(targetPhase);
            document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
            setupPhaseContentListeners(workflow);
        });
    });

    // Export final PR-FAQ button (header)
    document.getElementById('export-final-btn')?.addEventListener('click', () => {
        downloadMarkdown(workflow, currentProject.title);
    });

    setupPhaseContentListeners(workflow);
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
function setupPhaseContentListeners(workflow) {
    const responseTextarea = document.getElementById('phase-output');
    const saveResponseBtn = document.getElementById('save-response-btn');
    const phase = workflow.getCurrentPhase();

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

    // Update save button state as user types
    responseTextarea?.addEventListener('input', () => {
        const hasEnoughContent = responseTextarea.value.trim().length >= 10;
        if (saveResponseBtn) {
            saveResponseBtn.disabled = !hasEnoughContent;
        }
    });

    // Save Response - auto-advance to next phase
    saveResponseBtn?.addEventListener('click', async () => {
        const output = responseTextarea?.value?.trim() || '';
        if (output.length < 10) {
            showToast('Please enter at least 10 characters', 'warning');
            return;
        }
        workflow.savePhaseOutput(output);

        // Auto-advance to next phase if not on final phase
        if (workflow.currentPhase < WORKFLOW_CONFIG.phaseCount) {
            workflow.advancePhase();
            await storage.saveProject(currentProject);
            showToast('Response saved! Moving to next phase...', 'success');
            updatePhaseTabStyles(workflow.currentPhase);
            document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
            setupPhaseContentListeners(workflow);
        } else {
            // Final phase - mark complete and show export
            await storage.saveProject(currentProject);
            showToast('PR-FAQ Complete! You can now export your document.', 'success');
            renderProjectView();
        }
    });

    // Edit Details button (Phase 1 only, before response saved)
    document.getElementById('edit-details-btn')?.addEventListener('click', () => {
        if (currentProject) {
            renderEditProjectForm();
        }
    });

    // Previous Phase
    document.getElementById('prev-phase-btn')?.addEventListener('click', async () => {
        workflow.previousPhase();
        await storage.saveProject(currentProject);
        updatePhaseTabStyles(workflow.currentPhase);
        document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
        setupPhaseContentListeners(workflow);
    });

    // Next Phase
    document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
        workflow.advancePhase();
        await storage.saveProject(currentProject);
        showToast('Moving to next phase...', 'success');
        updatePhaseTabStyles(workflow.currentPhase);
        document.getElementById('phase-content').innerHTML = renderPhaseContent(workflow);
        setupPhaseContentListeners(workflow);
    });

    // Delete project button
    document.getElementById('delete-project-btn')?.addEventListener('click', async () => {
        if (currentProject) {
            await deleteProject(currentProject.id);
        }
    });
}

// Expose functions globally for inline handlers
window.openProject = openProject;
window.deleteProject = deleteProject;
window.exportProject = exportProject;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

