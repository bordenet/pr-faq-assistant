import { test, expect } from '@playwright/test';

/**
 * Helper to create a new PR-FAQ project
 */
async function createProject(page, name = 'Test Product') {
  // First, ensure we're on the home view
  // If we see a "Back to PR-FAQs" button, click it to go home
  const backBtn = page.locator('#back-home');
  if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await backBtn.click();
    await page.waitForTimeout(300);
  }

  // Click the "Create Your First PR-FAQ" button (empty state) or "+ New PR-FAQ" button
  const emptyStateBtn = page.locator('#empty-state-new-btn');
  const newProjectBtn = page.locator('#new-project-btn');

  // Wait for either button to be available
  await Promise.race([
    emptyStateBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    newProjectBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
  ]);

  if (await emptyStateBtn.isVisible()) {
    await emptyStateBtn.click();
  } else if (await newProjectBtn.isVisible()) {
    await newProjectBtn.click();
  } else {
    throw new Error('Neither empty state button nor new project button is visible');
  }

  // Wait for the form to be fully rendered (wait for the form element itself)
  await page.waitForSelector('#new-project-form', { state: 'visible', timeout: 10000 });

  // Fill all required fields
  await page.locator('input[name="productName"]').fill(name);
  await page.locator('input[name="companyName"]').fill('Test Company');
  await page.locator('input[name="targetCustomer"]').fill('Test Customers');
  await page.locator('textarea[name="problem"]').fill('Test problem description');
  await page.locator('textarea[name="solution"]').fill('Test solution description');
  await page.locator('textarea[name="benefits"]').fill('Test benefits');

  await page.click('button[type="submit"]:has-text("Create")');
  // After creation, we're taken to project workflow view with Phase 1 shown
  await page.waitForSelector('text=Phase 1', { timeout: 10000 });
  await page.waitForSelector('text=Initial Draft', { timeout: 10000 });
}

test.describe('PR-FAQ Workflow', () => {
  // Use a fresh context for each test to ensure clean IndexedDB
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to the app
    await page.goto('/');
    await page.waitForSelector('#app-container', { state: 'visible' });

    // Clear IndexedDB from within the app's origin
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const dbName = 'pr-faq-assistant-db';
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => setTimeout(resolve, 100);
      });
    });

    // Reload to get fresh state after clearing IndexedDB
    await page.reload();
    await page.waitForSelector('#app-container', { state: 'visible' });

    // Wait for app to fully initialize
    await page.waitForTimeout(300);
  });

  test('should create a new PR-FAQ project', async ({ page }) => {
    await createProject(page, 'Test Product');
    // Verify we're in the project workflow view with Phase 1 visible
    await expect(page.locator('text=Phase 1')).toBeVisible();
    await expect(page.locator('text=Copy Prompt to Clipboard')).toBeVisible();
  });

  test('should enable Save Response button when typing in textarea', async ({ page }) => {
    await createProject(page, 'Type Test');

    // Click "Copy Prompt to Clipboard" to enable the textarea
    await page.click('button:has-text("Copy Prompt")');
    await page.waitForTimeout(200);

    // Now textarea should be enabled
    const textarea = page.locator('#phase-output');
    await expect(textarea).toBeEnabled();

    // Save button should be disabled initially (no content yet)
    const saveBtn = page.locator('#save-response-btn');
    await expect(saveBtn).toBeDisabled();

    // Type some content
    await textarea.fill('This is a test response with enough characters');

    // Save button should be enabled
    await expect(saveBtn).toBeEnabled();
  });

  test('should enable Save Response button when PASTING in textarea', async ({ page }) => {
    await createProject(page, 'Paste Test');

    // Click "Copy Prompt to Clipboard" to enable the textarea
    await page.click('button:has-text("Copy Prompt")');
    await page.waitForTimeout(200);

    // Save button should be disabled initially
    const saveBtn = page.locator('#save-response-btn');
    await expect(saveBtn).toBeDisabled();

    // Focus the textarea and paste content using clipboard
    const textarea = page.locator('#phase-output');
    await textarea.focus();

    // Write to clipboard and paste
    await page.evaluate(() => {
      navigator.clipboard.writeText('This is pasted content that should enable the button');
    });
    await page.keyboard.press('Meta+v'); // Cmd+V on Mac

    // Wait for paste to complete
    await page.waitForTimeout(100);

    // Save button should be enabled after paste
    await expect(saveBtn).toBeEnabled();
  });

  test('should complete Phase 1 and auto-advance to Phase 2', async ({ page }) => {
    await createProject(page, 'Workflow Test');

    // Click "Copy Prompt to Clipboard" to enable the textarea
    await page.click('button:has-text("Copy Prompt")');
    await page.waitForTimeout(200);

    // Fill Phase 1 response with sufficient content (>10 chars minimum)
    const phase1Content = `# PR-FAQ Draft

This is a complete PR-FAQ draft document with all the necessary sections.

## The Problem
Customers face significant challenges...

## The Solution
Our product addresses these challenges by...`;

    await page.locator('#phase-output').fill(phase1Content);

    // Verify save button is enabled before clicking
    const saveBtn = page.locator('#save-response-btn');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Wait for page re-render after save (auto-advance to Phase 2)
    await page.waitForTimeout(500);

    // Should now be on Phase 2 - look for "Phase 2" text anywhere on page
    await expect(page.locator('text=Phase 2')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Critical Review')).toBeVisible();
  });

  test('should copy prompt to clipboard', async ({ page }) => {
    await createProject(page, 'Copy Test Product');
    await page.waitForSelector('button:has-text("Copy Prompt")', { state: 'visible', timeout: 5000 });

    // Click copy prompt
    await page.click('button:has-text("Copy Prompt")');

    // Verify clipboard contains prompt content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('Copy Test Product');
    expect(clipboardText).toContain('Test problem description');
  });
});

