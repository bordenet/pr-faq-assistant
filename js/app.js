/**
 * Main Application Module
 * PR-FAQ Assistant - AI-assisted PR-FAQ document generator
 */

import storage from './storage.js';
import { showToast, showLoading, hideLoading, confirm, formatDate, formatBytes, copyToClipboard } from './ui.js';
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
    return `
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-6xl mb-4">📰</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No PR-FAQ Projects Yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">Create your first PR-FAQ document to get started.</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">Documents are optimized for <a href="https://github.com/bordenet/pr-faq-validator" target="_blank" rel="noopener" class="text-blue-500 dark:text-blue-400 hover:underline">pr-faq-validator</a> (70+ score target)</p>
        </div>
    `;
}

/**
 * Render project list
 */
function renderProjectList(projects) {
    return `
        <div class="grid gap-4">
            ${projects.map(p => {
        const isComplete = p.phase > WORKFLOW_CONFIG.phaseCount;
        return `
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover-lift cursor-pointer" onclick="openProject('${p.id}')">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-medium text-gray-900 dark:text-white">${escapeHtml(p.title)}</h3>
                            ${isComplete ? `
                                <span class="inline-flex items-center mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                    ✓ Complete
                                </span>
                            ` : `
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Phase ${p.phase || 1} of ${WORKFLOW_CONFIG.phaseCount}</p>
                            `}
                            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Updated ${formatDate(p.updatedAt)}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            ${isComplete ? `
                                <button onclick="event.stopPropagation(); exportProject('${p.id}')" class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700" title="Export">
                                    Export
                                </button>
                            ` : ''}
                            <button onclick="event.stopPropagation(); deleteProject('${p.id}')" class="text-red-500 hover:text-red-700 p-1" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
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
    const hasExistingOutput = workflow.getPhaseOutput(workflow.currentPhase);
    const aiUrl = workflow.currentPhase === 2 ? 'https://gemini.google.com' : 'https://claude.ai';
    const aiName = workflow.currentPhase === 2 ? 'Gemini' : 'Claude';

    container.innerHTML = `
        <div class="mb-4">
            <button id="back-home" class="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Projects
            </button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">${escapeHtml(currentProject.title)}</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Phase ${workflow.currentPhase}: ${phase.name}</p>
                    <div class="inline-flex items-center mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                        <span class="mr-2">🤖</span>
                        Use with ${aiName}
                    </div>
                </div>
                <button id="export-md-btn" class="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600">Export MD</button>
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

            <!-- Step A: Copy Prompt -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step A: Copy Prompt to AI
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${phase.description}</p>
                <div class="flex gap-3 flex-wrap">
                    <button id="copy-prompt-btn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        📋 Copy Prompt to Clipboard
                    </button>
                    <a
                        id="open-ai-btn"
                        href="${aiUrl}"
                        target="ai-assistant-tab"
                        rel="noopener noreferrer"
                        class="px-6 py-3 bg-green-600 text-white rounded-lg transition-colors font-medium ${hasExistingOutput ? 'hover:bg-green-700' : 'opacity-50 cursor-not-allowed pointer-events-none'}"
                        ${hasExistingOutput ? '' : 'aria-disabled="true"'}
                    >
                        🔗 Open ${aiName}
                    </a>
                </div>
            </div>

            <!-- Step B: Paste Response -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Step B: Paste ${aiName}'s Response
                </h4>
                <textarea
                    id="phase-output"
                    rows="12"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm ${hasExistingOutput ? '' : 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800'}"
                    placeholder="Paste ${aiName}'s response here..."
                    ${hasExistingOutput ? '' : 'disabled'}
                >${escapeHtml(workflow.getPhaseOutput(workflow.currentPhase))}</textarea>

                <div class="mt-3 flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        ${hasExistingOutput ? '✓ Response saved' : 'Copy prompt first, then paste response'}
                    </span>
                    <button id="save-response-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        Save Response
                    </button>
                </div>
            </div>

            ${workflow.currentPhase === WORKFLOW_CONFIG.phaseCount && hasExistingOutput ? `
            <!-- Phase 3 Download Section -->
            <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-lg font-semibold text-green-900 dark:text-green-100">📥 Download Your Final PR-FAQ</h4>
                        <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                            Save your polished PR-FAQ as a properly formatted Markdown file.
                            <strong>Don't copy as plain text</strong> — download preserves formatting!
                        </p>
                    </div>
                    <button id="download-final-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download Markdown
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- Navigation -->
            <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button id="prev-phase-btn" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${workflow.currentPhase === 1 ? 'invisible' : ''}">
                    ← Previous Phase
                </button>
                ${hasExistingOutput && workflow.currentPhase < WORKFLOW_CONFIG.phaseCount ? `
                <button id="next-phase-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Next Phase →
                </button>
                ` : hasExistingOutput && workflow.currentPhase === WORKFLOW_CONFIG.phaseCount ? `
                <button id="finish-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    ✓ Complete
                </button>
                ` : '<div></div>'}
            </div>
        </div>
    `;

    setupProjectViewListeners(workflow);
}

/**
 * Setup project view event listeners
 */
function setupProjectViewListeners(workflow) {
    const responseTextarea = document.getElementById('phase-output');
    const saveResponseBtn = document.getElementById('save-response-btn');

    document.getElementById('back-home')?.addEventListener('click', renderHome);

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
            responseTextarea.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
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

    // Export Markdown (small button in header)
    document.getElementById('export-md-btn')?.addEventListener('click', () => {
        downloadMarkdown(workflow);
    });

    // Download Final PR-FAQ (prominent Phase 3 button)
    document.getElementById('download-final-btn')?.addEventListener('click', () => {
        downloadMarkdown(workflow);
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
            renderProjectView();
        } else {
            // Final phase - mark complete
            currentProject.phase = WORKFLOW_CONFIG.phaseCount + 1;
            await storage.saveProject(currentProject);
            showToast('PR-FAQ Complete!', 'success');
            renderHome();
        }
    });

    // Previous Phase
    document.getElementById('prev-phase-btn')?.addEventListener('click', async () => {
        workflow.previousPhase();
        await storage.saveProject(currentProject);
        renderProjectView();
    });

    // Next Phase
    document.getElementById('next-phase-btn')?.addEventListener('click', async () => {
        workflow.advancePhase();
        await storage.saveProject(currentProject);
        showToast('Moving to next phase...', 'success');
        renderProjectView();
    });

    // Finish
    document.getElementById('finish-btn')?.addEventListener('click', async () => {
        currentProject.phase = WORKFLOW_CONFIG.phaseCount + 1; // Mark complete
        await storage.saveProject(currentProject);
        showToast('PR-FAQ Complete!', 'success');
        renderHome();
    });
}

// Expose functions globally for inline handlers
window.openProject = openProject;
window.deleteProject = deleteProject;
window.exportProject = exportProject;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

