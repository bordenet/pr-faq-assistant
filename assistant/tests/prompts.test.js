/**
 * Tests for PR-FAQ Prompts Module
 * Validates prompt generation for validator compatibility
 */

import { jest } from '@jest/globals';
import {
  WORKFLOW_CONFIG,
  generatePhase1Prompt,
  generatePhase2Prompt,
  generatePhase3Prompt,
  getPhaseMetadata
} from '../../shared/js/prompts.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock fetch to load files from disk in test environment
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    const filePath = join(process.cwd(), url);
    try {
      const content = readFileSync(filePath, 'utf-8');
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content)
      });
    } catch {
      return Promise.resolve({
        ok: false,
        text: () => Promise.resolve('')
      });
    }
  });
});

describe('WORKFLOW_CONFIG', () => {
    it('should have 3 phases', () => {
        expect(WORKFLOW_CONFIG.phaseCount).toBe(3);
        expect(WORKFLOW_CONFIG.phases).toHaveLength(3);
    });

    it('should have correct phase names', () => {
        expect(WORKFLOW_CONFIG.phases[0].name).toBe('Initial Draft');
        expect(WORKFLOW_CONFIG.phases[1].name).toBe('Critical Review');
        expect(WORKFLOW_CONFIG.phases[2].name).toBe('Final Polish');
    });

    it('should have sequential phase numbers', () => {
        WORKFLOW_CONFIG.phases.forEach((phase, index) => {
            expect(phase.number).toBe(index + 1);
        });
    });

    it('should have icons for each phase', () => {
        expect(WORKFLOW_CONFIG.phases[0].icon).toBe('📝');
        expect(WORKFLOW_CONFIG.phases[1].icon).toBe('🔍');
        expect(WORKFLOW_CONFIG.phases[2].icon).toBe('✨');
    });

    it('should have AI model names for each phase', () => {
        expect(WORKFLOW_CONFIG.phases[0].aiModel).toBe('Claude');
        expect(WORKFLOW_CONFIG.phases[1].aiModel).toBe('Gemini');
        expect(WORKFLOW_CONFIG.phases[2].aiModel).toBe('Claude');
    });

    it('should have descriptions for each phase', () => {
        WORKFLOW_CONFIG.phases.forEach(phase => {
            expect(phase.description).toBeDefined();
            expect(phase.description.length).toBeGreaterThan(10);
        });
    });
});

describe('generatePhase1Prompt', () => {
  const sampleFormData = {
    productName: 'DataSync Pro',
    companyName: 'AcmeCorp',
    targetCustomer: 'Enterprise IT teams',
    problem: 'Data migration takes too long',
    solution: 'Automated sync with ML optimization',
    benefits: 'Faster migrations, less downtime',
    metrics: '75% faster, $1M savings',
    location: 'Seattle, WA'
  };

  it('should include product name in prompt', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    expect(prompt).toContain('DataSync Pro');
  });

  it('should include company name in prompt', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    expect(prompt).toContain('AcmeCorp');
  });

  it('should include validator requirements', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    expect(prompt).toContain('8-15 words');
    expect(prompt).toContain('Dateline');
    expect(prompt).toContain('WHO');
    expect(prompt).toContain('WHAT');
    expect(prompt).toContain('WHEN');
    expect(prompt).toContain('WHERE');
    expect(prompt).toContain('WHY');
  });

  it('should warn against fluff words', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    expect(prompt).toContain('revolutionary');
    expect(prompt).toContain('groundbreaking');
    expect(prompt).toContain('BANNED WORDS');
  });

  it('should require customer quotes with metrics', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    expect(prompt).toContain('quantitative metric');
    expect(prompt).toContain('TWO quotes'); // Changed from 3-4 per adversarial review
  });

  it('should include a future release date', async () => {
    const prompt = await generatePhase1Prompt(sampleFormData);
    // Should contain a date format like "Month Day, Year"
    expect(prompt).toMatch(/\w+ \d+, \d{4}/);
  });
});

describe('generatePhase2Prompt', () => {
  const samplePhase1Output = `
# AcmeCorp Launches DataSync Pro

Seattle, WA — January 5, 2026 — AcmeCorp today announced DataSync Pro...
  `;

  it('should include phase 1 output', async () => {
    const prompt = await generatePhase2Prompt(samplePhase1Output);
    expect(prompt).toContain('DataSync Pro');
  });

  it('should include scoring criteria checklist', async () => {
    const prompt = await generatePhase2Prompt(samplePhase1Output);
    expect(prompt).toContain('Structure & Hook');
    expect(prompt).toContain('Content Quality');
    expect(prompt).toContain('Professional Tone');
    expect(prompt).toContain('Customer Evidence');
  });

  it('should request a revised PR-FAQ', async () => {
    const prompt = await generatePhase2Prompt(samplePhase1Output);
    expect(prompt).toContain('REVISED PR-FAQ');
    expect(prompt).toContain('copy-paste ready');
  });
});

describe('generatePhase3Prompt', () => {
  const phase1Output = 'Original PR-FAQ content...';
  const phase2Output = 'Critical review feedback...';

  it('should include both phase outputs', async () => {
    const prompt = await generatePhase3Prompt(phase1Output, phase2Output);
    expect(prompt).toContain('Original PR-FAQ content');
    expect(prompt).toContain('Critical review feedback');
  });

  it('should include verification rubric', async () => {
    const prompt = await generatePhase3Prompt(phase1Output, phase2Output);
    expect(prompt).toContain('Verify Against Rubric');
    expect(prompt).toContain('Headline');
    expect(prompt).toContain('Dateline');
  });

  it('should request final document only', async () => {
    const prompt = await generatePhase3Prompt(phase1Output, phase2Output);
    expect(prompt).toContain('Copy-Paste Ready Output'); // Updated per adversarial review
    expect(prompt).toContain('No commentary');
  });
});

describe('getPhaseMetadata', () => {
  it('should return correct metadata for phase 1', () => {
    const meta = getPhaseMetadata(1);
    expect(meta.name).toBe('Initial Draft');
    expect(meta.number).toBe(1);
  });

  it('should return correct metadata for phase 2', () => {
    const meta = getPhaseMetadata(2);
    expect(meta.name).toBe('Critical Review');
  });

  it('should return correct metadata for phase 3', () => {
    const meta = getPhaseMetadata(3);
    expect(meta.name).toBe('Final Polish');
  });

  it('should return undefined for invalid phase', () => {
    const meta = getPhaseMetadata(99);
    expect(meta).toBeUndefined();
  });
});
