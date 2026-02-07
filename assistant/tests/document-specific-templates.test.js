/**
 * Tests for document-specific-templates.js module
 *
 * Tests the PR-FAQ template presets and retrieval functions.
 *
 * NOTE: All PR-FAQs follow the same canonical Amazon structure (Press Release + FAQ).
 * These are PRESETS that differ in who the "customer" is and FAQ emphasis:
 * - Blank: Start from scratch
 * - Customer Product: External customers (the canonical PR-FAQ use case)
 * - Internal Platform: Internal teams as customers (dev tools, platforms)
 * - Process Initiative: Operational/process improvements
 *
 * Based on authentic Amazon "Working Backwards" methodology per Bryar & Carr,
 * SVPG, Commoncog, and ex-Amazonian sources.
 */

import { DOCUMENT_TEMPLATES, getTemplate, getAllTemplates } from '../../shared/js/document-specific-templates.js';

describe('DOCUMENT_TEMPLATES', () => {
  test('should have 4 presets defined', () => {
    expect(Object.keys(DOCUMENT_TEMPLATES)).toHaveLength(4);
  });

  test('should have blank preset', () => {
    expect(DOCUMENT_TEMPLATES.blank).toBeDefined();
    expect(DOCUMENT_TEMPLATES.blank.id).toBe('blank');
    expect(DOCUMENT_TEMPLATES.blank.name).toBe('Blank');
    expect(DOCUMENT_TEMPLATES.blank.productName).toBe('');
    expect(DOCUMENT_TEMPLATES.blank.companyName).toBe('');
  });

  test('should have productLaunch preset (Customer Product)', () => {
    expect(DOCUMENT_TEMPLATES.productLaunch).toBeDefined();
    expect(DOCUMENT_TEMPLATES.productLaunch.id).toBe('productLaunch');
    expect(DOCUMENT_TEMPLATES.productLaunch.name).toBe('Customer Product');
    expect(DOCUMENT_TEMPLATES.productLaunch.icon).toBe('🆕');
    expect(DOCUMENT_TEMPLATES.productLaunch.description).toContain('external customers');
  });

  test('should have internalPlatform preset', () => {
    expect(DOCUMENT_TEMPLATES.internalPlatform).toBeDefined();
    expect(DOCUMENT_TEMPLATES.internalPlatform.id).toBe('internalPlatform');
    expect(DOCUMENT_TEMPLATES.internalPlatform.name).toBe('Internal Platform');
    expect(DOCUMENT_TEMPLATES.internalPlatform.icon).toBe('🔧');
    expect(DOCUMENT_TEMPLATES.internalPlatform.targetCustomer).toContain('Internal teams');
  });

  test('should have processImprovement preset', () => {
    expect(DOCUMENT_TEMPLATES.processImprovement).toBeDefined();
    expect(DOCUMENT_TEMPLATES.processImprovement.id).toBe('processImprovement');
    expect(DOCUMENT_TEMPLATES.processImprovement.name).toBe('Process Initiative');
    expect(DOCUMENT_TEMPLATES.processImprovement.icon).toBe('⚙️');
    expect(DOCUMENT_TEMPLATES.processImprovement.targetCustomer).toContain('Affected teams');
  });

  test('all presets should have required fields', () => {
    const requiredFields = ['id', 'name', 'icon', 'description', 'productName', 'companyName', 'targetCustomer', 'problem', 'solution', 'benefits', 'metrics', 'location'];

    Object.values(DOCUMENT_TEMPLATES).forEach(template => {
      requiredFields.forEach(field => {
        expect(template[field]).toBeDefined();
        expect(typeof template[field]).toBe('string');
      });
    });
  });

  test('non-blank presets should have meaningful placeholder content', () => {
    const nonBlankPresets = ['productLaunch', 'internalPlatform', 'processImprovement'];

    nonBlankPresets.forEach(presetId => {
      const preset = DOCUMENT_TEMPLATES[presetId];
      expect(preset.problem.length).toBeGreaterThan(20);
      expect(preset.solution.length).toBeGreaterThan(20);
      expect(preset.benefits.length).toBeGreaterThan(20);
    });
  });
});

describe('getTemplate', () => {
  test('should return preset by ID', () => {
    const template = getTemplate('blank');
    expect(template).toBe(DOCUMENT_TEMPLATES.blank);
  });

  test('should return productLaunch preset', () => {
    const template = getTemplate('productLaunch');
    expect(template.name).toBe('Customer Product');
  });

  test('should return internalPlatform preset', () => {
    const template = getTemplate('internalPlatform');
    expect(template.name).toBe('Internal Platform');
  });

  test('should return processImprovement preset', () => {
    const template = getTemplate('processImprovement');
    expect(template.name).toBe('Process Initiative');
  });

  test('should return null for invalid ID', () => {
    expect(getTemplate('nonexistent')).toBeNull();
    expect(getTemplate('')).toBeNull();
    expect(getTemplate(null)).toBeNull();
  });

  test('should return null for undefined', () => {
    expect(getTemplate(undefined)).toBeNull();
  });
});

describe('getAllTemplates', () => {
  test('should return array of all presets', () => {
    const templates = getAllTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates).toHaveLength(4);
  });

  test('should include all preset objects', () => {
    const templates = getAllTemplates();
    const ids = templates.map(t => t.id);
    expect(ids).toContain('blank');
    expect(ids).toContain('productLaunch');
    expect(ids).toContain('internalPlatform');
    expect(ids).toContain('processImprovement');
  });

  test('each preset should have name and icon', () => {
    const templates = getAllTemplates();
    templates.forEach(template => {
      expect(template.name).toBeDefined();
      expect(template.icon).toBeDefined();
    });
  });
});

