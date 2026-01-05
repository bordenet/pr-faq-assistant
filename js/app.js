/**
 * Main Application Module
 * PR-FAQ Assistant - AI-assisted PR-FAQ document generator
 */

import storage from './storage.js';
import { showToast, showLoading, hideLoading, confirm, formatDate, formatBytes, copyToClipboard } from './ui.js';
import { Workflow, WORKFLOW_CONFIG } from './workflow.js';

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

    // Privacy notice close
    document.getElementById('close-privacy-notice')?.addEventListener('click', () => {
        document.getElementById('privacy-notice')?.classList.add('hidden');
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

    container.innerHTML = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Your PR-FAQ Projects</h2>
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
    return `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-6xl mb-4">📰</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No PR-FAQ Projects Yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">Create your first PR-FAQ document to get started.</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">Documents are optimized for pr-faq-validator (70+ score target)</p>
        </div>
    `;
}

/**
 * Render project list
 */
function renderProjectList(projects) {
    return `
        <div class="grid gap-4">
            ${projects.map(p => `
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover-lift cursor-pointer" onclick="openProject('${p.id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-medium text-gray-900 dark:text-white">${escapeHtml(p.title)}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Phase ${p.phase || 1} of ${WORKFLOW_CONFIG.phaseCount}</p>
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Updated ${formatDate(p.updatedAt)}</p>
                        </div>
                        <button onclick="event.stopPropagation(); deleteProject('${p.id}')" class="text-red-500 hover:text-red-700 p-1" title="Delete">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupProjectListeners() {
    // Additional listeners if needed
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
 * Render new project form
 */
function renderNewProjectForm() {
    currentView = 'new';
    const container = document.getElementById('app-container');

    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Create New PR-FAQ</h2>
            <form id="new-project-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product/Feature Name *</label>
                    <input type="text" name="productName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., DataSync Pro">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                    <input type="text" name="companyName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., AcmeCorp">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Customer *</label>
                    <input type="text" name="targetCustomer" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., Enterprise IT teams">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Being Solved *</label>
                    <textarea name="problem" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="What pain point does this solve?"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solution/How It Works *</label>
                    <textarea name="solution" required rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="How does your product solve the problem?"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Benefits *</label>
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
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Project</button>
                    <button type="button" id="cancel-new" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
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
 * Render project view (workflow phases)
 */
function renderProjectView() {
    if (!currentProject) return;
    currentView = 'project';

    const workflow = new Workflow(currentProject);
    const phase = workflow.getCurrentPhase();
    const container = document.getElementById('app-container');

    container.innerHTML = `
        <div class="mb-4">
            <button id="back-home" class="text-blue-600 dark:text-blue-400 hover:underline">← Back to Projects</button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">${escapeHtml(currentProject.title)}</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Phase ${workflow.currentPhase}: ${phase.name}</p>
                </div>
                <div class="flex gap-2">
                    <button id="copy-prompt-btn" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Copy Prompt</button>
                    <button id="export-md-btn" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Export MD</button>
                </div>
            </div>

            <!-- Progress bar -->
            <div class="mb-6">
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>${workflow.getProgress()}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${workflow.getProgress()}%"></div>
                </div>
            </div>

            <!-- Phase content -->
            <div class="space-y-4">
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-white mb-2">Instructions for Phase ${workflow.currentPhase}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${phase.description}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Use: ${phase.aiModel}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Response</label>
                    <textarea id="phase-output" rows="12" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm" placeholder="Paste the AI response here...">${escapeHtml(workflow.getPhaseOutput(workflow.currentPhase))}</textarea>
                </div>

                <div class="flex gap-3">
                    ${workflow.currentPhase > 1 ? '<button id="prev-phase-btn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">← Previous</button>' : ''}
                    <button id="save-phase-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                    ${workflow.currentPhase < WORKFLOW_CONFIG.phaseCount ? '<button id="next-phase-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save & Next →</button>' : '<button id="finish-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Finish ✓</button>'}
                </div>
            </div>
        </div>
    `;

    setupProjectViewListeners(workflow);
}

/**
 * Setup project view event listeners
 */
function setupProjectViewListeners(workflow) {
    document.getElementById('back-home')?.addEventListener('click', renderHome);

    document.getElementById('copy-prompt-btn')?.addEventListener('click', () => {
        const prompt = workflow.generatePrompt();
        copyToClipboard(prompt);
    });

    document.getElementById('export-md-btn')?.addEventListener('click', () => {
        const md = workflow.exportAsMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported!', 'success');
    });

    document.getElementById('save-phase-btn')?.addEventListener('click', async () => {
        const output = document.getElementById('phase-output')?.value || '';
        workflow.savePhaseOutput(output);
        await storage.saveProject(currentProject);
        showToast('Saved!', 'success');
    });

    document.getElementById('prev-phase-btn')?.addEventListener('click', async () => {
        workflow.previousPhase();
        await storage.saveProject(currentProject);
        renderProjectView();
    });

    document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
        const output = document.getElementById('phase-output')?.value || '';
        workflow.savePhaseOutput(output);
        workflow.advancePhase();
        await storage.saveProject(currentProject);
        renderProjectView();
    });

    document.getElementById('finish-btn')?.addEventListener('click', async () => {
        const output = document.getElementById('phase-output')?.value || '';
        workflow.savePhaseOutput(output);
        currentProject.phase = WORKFLOW_CONFIG.phaseCount + 1; // Mark complete
        await storage.saveProject(currentProject);
        showToast('PR-FAQ Complete!', 'success');
        renderHome();
    });
}

// Expose functions globally for inline handlers
window.openProject = openProject;
window.deleteProject = deleteProject;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

