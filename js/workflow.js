/**
 * Workflow Module
 * Manages the 3-phase PR-FAQ generation workflow
 */

import { WORKFLOW_CONFIG, generatePhase1Prompt, generatePhase2Prompt, generatePhase3Prompt } from './prompts.js';

export { WORKFLOW_CONFIG };

export class Workflow {
    constructor(project) {
        this.project = project;
        this.currentPhase = project.phase || 1;
    }

    getCurrentPhase() {
        return WORKFLOW_CONFIG.phases.find(p => p.number === this.currentPhase);
    }

    getNextPhase() {
        if (this.currentPhase >= WORKFLOW_CONFIG.phaseCount) {
            return null;
        }
        return WORKFLOW_CONFIG.phases.find(p => p.number === this.currentPhase + 1);
    }

    isComplete() {
        return this.currentPhase > WORKFLOW_CONFIG.phaseCount;
    }

    advancePhase() {
        if (this.currentPhase < WORKFLOW_CONFIG.phaseCount) {
            this.currentPhase++;
            this.project.phase = this.currentPhase;
            return true;
        }
        return false;
    }

    previousPhase() {
        if (this.currentPhase > 1) {
            this.currentPhase--;
            this.project.phase = this.currentPhase;
            return true;
        }
        return false;
    }

    /**
     * Generate prompt for current phase
     */
    generatePrompt() {
        switch (this.currentPhase) {
        case 1:
            return generatePhase1Prompt(this.project.formData || {});
        case 2:
            return generatePhase2Prompt(this.project.phase1_output || '');
        case 3:
            return generatePhase3Prompt(
                this.project.phase1_output || '',
                this.project.phase2_output || ''
            );
        default:
            return '';
        }
    }

    savePhaseOutput(output) {
        const phaseKey = `phase${this.currentPhase}_output`;
        this.project[phaseKey] = output;
        this.project.updatedAt = new Date().toISOString();
    }

    getPhaseOutput(phaseNumber) {
        const phaseKey = `phase${phaseNumber}_output`;
        return this.project[phaseKey] || '';
    }

    /**
     * Export final PR-FAQ as Markdown (validator-compatible format)
     */
    exportAsMarkdown() {
        // For PR-FAQ, we export only the final phase 3 output
        // which should be the polished, validator-ready document
        const finalOutput = this.getPhaseOutput(3);

        if (finalOutput) {
            return finalOutput;
        }

        // Fallback: export phase 1 output if phase 3 not complete
        const phase1Output = this.getPhaseOutput(1);
        if (phase1Output) {
            return phase1Output;
        }

        return `# ${this.project.title}\n\nNo PR-FAQ content generated yet.`;
    }

    getProgress() {
        return Math.round((this.currentPhase / WORKFLOW_CONFIG.phaseCount) * 100);
    }
}

export function getPhaseMetadata(phaseNumber) {
    return WORKFLOW_CONFIG.phases.find(p => p.number === phaseNumber);
}

export function exportFinalDocument(project) {
    const workflow = new Workflow(project);
    return workflow.exportAsMarkdown();
}

