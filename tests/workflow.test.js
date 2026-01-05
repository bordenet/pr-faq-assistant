/**
 * Tests for Workflow Module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Workflow, WORKFLOW_CONFIG, getPhaseMetadata, exportFinalDocument } from '../js/workflow.js';

describe('Workflow', () => {
    let project;
    let workflow;

    beforeEach(() => {
        project = {
            id: 'test-123',
            title: 'Test PR-FAQ',
            phase: 1,
            formData: {
                productName: 'TestProduct',
                companyName: 'TestCorp'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        workflow = new Workflow(project);
    });

    describe('constructor', () => {
        it('should initialize with project', () => {
            expect(workflow.project).toBe(project);
            expect(workflow.currentPhase).toBe(1);
        });

        it('should default to phase 1 if not set', () => {
            delete project.phase;
            const w = new Workflow(project);
            expect(w.currentPhase).toBe(1);
        });
    });

    describe('getCurrentPhase', () => {
        it('should return current phase config', () => {
            const phase = workflow.getCurrentPhase();
            expect(phase.number).toBe(1);
            expect(phase.name).toBe('Initial Draft');
        });
    });

    describe('getNextPhase', () => {
        it('should return next phase config', () => {
            const next = workflow.getNextPhase();
            expect(next.number).toBe(2);
            expect(next.name).toBe('Critical Review');
        });

        it('should return null on last phase', () => {
            workflow.currentPhase = 3;
            expect(workflow.getNextPhase()).toBeNull();
        });
    });

    describe('isComplete', () => {
        it('should return false when not complete', () => {
            expect(workflow.isComplete()).toBe(false);
        });

        it('should return true when past last phase', () => {
            workflow.currentPhase = 4;
            expect(workflow.isComplete()).toBe(true);
        });
    });

    describe('advancePhase', () => {
        it('should advance to next phase', () => {
            const result = workflow.advancePhase();
            expect(result).toBe(true);
            expect(workflow.currentPhase).toBe(2);
            expect(project.phase).toBe(2);
        });

        it('should not advance past last phase', () => {
            workflow.currentPhase = 3;
            const result = workflow.advancePhase();
            expect(result).toBe(false);
            expect(workflow.currentPhase).toBe(3);
        });
    });

    describe('previousPhase', () => {
        it('should go back to previous phase', () => {
            workflow.currentPhase = 2;
            const result = workflow.previousPhase();
            expect(result).toBe(true);
            expect(workflow.currentPhase).toBe(1);
        });

        it('should not go before phase 1', () => {
            const result = workflow.previousPhase();
            expect(result).toBe(false);
            expect(workflow.currentPhase).toBe(1);
        });
    });

    describe('generatePrompt', () => {
        it('should generate phase 1 prompt', () => {
            const prompt = workflow.generatePrompt();
            expect(prompt).toContain('TestProduct');
            expect(prompt).toContain('TestCorp');
        });

        it('should generate phase 2 prompt with phase 1 output', () => {
            project.phase1_output = 'Phase 1 content here';
            workflow.currentPhase = 2;
            const prompt = workflow.generatePrompt();
            expect(prompt).toContain('Phase 1 content here');
        });

        it('should generate phase 3 prompt with both outputs', () => {
            project.phase1_output = 'Phase 1 content';
            project.phase2_output = 'Phase 2 review';
            workflow.currentPhase = 3;
            const prompt = workflow.generatePrompt();
            expect(prompt).toContain('Phase 1 content');
            expect(prompt).toContain('Phase 2 review');
        });
    });

    describe('savePhaseOutput', () => {
        it('should save output for current phase', () => {
            workflow.savePhaseOutput('Test output');
            expect(project.phase1_output).toBe('Test output');
        });

        it('should update timestamp', () => {
            // Set an old timestamp
            project.updatedAt = '2020-01-01T00:00:00.000Z';
            workflow.savePhaseOutput('Test output');
            expect(project.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
        });
    });

    describe('getPhaseOutput', () => {
        it('should return phase output', () => {
            project.phase2_output = 'Phase 2 content';
            expect(workflow.getPhaseOutput(2)).toBe('Phase 2 content');
        });

        it('should return empty string if no output', () => {
            expect(workflow.getPhaseOutput(3)).toBe('');
        });
    });

    describe('exportAsMarkdown', () => {
        it('should export phase 3 output if available', () => {
            project.phase3_output = 'Final PR-FAQ document';
            const md = workflow.exportAsMarkdown();
            expect(md).toBe('Final PR-FAQ document');
        });

        it('should fallback to phase 1 if phase 3 not available', () => {
            project.phase1_output = 'Initial draft';
            const md = workflow.exportAsMarkdown();
            expect(md).toBe('Initial draft');
        });
    });

    describe('getProgress', () => {
        it('should calculate progress percentage', () => {
            expect(workflow.getProgress()).toBe(33);
            workflow.currentPhase = 2;
            expect(workflow.getProgress()).toBe(67);
            workflow.currentPhase = 3;
            expect(workflow.getProgress()).toBe(100);
        });
    });
});

describe('getPhaseMetadata', () => {
    it('should return phase metadata', () => {
        const meta = getPhaseMetadata(1);
        expect(meta.name).toBe('Initial Draft');
    });
});

describe('exportFinalDocument', () => {
    it('should export project as markdown', () => {
        const project = {
            title: 'Test',
            phase3_output: 'Final content'
        };
        const md = exportFinalDocument(project);
        expect(md).toBe('Final content');
    });
});

