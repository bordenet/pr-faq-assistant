/**
 * Tests for document-specific-templates.js module
 *
 * Tests the PR-FAQ template definitions and retrieval functions.
 */

import { DOCUMENT_TEMPLATES, getTemplate, getAllTemplates } from '../../shared/js/document-specific-templates.js';

describe('DOCUMENT_TEMPLATES', () => {
  test('should have 5 templates defined', () => {
    expect(Object.keys(DOCUMENT_TEMPLATES)).toHaveLength(5);
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

  test('should have fundingRound template', () => {
    expect(DOCUMENT_TEMPLATES.fundingRound).toBeDefined();
    expect(DOCUMENT_TEMPLATES.fundingRound.id).toBe('fundingRound');
    expect(DOCUMENT_TEMPLATES.fundingRound.name).toBe('Funding Round');
    expect(DOCUMENT_TEMPLATES.fundingRound.icon).toBe('💵');
  });

  test('should have companyMilestone template', () => {
    expect(DOCUMENT_TEMPLATES.companyMilestone).toBeDefined();
    expect(DOCUMENT_TEMPLATES.companyMilestone.id).toBe('companyMilestone');
    expect(DOCUMENT_TEMPLATES.companyMilestone.name).toBe('Company Milestone');
    expect(DOCUMENT_TEMPLATES.companyMilestone.icon).toBe('🎉');
  });

  test('should have crisisResponse template', () => {
    expect(DOCUMENT_TEMPLATES.crisisResponse).toBeDefined();
    expect(DOCUMENT_TEMPLATES.crisisResponse.id).toBe('crisisResponse');
    expect(DOCUMENT_TEMPLATES.crisisResponse.name).toBe('Crisis Response');
    expect(DOCUMENT_TEMPLATES.crisisResponse.icon).toBe('🚨');
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

  test('should return fundingRound template', () => {
    const template = getTemplate('fundingRound');
    expect(template.name).toBe('Funding Round');
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
    expect(templates).toHaveLength(5);
  });

  test('should include all template objects', () => {
    const templates = getAllTemplates();
    const ids = templates.map(t => t.id);
    expect(ids).toContain('blank');
    expect(ids).toContain('productLaunch');
    expect(ids).toContain('fundingRound');
    expect(ids).toContain('companyMilestone');
    expect(ids).toContain('crisisResponse');
  });

  test('each template should have name and icon', () => {
    const templates = getAllTemplates();
    templates.forEach(template => {
      expect(template.name).toBeDefined();
      expect(template.icon).toBeDefined();
    });
  });
});

