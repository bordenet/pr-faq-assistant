import { jest } from '@jest/globals';
import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  savePhaseOutput,
  advancePhase,
  exportAllProjects,
  importProjects,
  exportProjectAsMarkdown,
  sanitizeFilename,
  getExportFilename,
  getFinalMarkdown
} from '../../shared/js/projects.js';
import storage from '../../shared/js/storage.js';
import { Workflow } from '../../shared/js/workflow.js';

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

    test('should extract and update title from phase 3 output with bold headline', async () => {
      const project = await createProject({ productName: 'Initial Title' });
      const phase3Output = `# PRESS RELEASE

**Acme Corp Launches Smart Appointment Scheduler, Reducing Customer No-Show Rates by 62%**

SEATTLE, WA — February 15, 2026 — Acme Corp today announced Smart Appointment Scheduler...`;

      const updated = await savePhaseOutput(project.id, 3, phase3Output);

      expect(updated.title).toBe('Acme Corp Launches Smart Appointment Scheduler, Reducing Customer No-Show Rates by 62%');
      expect(updated.phase3_output).toBe(phase3Output);
    });

    test('should extract and update title from phase 3 output with H1 header', async () => {
      const project = await createProject({ productName: 'Initial Title' });
      const phase3Output = `# Revolutionary New Product Launches Today

Press release content here...`;

      const updated = await savePhaseOutput(project.id, 3, phase3Output);

      expect(updated.title).toBe('Revolutionary New Product Launches Today');
    });

    test('should not update title from phase 1 or 2 output', async () => {
      const project = await createProject({ productName: 'Original Title' });
      const phase1Output = `# Some Different Title

Content here...`;

      const updated = await savePhaseOutput(project.id, 1, phase1Output);

      expect(updated.title).toBe('Original Title');
    });

    test('should keep original title if phase 3 has no extractable title', async () => {
      const project = await createProject({ productName: 'Original Title' });
      const phase3Output = 'Just some plain text without any title markers';

      const updated = await savePhaseOutput(project.id, 3, phase3Output);

      expect(updated.title).toBe('Original Title');
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

    test('should advance to phase 4 (complete state)', async () => {
      const project = await createProject({ productName: 'Test' });
      await advancePhase(project.id); // 1 -> 2
      await advancePhase(project.id); // 2 -> 3
      const updated = await advancePhase(project.id); // 3 -> 4 (complete)

      expect(updated.phase).toBe(4);
    });

    test('should not advance past phase 4 (complete state)', async () => {
      const project = await createProject({ productName: 'Test' });
      await advancePhase(project.id); // 1 -> 2
      await advancePhase(project.id); // 2 -> 3
      await advancePhase(project.id); // 3 -> 4 (complete)
      const updated = await advancePhase(project.id); // 4 -> 4 (stays complete)

      expect(updated.phase).toBe(4);
    });

    test('should throw error for non-existent project', async () => {
      await expect(advancePhase('non-existent'))
        .rejects.toThrow('Project not found');
    });
  });

  describe('sanitizeFilename', () => {
    test('should convert to lowercase and replace special chars', () => {
      expect(sanitizeFilename('My Product Name!')).toBe('my-product-name');
    });

    test('should collapse multiple dashes', () => {
      expect(sanitizeFilename('test---product')).toBe('test-product');
    });

    test('should remove leading and trailing dashes', () => {
      expect(sanitizeFilename('---test---')).toBe('test');
    });

    test('should truncate long filenames', () => {
      const longName = 'a'.repeat(100);
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(50);
    });

    test('should use default for empty string', () => {
      expect(sanitizeFilename('')).toBe('pr-faq');
    });
  });

  describe('getExportFilename', () => {
    test('should generate sanitized filename with extension', () => {
      const project = { title: 'My Product' };
      expect(getExportFilename(project)).toBe('my-product-prfaq.md');
    });

    test('should handle missing title', () => {
      const project = {};
      expect(getExportFilename(project)).toBe('pr-faq-prfaq.md');
    });
  });

  describe('getFinalMarkdown', () => {
    test('should return markdown from workflow', () => {
      const project = {
        title: 'Test',
        phase3_output: 'Final content'
      };
      const workflow = new Workflow(project);
      const markdown = getFinalMarkdown(project, workflow);
      expect(markdown).toContain('Final content');
      expect(markdown).toContain('PR-FAQ Assistant');
    });
  });

  describe('exportAllProjects', () => {
    let mockUrl;
    let mockAnchor;
    let capturedBlob;
    let capturedDownloadName;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalCreateElement;

    beforeEach(() => {
      // Add toast container to DOM for showToast
      document.body.innerHTML = '<div id="toast-container"></div>';

      mockUrl = 'blob:mock-url';
      capturedBlob = null;
      capturedDownloadName = null;

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      // Store original createElement before any spying
      originalCreateElement = document.createElement.bind(document);
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    });

    test('should export projects as JSON file', async () => {
      mockAnchor = { href: '', download: '', click: jest.fn() };
      URL.createObjectURL = jest.fn(() => mockUrl);
      URL.revokeObjectURL = jest.fn();
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement(tag);
      });

      await createProject({ productName: 'Export Test' });
      await exportAllProjects();

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/pr-faq-export-.*\.json/);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    test('should include all projects in backup with correct format', async () => {
      URL.createObjectURL = jest.fn((blob) => {
        capturedBlob = blob;
        return mockUrl;
      });
      URL.revokeObjectURL = jest.fn();
      mockAnchor = { href: '', download: '', click: jest.fn() };
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement(tag);
      });

      await createProject({ productName: 'Test Project 1' });
      await createProject({ productName: 'Test Project 2' });

      await exportAllProjects();

      expect(capturedBlob).toBeInstanceOf(Blob);

      // Use FileReader to read the blob content
      const blobContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(capturedBlob);
      });

      const backupData = JSON.parse(blobContent);
      expect(backupData).toHaveProperty('version');
      expect(backupData).toHaveProperty('exportDate');
      expect(backupData).toHaveProperty('projectCount', 2);
      expect(backupData).toHaveProperty('projects');
      expect(Array.isArray(backupData.projects)).toBe(true);
      expect(backupData.projects).toHaveLength(2);
    });

    test('should include correct filename with date', async () => {
      URL.createObjectURL = jest.fn(() => mockUrl);
      URL.revokeObjectURL = jest.fn();
      mockAnchor = {
        href: '',
        set download(value) { capturedDownloadName = value; },
        get download() { return capturedDownloadName; },
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement(tag);
      });

      await createProject({ productName: 'Test' });
      await exportAllProjects();

      expect(capturedDownloadName).toMatch(/^pr-faq-export-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });

  describe('importProjects', () => {
    // Helper to create a file-like Blob with text() method
    function createFileLikeBlob(content) {
      const jsonString = typeof content === 'string' ? content : JSON.stringify(content);
      const file = new Blob([jsonString], { type: 'application/json' });
      file.text = async () => jsonString;
      return file;
    }

    test('should import single project from valid file', async () => {
      const projectData = {
        id: 'import-test-1',
        title: 'Single Import Test',
        projects: [{ id: 'import-test-1', title: 'Single Import Test', createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      };
      const file = createFileLikeBlob(projectData);

      const importedCount = await importProjects(file);
      expect(importedCount).toBe(1);
    });

    test('should import multiple projects from backup format', async () => {
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projectCount: 2,
        projects: [
          { id: 'backup-1', title: 'Backup Project 1', createdAt: new Date().toISOString() },
          { id: 'backup-2', title: 'Backup Project 2', createdAt: new Date().toISOString() }
        ]
      };
      const file = createFileLikeBlob(backup);

      const importedCount = await importProjects(file);
      expect(importedCount).toBe(2);
    });

    test('should handle empty backup file', async () => {
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projectCount: 0,
        projects: []
      };

      const file = createFileLikeBlob(backup);

      const importedCount = await importProjects(file);
      expect(importedCount).toBe(0);
    });

    test('should reject invalid file format', async () => {
      const invalidContent = { random: 'data' };
      const file = createFileLikeBlob(invalidContent);

      await expect(importProjects(file)).rejects.toThrow('Invalid import data');
    });

    test('should reject invalid JSON', async () => {
      const file = createFileLikeBlob('not valid json');

      await expect(importProjects(file)).rejects.toThrow();
    });
  });

  describe('exportProjectAsMarkdown', () => {
    let mockUrl;
    let mockAnchor;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalCreateElement;

    beforeEach(() => {
      // Add toast container to DOM for showToast
      document.body.innerHTML = '<div id="toast-container"></div>';

      mockUrl = 'blob:mock-md-url';
      mockAnchor = { href: '', download: '', click: jest.fn() };

      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      originalCreateElement = document.createElement.bind(document);

      URL.createObjectURL = jest.fn(() => mockUrl);
      URL.revokeObjectURL = jest.fn();
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') return mockAnchor;
        return originalCreateElement(tag);
      });
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    });

    test('should export project as markdown file', async () => {
      const project = await createProject({ productName: 'Markdown Test' });
      await exportProjectAsMarkdown(project.id);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('-prfaq.md');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    test('should show error for non-existent project', async () => {
      await exportProjectAsMarkdown('non-existent-id');
      // Should not throw, just show toast
    });
  });
});
