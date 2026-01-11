import { renderProjectsList, renderNewProjectForm, renderEditProjectForm } from '../js/views.js';
import { createProject, deleteProject, getAllProjects } from '../js/projects.js';
import storage from '../js/storage.js';

describe('Views Module', () => {
  beforeEach(async () => {
    // Initialize database
    await storage.init();

    // Clear all projects
    const allProjects = await getAllProjects();
    for (const project of allProjects) {
      await deleteProject(project.id);
    }

    // Set up DOM
    document.body.innerHTML = '<div id="app-container"></div><span id="storage-info"></span><div id="toast-container"></div>';
  });

  describe('renderProjectsList', () => {
    test('should render empty state when no projects exist', async () => {
      await renderProjectsList();

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('No PR-FAQs yet');
      expect(container.innerHTML).toContain('Create your first');
    });

    test('should render projects list when projects exist', async () => {
      await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      await renderProjectsList();

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Test PR-FAQ');
      expect(container.innerHTML).toContain('Your');
    });

    test('should render new project button', async () => {
      await renderProjectsList();

      const container = document.getElementById('app-container');
      const newProjectBtn = container.querySelector('#new-project-btn');
      expect(newProjectBtn).toBeTruthy();
      expect(newProjectBtn.textContent).toContain('New PR-FAQ');
    });

    test('should render project cards with phase information', async () => {
      await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      await renderProjectsList();

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Phase');
      expect(container.innerHTML).toContain('/3');
    });

    test('should render delete buttons for each project', async () => {
      await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      await renderProjectsList();

      const container = document.getElementById('app-container');
      const deleteBtn = container.querySelector('.delete-btn');
      expect(deleteBtn).toBeTruthy();
    });

    test('should render project cards with data attributes', async () => {
      const project = await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      await renderProjectsList();

      const container = document.getElementById('app-container');
      const projectCard = container.querySelector(`[data-project-id="${project.id}"]`);
      expect(projectCard).toBeTruthy();
    });
  });

  describe('renderNewProjectForm', () => {
    test('should render new project form', () => {
      renderNewProjectForm();

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Create New');
      expect(container.innerHTML).toContain('PR-FAQ');
    });

    test('should render form fields', () => {
      renderNewProjectForm();

      const container = document.getElementById('app-container');
      expect(container.querySelector('input[name="productName"]')).toBeTruthy();
      expect(container.querySelector('textarea[name="problem"]')).toBeTruthy();
    });

    test('should render submit button', () => {
      renderNewProjectForm();

      const container = document.getElementById('app-container');
      const submitBtn = container.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });
  });

  describe('renderEditProjectForm', () => {
    test('should render edit form with project data', async () => {
      const project = await createProject({ productName: 'Edit Test PR-FAQ', problem: 'Edit test problem' });

      renderEditProjectForm(project);

      const container = document.getElementById('app-container');
      expect(container.innerHTML).toContain('Edit');
      expect(container.innerHTML).toContain('PR-FAQ');
    });

    test('should render delete button in edit form', async () => {
      const project = await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      renderEditProjectForm(project);

      const container = document.getElementById('app-container');
      const deleteBtn = container.querySelector('#delete-btn');
      expect(deleteBtn).toBeTruthy();
    });

    test('should render submit button in edit form', async () => {
      const project = await createProject({ productName: 'Test PR-FAQ', problem: 'Test problem' });

      renderEditProjectForm(project);

      const container = document.getElementById('app-container');
      const submitBtn = container.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });
  });
});
