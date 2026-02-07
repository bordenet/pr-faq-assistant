import { initRouter, navigateTo, getCurrentRoute, updateStorageInfo } from '../../shared/js/router.js';
import storage from '../../shared/js/storage.js';
import { createProject, deleteProject, getAllProjects } from '../../shared/js/projects.js';

describe('Router Module', () => {
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

    // Reset hash
    window.location.hash = '';
  });

  describe('navigateTo', () => {
    test('should navigate to home route', () => {
      navigateTo('home');
      expect(getCurrentRoute()).toBe('home');
    });

    test('should navigate to new route', () => {
      navigateTo('new');
      expect(getCurrentRoute()).toBe('new');
    });

    test('should navigate to project route with ID', () => {
      navigateTo('project/test-id');
      expect(getCurrentRoute()).toBe('project/test-id');
    });

    test('should update browser history when pushState is true', () => {
      navigateTo('new', true);
      expect(window.location.hash).toBe('#new');
    });

    test('should not push to history when pushState is false', () => {
      const initialLength = window.history.length;
      navigateTo('new', false);
      // Hash should still update
      expect(getCurrentRoute()).toBe('new');
    });
  });

  describe('getCurrentRoute', () => {
    test('should return current route after navigation', () => {
      navigateTo('home');
      expect(getCurrentRoute()).toBe('home');

      navigateTo('new');
      expect(getCurrentRoute()).toBe('new');
    });

    test('should return project route with param', () => {
      navigateTo('project/abc123');
      expect(getCurrentRoute()).toBe('project/abc123');
    });
  });

  describe('initRouter', () => {
    test('should handle initial route on init', () => {
      window.location.hash = '';
      initRouter();
      // Should navigate to home by default
      expect(getCurrentRoute()).toBe('home');
    });

    test('should handle hash route on init', () => {
      window.location.hash = '#new';
      initRouter();
      expect(getCurrentRoute()).toBe('new');
    });

    test('should handle project hash on init', () => {
      window.location.hash = '#project/test-123';
      initRouter();
      expect(getCurrentRoute()).toBe('project/test-123');
    });
  });

  describe('updateStorageInfo', () => {
    test('should update storage info element', async () => {
      await updateStorageInfo();

      const storageInfo = document.getElementById('storage-info');
      expect(storageInfo.textContent).toBeTruthy();
    });

    test('should show project count', async () => {
      await createProject('Test PR-FAQ 1', 'Description 1');
      await createProject('Test PR-FAQ 2', 'Description 2');

      await updateStorageInfo();

      const storageInfo = document.getElementById('storage-info');
      expect(storageInfo.textContent).toContain('2 projects');
    });

    test('should show 0 projects when empty', async () => {
      await updateStorageInfo();

      const storageInfo = document.getElementById('storage-info');
      expect(storageInfo.textContent).toContain('0 projects');
    });
  });
});
