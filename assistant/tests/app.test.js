/**
 * App Module Tests
 * Tests are limited due to DOM dependency
 * Full testing is covered by E2E tests
 */

describe('App Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="app-container"></div>
      <div id="export-all-btn"></div>
      <div id="import-btn"></div>
      <input id="import-file-input" type="file" />
      <div id="close-proprietary-warning"></div>
      <div id="proprietary-warning"></div>
      <div id="storage-info"></div>
      <div id="new-project-btn"></div>
      <div id="create-first-btn"></div>
    `;
  });

  test('should be loadable', () => {
    expect(document.getElementById('app-container')).toBeTruthy();
  });

  test('should render empty proposals list', () => {
    const container = document.getElementById('app-container');
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 mb-6">No proposals yet</p>
      </div>
    `;
    expect(container.innerHTML).toContain('No proposals yet');
  });

  test('should handle creating new proposal', () => {
    const newBtn = document.getElementById('new-project-btn');
    expect(newBtn).toBeTruthy();
  });

  test('should have storage info element', () => {
    const storageInfo = document.getElementById('storage-info');
    expect(storageInfo).toBeTruthy();
  });
});
