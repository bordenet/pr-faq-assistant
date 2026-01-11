import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  savePhaseOutput,
  advancePhase
} from '../js/projects.js';
import storage from '../js/storage.js';

describe('Projects Module', () => {
  beforeEach(async () => {
    // Initialize the database for each test
    await storage.init();

    // Clear all projects from the database
    const allProjects = await getAllProjects();
    for (const project of allProjects) {
      await deleteProject(project.id);
    }
  });

  describe('createProject', () => {
    test('should create a new project with all required fields', async () => {
      const formData = {
        productName: 'Test Product',
        customerProblem: 'Test problem',
        targetCustomer: 'Test customer'
      };

      const project = await createProject(formData);

      expect(project.id).toBeTruthy();
      expect(project.title).toBe('Test Product');
      expect(project.phase).toBe(1);
      expect(project.formData).toBe(formData);
      expect(project.createdAt).toBeTruthy();
      expect(project.updatedAt).toBeTruthy();
    });

    test('should save project to storage', async () => {
      const formData = { productName: 'Test' };
      const project = await createProject(formData);
      const retrieved = await storage.getProject(project.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved.id).toBe(project.id);
    });
  });

  describe('getAllProjects', () => {
    test('should return empty array when no projects exist', async () => {
      const projects = await getAllProjects();
      expect(projects).toEqual([]);
    });

    test('should return all projects', async () => {
      await createProject({ productName: 'Project 1' });
      await createProject({ productName: 'Project 2' });

      const projects = await getAllProjects();
      expect(projects.length).toBe(2);
    });
  });

  describe('getProject', () => {
    test('should retrieve a project by id', async () => {
      const created = await createProject({ productName: 'Test' });
      const retrieved = await getProject(created.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe('Test');
    });

    test('should return undefined for non-existent project', async () => {
      const project = await getProject('non-existent-id');
      expect(project).toBeUndefined();
    });
  });

  describe('updateProject', () => {
    test('should update project metadata', async () => {
      const project = await createProject({ productName: 'Test' });

      const updated = await updateProject(project.id, { title: 'Updated Title' });

      expect(updated.title).toBe('Updated Title');
    });

    test('should throw error for non-existent project', async () => {
      await expect(updateProject('non-existent', { title: 'New' }))
        .rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    test('should delete a project', async () => {
      const project = await createProject({ productName: 'Test' });

      await deleteProject(project.id);

      const retrieved = await getProject(project.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('savePhaseOutput', () => {
    test('should save phase output to project', async () => {
      const project = await createProject({ productName: 'Test' });

      const updated = await savePhaseOutput(project.id, 1, 'Phase 1 output');

      expect(updated.phase1_output).toBe('Phase 1 output');
    });

    test('should throw error for non-existent project', async () => {
      await expect(savePhaseOutput('non-existent', 1, 'output'))
        .rejects.toThrow('Project not found');
    });
  });

  describe('advancePhase', () => {
    test('should advance phase from 1 to 2', async () => {
      const project = await createProject({ productName: 'Test' });

      const updated = await advancePhase(project.id);

      expect(updated.phase).toBe(2);
    });

    test('should not advance past phase 3', async () => {
      const project = await createProject({ productName: 'Test' });
      await advancePhase(project.id); // 1 -> 2
      await advancePhase(project.id); // 2 -> 3
      const updated = await advancePhase(project.id); // 3 -> 3

      expect(updated.phase).toBe(3);
    });

    test('should throw error for non-existent project', async () => {
      await expect(advancePhase('non-existent'))
        .rejects.toThrow('Project not found');
    });
  });
});
