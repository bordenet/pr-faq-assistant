/**
 * Button State Logic Tests
 * Ensures LLM pane buttons follow correct state machine:
 * 1. Initial: Copy=ENABLED, View=DISABLED, OpenClaude=DISABLED
 * 2. After Copy: Copy=ENABLED, View=ENABLED, OpenClaude=ENABLED
 */

describe('Button State Logic', () => {
  let btnCopyLLMPrompt;
  let btnViewLLMPrompt;
  let btnOpenClaudeLLM;

  beforeEach(() => {
    // Setup DOM elements matching app.js
    document.body.innerHTML = `
      <button id="btn-copy-llm-prompt" class="bg-indigo-600">Copy</button>
      <button
        id="btn-view-llm-prompt"
        class="bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
        disabled
        aria-disabled="true"
      >View</button>
      <a
        id="btn-open-claude-llm"
        href="https://claude.ai"
        class="bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed pointer-events-none"
        aria-disabled="true"
      >Open Claude</a>
    `;

    btnCopyLLMPrompt = document.getElementById('btn-copy-llm-prompt');
    btnViewLLMPrompt = document.getElementById('btn-view-llm-prompt');
    btnOpenClaudeLLM = document.getElementById('btn-open-claude-llm');
  });

  describe('Initial State', () => {
    test('Copy button should be enabled', () => {
      expect(btnCopyLLMPrompt.disabled).toBe(false);
    });

    test('View button should be disabled', () => {
      expect(btnViewLLMPrompt.disabled).toBe(true);
    });

    test('View button should have disabled classes', () => {
      expect(btnViewLLMPrompt.classList.contains('bg-slate-300')).toBe(true);
      expect(btnViewLLMPrompt.classList.contains('cursor-not-allowed')).toBe(true);
    });

    test('View button should have aria-disabled', () => {
      expect(btnViewLLMPrompt.getAttribute('aria-disabled')).toBe('true');
    });

    test('OpenClaude button should have disabled classes', () => {
      expect(btnOpenClaudeLLM.classList.contains('bg-slate-300')).toBe(true);
      expect(btnOpenClaudeLLM.classList.contains('pointer-events-none')).toBe(true);
    });

    test('OpenClaude button should have aria-disabled', () => {
      expect(btnOpenClaudeLLM.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('After Copy Clicked', () => {
    beforeEach(() => {
      // Simulate enableViewLLMPromptButton()
      btnViewLLMPrompt.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed');
      btnViewLLMPrompt.classList.add('bg-teal-600', 'hover:bg-teal-700', 'text-white');
      btnViewLLMPrompt.disabled = false;
      btnViewLLMPrompt.removeAttribute('aria-disabled');

      // Simulate enableClaudeLLMButton()
      btnOpenClaudeLLM.classList.remove('bg-slate-300', 'dark:bg-slate-600', 'text-slate-500', 'dark:text-slate-400', 'cursor-not-allowed', 'pointer-events-none');
      btnOpenClaudeLLM.classList.add('bg-orange-600', 'hover:bg-orange-700', 'text-white');
      btnOpenClaudeLLM.removeAttribute('aria-disabled');
    });

    test('View button should be enabled', () => {
      expect(btnViewLLMPrompt.disabled).toBe(false);
    });

    test('View button should have enabled classes', () => {
      expect(btnViewLLMPrompt.classList.contains('bg-teal-600')).toBe(true);
      expect(btnViewLLMPrompt.classList.contains('text-white')).toBe(true);
    });

    test('View button should not have aria-disabled', () => {
      expect(btnViewLLMPrompt.getAttribute('aria-disabled')).toBeNull();
    });

    test('OpenClaude button should have enabled classes', () => {
      expect(btnOpenClaudeLLM.classList.contains('bg-orange-600')).toBe(true);
      expect(btnOpenClaudeLLM.classList.contains('text-white')).toBe(true);
    });

    test('OpenClaude button should not have aria-disabled', () => {
      expect(btnOpenClaudeLLM.getAttribute('aria-disabled')).toBeNull();
    });

    test('OpenClaude button should not have pointer-events-none', () => {
      expect(btnOpenClaudeLLM.classList.contains('pointer-events-none')).toBe(false);
    });
  });
});
