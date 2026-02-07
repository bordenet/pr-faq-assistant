/**
 * Tests for document-specific-templates.js module
 *
 * Tests the PR-FAQ template definitions and retrieval functions.
 *
 * NOTE: PR-FAQ templates are limited to authentic Amazon-style PR-FAQ use cases:
 * - Blank: Start from scratch
 * - Product Launch: The classic PR-FAQ use case for new products/features
 */

import { DOCUMENT_TEMPLATES, getTemplate, getAllTemplates } from '../../shared/js/document-specific-templates.js';

describe('DOCUMENT_TEMPLATES', () => {
  test('should have 2 templates defined (Blank + Product Launch)', () => {
    expect(Object.keys(DOCUMENT_TEMPLATES)).toHaveLength(2);
  });

  test('should have blank template', () => {
    expect(DOCUMENT_TEMPLATES.blank).toBeDefined();
    expect(DOCUMENT_TEMPLATES.blank.id).toBe('blank');
    expect(DOCUMENT_TEMPLATES.blank.name).toBe('Blank');
    expect(DOCUMENT_TEMPLATES.blank.productName).toBe('');
    expect(DOCUMENT_TEMPLATES.blank.companyName).toBe('');
  });

  test('should have productLaunch template', () => {
    expect(DOCUMENT_TEMPLATES.productLaunch).toBeDefined();
    expect(DOCUMENT_TEMPLATES.productLaunch.id).toBe('productLaunch');
    expect(DOCUMENT_TEMPLATES.productLaunch.name).toBe('Product Launch');
    expect(DOCUMENT_TEMPLATES.productLaunch.icon).toBe('🆕');
  });

  test('all templates should have required fields', () => {
    const requiredFields = ['id', 'name', 'icon', 'description', 'productName', 'companyName', 'targetCustomer', 'problem', 'solution', 'benefits', 'metrics', 'location'];

    Object.values(DOCUMENT_TEMPLATES).forEach(template => {
      requiredFields.forEach(field => {
        expect(template[field]).toBeDefined();
        expect(typeof template[field]).toBe('string');
      });
    });
  });
});

describe('getTemplate', () => {
  test('should return template by ID', () => {
    const template = getTemplate('blank');
    expect(template).toBe(DOCUMENT_TEMPLATES.blank);
  });

  test('should return productLaunch template', () => {
    const template = getTemplate('productLaunch');
    expect(template.name).toBe('Product Launch');
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
  test('should return array of all templates', () => {
    const templates = getAllTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates).toHaveLength(2);
  });

  test('should include all template objects', () => {
    const templates = getAllTemplates();
    const ids = templates.map(t => t.id);
    expect(ids).toContain('blank');
    expect(ids).toContain('productLaunch');
  });

  test('each template should have name and icon', () => {
    const templates = getAllTemplates();
    templates.forEach(template => {
      expect(template.name).toBeDefined();
      expect(template.icon).toBeDefined();
    });
  });
});

