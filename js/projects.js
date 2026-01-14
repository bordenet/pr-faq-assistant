/**
 * Projects Module
 * Handles project CRUD operations and business logic
 * @module projects
 */

import storage from './storage.js';
import { showToast } from './ui.js';
import { Workflow } from './workflow.js';

/**
 * Create a new project
 */
export async function createProject(formData) {
  const project = {
    id: crypto.randomUUID(),
    title: formData.productName,
    phase: 1,
    formData: formData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await storage.saveProject(project);
  return project;
}

/**
 * Get all projects
 */
export async function getAllProjects() {
  return await storage.getAllProjects();
}

/**
 * Get a single project by ID
 */
export async function getProject(id) {
  return await storage.getProject(id);
}

/**
 * Update a project
 */
export async function updateProject(projectId, updates) {
  const project = await storage.getProject(projectId);
  if (!project) throw new Error('Project not found');

  Object.assign(project, updates);
  project.updatedAt = new Date().toISOString();

  await storage.saveProject(project);
  return project;
}

/**
 * Delete a project
 */
export async function deleteProject(id) {
  await storage.deleteProject(id);
}

/**
 * Save phase output for a project
 */
export async function savePhaseOutput(projectId, phase, output) {
  const project = await storage.getProject(projectId);
  if (!project) throw new Error('Project not found');

  const phaseKey = `phase${phase}_output`;
  project[phaseKey] = output;
  project.updatedAt = new Date().toISOString();

  await storage.saveProject(project);
  return project;
}

/**
 * Advance project to next phase
 */
export async function advancePhase(projectId) {
  const project = await storage.getProject(projectId);
  if (!project) throw new Error('Project not found');

  if (project.phase < 3) {
    project.phase += 1;
    project.updatedAt = new Date().toISOString();
    await storage.saveProject(project);
  }

  return project;
}

/**
 * Export all projects as JSON backup
 */
export async function exportAllProjects() {
  const data = await storage.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pr-faq-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast(`Exported ${data.projectCount} project(s)`, 'success');
}

/**
 * Import projects from JSON file
 */
export async function importProjects(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  const count = await storage.importAll(data);
  return count;
}

/**
 * Export a single project as Markdown
 */
export async function exportProjectAsMarkdown(projectId) {
  const project = await storage.getProject(projectId);
  if (!project) {
    showToast('Project not found', 'error');
    return;
  }

  const workflow = new Workflow(project);
  const md = workflow.exportAsMarkdown();
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(project.title)}-prfaq.md`;
  a.click();

  URL.revokeObjectURL(url);
  showToast('PR-FAQ downloaded as Markdown!', 'success');
}

/**
 * Sanitize filename for export
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  return (filename || 'pr-faq')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Generate export filename for a project
 * @param {Object} project - Project object
 * @returns {string} Filename with .md extension
 */
export function getExportFilename(project) {
  return `${sanitizeFilename(project.title)}-prfaq.md`;
}

/**
 * Get the final markdown content from a project using workflow
 * @param {Object} project - Project object
 * @param {Object} workflow - Workflow instance
 * @returns {string|null} The markdown content or null if none exists
 */
export function getFinalMarkdown(project, workflow) {
  return workflow.exportAsMarkdown();
}
