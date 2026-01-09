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
        const attribution = '\n\n---\n\n*Generated with [PR-FAQ Assistant](https://bordenet.github.io/pr-faq-assistant/)*';

        it('should export phase 3 output with attribution if available', () => {
            project.phase3_output = 'Final PR-FAQ document';
            const md = workflow.exportAsMarkdown();
            expect(md).toBe('Final PR-FAQ document' + attribution);
        });

        it('should fallback to phase 1 with attribution if phase 3 not available', () => {
            project.phase1_output = 'Initial draft';
            const md = workflow.exportAsMarkdown();
            expect(md).toBe('Initial draft' + attribution);
        });

        it('should include link to PR-FAQ Assistant in attribution', () => {
            project.phase3_output = 'Some content';
            const md = workflow.exportAsMarkdown();
            expect(md).toContain('https://bordenet.github.io/pr-faq-assistant/');
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
    it('should export project as markdown with attribution', () => {
        const project = {
            title: 'Test',
            phase3_output: 'Final content'
        };
        const md = exportFinalDocument(project);
        expect(md).toContain('Final content');
        expect(md).toContain('https://bordenet.github.io/pr-faq-assistant/');
    });
});

describe('Edit Input Flow (Phase 1 without response)', () => {
    let project;
    let workflow;

    beforeEach(() => {
        project = {
            id: 'edit-test-123',
            title: 'Editable PR-FAQ',
            phase: 1,
            formData: {
                productName: 'OriginalProduct',
                companyName: 'OriginalCorp',
                targetCustomer: 'Original customers',
                problem: 'Original problem',
                solution: 'Original solution',
                benefits: 'Original benefits',
                metrics: '',
                location: 'Seattle, WA'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        workflow = new Workflow(project);
    });

    it('should allow editing formData when on Phase 1 with no output', () => {
        // Verify no phase 1 output exists
        expect(workflow.getPhaseOutput(1)).toBe('');
        expect(workflow.currentPhase).toBe(1);

        // Simulate editing formData (what happens when edit form is saved)
        project.formData.productName = 'UpdatedProduct';
        project.formData.problem = 'Updated problem statement';
        project.title = project.formData.productName;
        project.updatedAt = new Date().toISOString();

        // Verify the edit was applied
        expect(project.formData.productName).toBe('UpdatedProduct');
        expect(project.title).toBe('UpdatedProduct');
        expect(project.formData.problem).toBe('Updated problem statement');
    });

    it('should generate prompt with updated formData after edit', () => {
        // Update formData
        project.formData.productName = 'NewProduct';
        project.formData.companyName = 'NewCorp';

        // Generate prompt should use updated data
        const prompt = workflow.generatePrompt();
        expect(prompt).toContain('NewProduct');
        expect(prompt).toContain('NewCorp');
        expect(prompt).not.toContain('OriginalProduct');
    });

    it('should preserve formData structure after multiple edits', () => {
        const requiredFields = ['productName', 'companyName', 'targetCustomer', 'problem', 'solution', 'benefits'];

        // First edit
        project.formData.productName = 'Edit1';
        requiredFields.forEach(field => {
            expect(project.formData[field]).toBeDefined();
        });

        // Second edit
        project.formData.problem = 'Edit2 problem';
        project.formData.solution = 'Edit2 solution';
        requiredFields.forEach(field => {
            expect(project.formData[field]).toBeDefined();
        });
    });

    it('should NOT allow returning to edit once Phase 1 output exists', () => {
        // Save Phase 1 output
        workflow.savePhaseOutput('AI generated PR-FAQ draft');

        // Now there is output, editing should be blocked in UI
        // (This test documents the expected behavior)
        expect(workflow.getPhaseOutput(1)).toBe('AI generated PR-FAQ draft');
        expect(workflow.currentPhase).toBe(1);

        // The UI will hide the Edit button when output exists
        // Here we just verify the condition is detectable
        const hasOutput = workflow.getPhaseOutput(workflow.currentPhase);
        expect(hasOutput).toBeTruthy();
    });

    it('should maintain project integrity when editing and then proceeding', () => {
        // Edit formData
        project.formData.productName = 'FinalProduct';
        project.title = 'FinalProduct';

        // Generate and save Phase 1 output
        const prompt = workflow.generatePrompt();
        expect(prompt).toContain('FinalProduct');

        workflow.savePhaseOutput('AI response based on FinalProduct');
        expect(project.phase1_output).toBe('AI response based on FinalProduct');

        // Advance to Phase 2
        workflow.advancePhase();
        expect(workflow.currentPhase).toBe(2);

        // FormData should still be intact
        expect(project.formData.productName).toBe('FinalProduct');
    });
});

