/**
 * Workflow module for Assistant Core
 * Generic 3-phase workflow engine for genesis-tools assistants
 * @module workflow
 */

/**
 * Create a workflow configuration
 * @param {Object} options - Workflow configuration options
 * @param {Array<Object>} options.phases - Array of phase definitions
 * @param {string} [options.name] - Workflow name
 * @returns {Object} Workflow configuration object
 */
export function createWorkflowConfig(options) {
  const { phases, name = 'Workflow' } = options;

  if (!phases || !Array.isArray(phases) || phases.length === 0) {
    throw new Error('Workflow requires at least one phase');
  }

  return {
    name,
    phases: phases.map((phase, index) => ({
      number: index + 1,
      name: phase.name || `Phase ${index + 1}`,
      description: phase.description || '',
      ai: phase.ai !== undefined ? phase.ai : true,
      type: phase.type || 'ai',
      ...phase
    })),
    phaseCount: phases.length
  };
}

/**
 * Create a workflow instance for a project
 * @param {Object} project - Project object with phase/currentPhase property
 * @param {Object} config - Workflow configuration (from createWorkflowConfig)
 * @returns {Object} Workflow instance with methods for phase management
 */
export function createWorkflow(project, config) {
  // Clamp phase to valid range (1 minimum)
  const rawPhase = project.phase || project.currentPhase || 1;
  let currentPhase = Math.max(1, Math.min(rawPhase, config.phaseCount + 1));

  /**
   * Get current phase configuration
   * @returns {Object|undefined} Current phase config
   */
  function getCurrentPhase() {
    if (currentPhase > config.phaseCount) {
      return config.phases[config.phaseCount - 1];
    }
    return config.phases.find(p => p.number === currentPhase);
  }

  /**
   * Get next phase configuration
   * @returns {Object|null} Next phase config or null if at end
   */
  function getNextPhase() {
    if (currentPhase >= config.phaseCount) {
      return null;
    }
    return config.phases.find(p => p.number === currentPhase + 1);
  }

  /**
   * Get previous phase configuration
   * @returns {Object|null} Previous phase config or null if at beginning
   */
  function getPreviousPhase() {
    if (currentPhase <= 1) {
      return null;
    }
    return config.phases.find(p => p.number === currentPhase - 1);
  }

  /**
   * Check if workflow is complete
   * @returns {boolean} True if all phases complete
   */
  function isComplete() {
    return currentPhase > config.phaseCount;
  }

  /**
   * Check if current phase has output
   * @returns {boolean} True if current phase has output
   */
  function isPhaseComplete() {
    const output = getPhaseOutput(currentPhase);
    return Boolean(output && output.trim().length > 0);
  }

  /**
   * Check if can advance to next phase
   * @returns {boolean} True if can advance
   */
  function canAdvance() {
    return isPhaseComplete() && currentPhase <= config.phaseCount;
  }

  /**
   * Advance to next phase
   * @returns {boolean} True if advanced, false if already at end
   */
  function advancePhase() {
    if (currentPhase <= config.phaseCount) {
      currentPhase++;
      project.phase = currentPhase;
      project.currentPhase = currentPhase;
      return true;
    }
    return false;
  }

  /**
   * Go back to previous phase
   * @returns {boolean} True if went back, false if at beginning
   */
  function previousPhase() {
    if (currentPhase > 1) {
      currentPhase--;
      project.phase = currentPhase;
      project.currentPhase = currentPhase;
      return true;
    }
    return false;
  }

  /**
   * Save output for current phase
   * @param {string} output - Phase output content
   */
  function savePhaseOutput(output) {
    const phaseKey = `phase${currentPhase}_output`;
    project[phaseKey] = output;
    project.updatedAt = new Date().toISOString();
    project.modified = Date.now();
  }

  /**
   * Get output for a specific phase
   * @param {number} phaseNumber - Phase number (1-based)
   * @returns {string} Phase output or empty string
   */
  function getPhaseOutput(phaseNumber) {
    // Flat format (canonical)
    const flatKey = `phase${phaseNumber}_output`;
    if (project[flatKey]) {
      return project[flatKey];
    }
    // Legacy nested format
    if (project.phases) {
      if (Array.isArray(project.phases) && project.phases[phaseNumber - 1]) {
        return project.phases[phaseNumber - 1].response || '';
      }
      if (project.phases[phaseNumber] && typeof project.phases[phaseNumber] === 'object') {
        return project.phases[phaseNumber].response || '';
      }
    }
    return '';
  }

  /**
   * Get workflow progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  function getProgress() {
    const completedPhases = Math.min(currentPhase - 1, config.phaseCount);
    return Math.round((completedPhases / config.phaseCount) * 100);
  }

  // Return public API
  return {
    getCurrentPhase,
    getNextPhase,
    getPreviousPhase,
    isComplete,
    isPhaseComplete,
    canAdvance,
    advancePhase,
    previousPhase,
    savePhaseOutput,
    getPhaseOutput,
    getProgress,
    get currentPhaseNumber() { return currentPhase; },
    get phases() { return config.phases; },
    get phaseCount() { return config.phaseCount; }
  };
}

/**
 * Detect if text appears to be a prompt rather than an AI response.
 * Simple check: all prompts start with "# Phase N:" header.
 * @param {string} text - The text to check
 * @returns {{ isPrompt: boolean, reason: string }} Detection result
 */
export function detectPromptPaste(text) {
  if (!text || typeof text !== 'string') {
    return { isPrompt: false, reason: '' };
  }

  const trimmed = text.trim();

  // Check if text starts with "# Phase N:" header (standard prompt format)
  if (/^#\s*phase\s*\d+/im.test(trimmed)) {
    return {
      isPrompt: true,
      reason: 'This looks like the prompt you copied, not the AI response. Please paste the AI\'s answer instead.'
    };
  }

  return { isPrompt: false, reason: '' };
}
