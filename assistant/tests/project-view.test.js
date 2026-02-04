/**
 * Tests for project-view.js module
 *
 * Tests the project detail view rendering and workflow integration.
 * Uses jsdom for DOM testing with real implementations.
 */

import { renderProjectView } from '../js/project-view.js';
import { createProject, deleteProject, getAllProjects } from '../js/projects.js';
import storage from '../js/storage.js';

describe('Project View Module', () => {
  beforeEach(async () => {
    // Initialize database
    await storage.init();

    // Clear all projects
    const allProjects = await getAllProjects();
    for (const project of allProjects) {
      await deleteProject(project.id);
    }

    // Set up DOM with required elements
    document.body.innerHTML = `
      <div id="app-container"></div>
      <span id="storage-info"></span>
      <div id="toast-container"></div>
    `;
  });

  describe('renderProjectView', () => {
    test('should render project view with phase tabs', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Phase 1');
      expect(container.innerHTML).toContain('Phase 2');
      expect(container.innerHTML).toContain('Phase 3');
      expect(container.innerHTML).toContain('Back to PR-FAQs');
    });

    test('should render copy prompt button', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Copy Prompt');
    });

    test('should render more actions menu button', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('more-actions-btn');
    });

    test('should render phase content area', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('phase-content');
      expect(container.innerHTML).toContain('Step A');
      expect(container.innerHTML).toContain('Step B');
    });

    test('should render response textarea', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('phase-output');
      expect(container.innerHTML).toContain('Save Response');
    });

    test('should render Open AI link', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      // Phase 1 uses Claude
      expect(container.innerHTML).toContain('Open Claude');
      expect(container.innerHTML).toContain('https://claude.ai');
    });
  });

  describe('Phase tab interaction', () => {
    test('should render phase 1 as active by default', async () => {
      const project = await createProject({
        productName: 'Test PR-FAQ',
        problem: 'Test problem'
      });

      await renderProjectView(project.id);

      const container = document.getElementById('app-container');
      // Phase 1 tab should have active styling (border-blue-600)
      expect(container.innerHTML).toContain('border-blue-600');
    });
  });
});
