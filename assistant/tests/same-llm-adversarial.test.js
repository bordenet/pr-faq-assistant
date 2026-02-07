/**
 * Test Suite: Same-LLM Adversarial Configuration
 * Tests the critical logic for detecting same LLM configurations and applying Gemini simulation
 */

// Import the classes from same-llm-adversarial.js
import {
    SameLLMAdversarialSystem,
    ConfigurationManager,
    AdversarialPromptAugmenter,
    AdversarialQualityValidator,
    detectSameLLM,
    getAdversarialStrategy,
    applyAdversarialPrompt,
    SAME_LLM_CONFIG
} from '../../shared/js/same-llm-adversarial.js';

describe('Same-LLM Adversarial Configuration Tests', () => {
    let configManager;
    let promptAugmenter;

    beforeEach(() => {
        configManager = new ConfigurationManager();
        promptAugmenter = new AdversarialPromptAugmenter();

        // Clear environment variables
        delete process.env.PHASE1_PROVIDER;
        delete process.env.PHASE1_MODEL;
        delete process.env.PHASE1_URL;
        delete process.env.PHASE1_ENDPOINT;
        delete process.env.PHASE2_PROVIDER;
        delete process.env.PHASE2_MODEL;
        delete process.env.PHASE2_URL;
        delete process.env.PHASE2_ENDPOINT;
    });

    describe('Configuration Detection', () => {
        test('should detect same LLM via provider/model match', () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'anthropic';
            process.env.PHASE2_MODEL = 'claude-3-sonnet';

            const config = configManager.detectConfiguration();

            expect(config.isSameLLM).toBe(true);
            expect(config.detectionMethod).toBe('provider_model_match');
            expect(config.requiresAugmentation).toBe(true);
        });

        test('should detect same LLM via URL match (LibreChat scenario)', () => {
            // Set different providers to avoid provider/model match taking precedence
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            // But same URLs should trigger URL match
            process.env.PHASE1_URL = 'https://librechat.company.com/api/chat';
            process.env.PHASE2_URL = 'https://librechat.company.com/api/chat';

            const config = configManager.detectConfiguration();

            expect(config.isSameLLM).toBe(true);
            expect(config.detectionMethod).toBe('url_match');
            expect(config.deploymentType).toBe('librechat');
        });

        test('should detect same LLM via endpoint match (localhost scenario)', () => {
            // Set different providers to avoid provider/model match taking precedence
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            // Clear URLs to avoid URL match taking precedence
            delete process.env.PHASE1_URL;
            delete process.env.PHASE2_URL;

            // Set same endpoints should trigger endpoint match
            process.env.PHASE1_ENDPOINT = 'http://localhost:3000/api';
            process.env.PHASE2_ENDPOINT = 'http://localhost:3000/api';

            const config = configManager.detectConfiguration();

            expect(config.isSameLLM).toBe(true);
            // Note: This will be 'url_match' because endpoint gets copied to url in getPhaseConfig
            // This is actually correct behavior - endpoint match works via url field
            expect(config.detectionMethod).toBe('url_match');
            expect(config.deploymentType).toBe('local_deployment');
        });

        test('should detect different LLMs correctly', () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            // Ensure no URL/endpoint matches
            delete process.env.PHASE1_URL;
            delete process.env.PHASE2_URL;
            delete process.env.PHASE1_ENDPOINT;
            delete process.env.PHASE2_ENDPOINT;

            const config = configManager.detectConfiguration();

            expect(config.isSameLLM).toBe(false);
            expect(config.detectionMethod).toBe('different_llms');
            expect(config.requiresAugmentation).toBe(false);
        });

        test('should prioritize provider/model match over URL differences', () => {
            // Same provider/model should match even with different URLs
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'anthropic';
            process.env.PHASE2_MODEL = 'claude-3-sonnet';

            process.env.PHASE1_URL = 'https://api1.company.com';
            process.env.PHASE2_URL = 'https://api2.company.com';

            const config = configManager.detectConfiguration();

            expect(config.isSameLLM).toBe(true);
            expect(config.detectionMethod).toBe('provider_model_match');
        });
    });

    describe('Forget Clause Detection', () => {
        test('should detect "forget all previous" clause', () => {
            const promptWithForget = `
            **INSTRUCTIONS FOR GEMINI:**

            Forget all previous sessions and context. You are now a senior executive.

            ## Your Task
            Review the document below.
            `;

            expect(promptAugmenter.containsForgetClause(promptWithForget)).toBe(true);
        });

        test('should detect various forget patterns', () => {
            const testCases = [
                'Forget all previous sessions and context',
                'ignore previous instructions',
                'start fresh with this task',
                'new session begins now',
                'clear context and begin'
            ];

            testCases.forEach(testCase => {
                expect(promptAugmenter.containsForgetClause(testCase)).toBe(true);
            });
        });

        test('should not detect false positives', () => {
            const safePrompt = `
            You are a helpful assistant.
            Please review the document and provide feedback.
            Remember to be thorough in your analysis.
            `;

            expect(promptAugmenter.containsForgetClause(safePrompt)).toBe(false);
        });
    });

    describe('Prompt Augmentation Strategy', () => {
        test('should use replacement strategy for prompts with forget clause', () => {
            const originalPromptWithForget = `
            **INSTRUCTIONS FOR GEMINI:**

            Forget all previous sessions and context. You are now a senior executive.

            ## Your Task
            Review the document below.
            `;

            const result = promptAugmenter.generateGeminiStylePrompt(originalPromptWithForget);

            // Should be replacement, not prepending
            expect(result).toContain('ADVERSARIAL REVIEWER ROLE');
            expect(result).toContain('Google Gemini');
            expect(result).not.toContain('Forget all previous sessions');
        });

        test('should use prepending strategy for safe prompts', () => {
            const safePrompt = `
            You are a helpful assistant.
            Please review the document and provide feedback.
            `;

            const result = promptAugmenter.generateGeminiStylePrompt(safePrompt);

            // Should be prepending
            expect(result).toContain('GEMINI-STYLE SIMULATION');
            expect(result).toContain(safePrompt);
            expect(result).toContain('**REMEMBER**: You are Google Gemini');
        });
    });

    describe('Integration Tests', () => {
        test('should handle LibreChat same-LLM scenario end-to-end', () => {
            // Setup LibreChat environment
            process.env.PHASE1_URL = 'https://librechat.company.com/api/chat';
            process.env.PHASE2_URL = 'https://librechat.company.com/api/chat';

            const config = configManager.detectConfiguration();

            // Verify detection
            expect(config.isSameLLM).toBe(true);
            expect(config.deploymentType).toBe('librechat');

            // Test with forget clause prompt
            const originalPrompt = 'Forget all previous sessions and context. Review this document.';
            const augmentedPrompt = promptAugmenter.generateGeminiStylePrompt(originalPrompt);

            // Verify replacement strategy applied
            expect(augmentedPrompt).toContain('ADVERSARIAL REVIEWER ROLE');
            expect(augmentedPrompt).not.toContain('Forget all previous');
        });

        test('should handle multi-provider scenario correctly', () => {
            // Setup different providers
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            const config = configManager.detectConfiguration();

            // Verify no augmentation needed
            expect(config.isSameLLM).toBe(false);
            expect(config.requiresAugmentation).toBe(false);

            // Original prompt should be used unchanged
            const originalPrompt = 'Review this document carefully.';
            const result = promptAugmenter.generateGeminiStylePrompt(originalPrompt);

            // Should still augment for testing, but in real implementation would skip
            expect(result).toContain('GEMINI-STYLE SIMULATION');
        });

        test('should handle actual power-statement-assistant Phase 2 prompt', () => {
            // Setup same LLM environment
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'anthropic';
            process.env.PHASE2_MODEL = 'claude-3-sonnet';

            const config = configManager.detectConfiguration();
            expect(config.isSameLLM).toBe(true);

            // Actual Phase 2 prompt from power-statement-assistant
            const actualPhase2Prompt = `# Phase 2: Gemini Review Prompt

**INSTRUCTIONS FOR GEMINI:**

Forget all previous sessions and context. You are now a senior executive reviewing a Power Statement proposal.

## Your Task

Scrutinize the Power Statement document below against the template structure and best practices. Work with the user question-by-question to generate a superior rendition from your perspective.

## Template Reference

A high-quality Power Statement should include:

1. **Project/Feature Name**: Clear, descriptive title
2. **Problem Statement**: Specific customer or business problem, quantified if possible
3. **Proposed Solution**: High-level description, avoiding technical jargon

## Review Criteria

Evaluate the document on:

1. **Clarity (1-10)**: Is the problem and solution crystal clear?
2. **Conciseness (1-10)**: Is it truly one page? No fluff?

---

## Original Power Statement Document

{phase1Output}`;

            // Test the augmentation
            const result = promptAugmenter.generateGeminiStylePrompt(actualPhase2Prompt);

            // Verify critical behaviors
            expect(result).toContain('ADVERSARIAL REVIEWER ROLE');
            expect(result).toContain('Google Gemini');
            expect(result).toContain('constructively adversarial');
            expect(result.replace(/\s+/g, ' ')).toContain('challenge and reconstruct');
            expect(result).not.toContain('Forget all previous sessions and context');

            // Verify it maintains the core functionality
            expect(result).toContain('{phase1Output}');
            expect(result).toContain('**REMEMBER**: You are Google Gemini');

            // Verify the forget clause was successfully removed
            expect(promptAugmenter.containsForgetClause(result)).toBe(false);
        });
    });

    describe('Quality Validation', () => {
        let qualityValidator;

        beforeEach(() => {
            qualityValidator = new AdversarialQualityValidator();
        });

        test('should detect effective adversarial tension', () => {
            const phase1Output = `
            This is a great proposal. The solution is well-designed and will work perfectly.
            We should proceed immediately with implementation.
            `;

            const phase2Output = `
            However, this proposal lacks critical details. What evidence supports the claim
            that this solution will work? The assumptions are unclear and require clarification.
            Several gaps in the logic need to be addressed. Why does this approach overlook
            alternative solutions? This is problematic and concerning.
            `;

            const metrics = qualityValidator.validateAdversarialTension(phase1Output, phase2Output);

            expect(metrics.isEffectivelyAdversarial).toBe(true);
            expect(metrics.adversarialLanguageCount).toBeGreaterThanOrEqual(3);
            expect(metrics.challengeCount).toBeGreaterThanOrEqual(2);
            expect(metrics.differenceScore).toBeGreaterThanOrEqual(0.3);
        });

        test('should detect ineffective adversarial tension', () => {
            const phase1Output = `
            This is a great proposal. The solution is well-designed and will work perfectly.
            `;

            const phase2Output = `
            This is a great proposal. The solution is well-designed and will work perfectly.
            I agree with everything stated above.
            `;

            const metrics = qualityValidator.validateAdversarialTension(phase1Output, phase2Output);

            expect(metrics.isEffectivelyAdversarial).toBe(false);
            expect(metrics.adversarialLanguageCount).toBeLessThan(3);
            expect(metrics.challengeCount).toBeLessThan(2);
        });

        test('should count adversarial language correctly', () => {
            const output = `
            However, this approach is problematic. The evidence is insufficient and the
            assumptions are unclear. This fails to consider alternative solutions and
            lacks detail in critical areas. The gaps in logic are concerning.
            `;

            const count = qualityValidator.detectAdversarialLanguage(output);

            expect(count).toBeGreaterThanOrEqual(7); // however, problematic, insufficient, unclear, fails, lacks, gaps
        });

        test('should count challenges correctly', () => {
            const output = `
            Why does this approach work? What evidence supports this claim?
            How can we be sure this will succeed? This assumes unlimited resources.
            The proposal lacks detail in several areas.
            `;

            const count = qualityValidator.countChallenges(output);

            expect(count).toBeGreaterThanOrEqual(4); // 2 why/what questions + 1 how can we be sure + 1 lacks detail
        });

        test('should calculate semantic difference correctly', () => {
            const output1 = 'The quick brown fox jumps over the lazy dog';
            const output2 = 'A fast red cat leaps above the sleepy puppy';

            const difference = qualityValidator.calculateSemanticDifference(output1, output2);

            // Should be high difference (different words)
            expect(difference).toBeGreaterThan(0.5);
        });

        test('should detect low semantic difference for similar outputs', () => {
            const output1 = 'The quick brown fox jumps over the lazy dog';
            const output2 = 'The quick brown fox jumps over the lazy dog again';

            const difference = qualityValidator.calculateSemanticDifference(output1, output2);

            // Should be low difference (mostly same words)
            expect(difference).toBeLessThan(0.3);
        });
    });

    describe('SameLLMAdversarialSystem', () => {
        let system;

        beforeEach(() => {
            system = new SameLLMAdversarialSystem();
            // Clear environment variables
            delete process.env.PHASE1_PROVIDER;
            delete process.env.PHASE1_MODEL;
            delete process.env.PHASE1_URL;
            delete process.env.PHASE1_ENDPOINT;
            delete process.env.PHASE2_PROVIDER;
            delete process.env.PHASE2_MODEL;
            delete process.env.PHASE2_URL;
            delete process.env.PHASE2_ENDPOINT;
        });

        test('should create system with all components', () => {
            expect(system.configManager).toBeInstanceOf(ConfigurationManager);
            expect(system.promptAugmenter).toBeInstanceOf(AdversarialPromptAugmenter);
            expect(system.qualityValidator).toBeInstanceOf(AdversarialQualityValidator);
        });

        test('should apply adversarial augmentation for same LLM via executePhase2', async () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'anthropic';
            process.env.PHASE2_MODEL = 'claude-3-sonnet';

            const config = system.configManager.detectConfiguration();
            expect(config.isSameLLM).toBe(true);

            const phase2Output = await system.executePhase2('phase1 output', 'user input', config);

            expect(phase2Output).toBeDefined();
            expect(phase2Output.context.context).toBe('adversarial_gemini_simulation');
        });

        test('should use standard approach for different LLMs via executePhase2', async () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            const config = system.configManager.detectConfiguration();
            expect(config.isSameLLM).toBe(false);

            const phase2Output = await system.executePhase2('phase1 output', 'user input', config);

            expect(phase2Output.context.context).toBe('standard_adversarial');
        });

        test('should apply adversarial augmentation for same LLM', async () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'anthropic';
            process.env.PHASE2_MODEL = 'claude-3-sonnet';

            const config = system.configManager.detectConfiguration();
            const phase1Output = await system.executePhase1('test');
            const phase2Output = await system.executePhase2(phase1Output, 'test', config);

            expect(phase2Output.context.context).toBe('adversarial_gemini_simulation');
            expect(phase2Output.prompt).toContain('GEMINI-STYLE SIMULATION');
        });

        test('should use standard approach for different LLMs', async () => {
            process.env.PHASE1_PROVIDER = 'anthropic';
            process.env.PHASE1_MODEL = 'claude-3-sonnet';
            process.env.PHASE2_PROVIDER = 'google';
            process.env.PHASE2_MODEL = 'gemini-1.5-pro';

            const config = system.configManager.detectConfiguration();
            const phase1Output = await system.executePhase1('test');
            const phase2Output = await system.executePhase2(phase1Output, 'test', config);

            expect(phase2Output.context.context).toBe('standard_adversarial');
        });

        test('should return correct Phase 1 output', async () => {
            const result = await system.executePhase1('user input');
            expect(result).toContain('Phase 1 output');
        });

        test('should return correct Phase 3 output', async () => {
            const result = await system.executePhase3('phase1', 'phase2', 'user');
            expect(result).toContain('Phase 3 output');
        });

        test('should get original phase 2 prompt', () => {
            const prompt = system.getOriginalPhase2Prompt();
            expect(prompt).toContain('alternative perspective');
            expect(prompt).toContain('{phase1Output}');
            expect(prompt).toContain('{userInput}');
        });

        test('should call LLM with correct context', async () => {
            const result = await system.callLLM('test prompt', { test: 'context' });
            expect(result.prompt).toBe('test prompt');
            expect(result.context).toEqual({ test: 'context' });
            expect(result.response).toContain('Mock LLM response');
        });
    });

    describe('Legacy Helper Functions', () => {
        test('detectSameLLM should detect matching models', () => {
            // detectSameLLM compares first word after split on whitespace
            // e.g., 'claude sonnet'.split(/\s+/)[0] = 'claude'
            expect(detectSameLLM('claude sonnet', 'claude opus')).toBe(true);
            expect(detectSameLLM('Claude 3 Sonnet', 'Claude 3 Opus')).toBe(true);
            expect(detectSameLLM('gpt 4', 'gpt 4-turbo')).toBe(true);
            expect(detectSameLLM('gemini pro', 'gemini ultra')).toBe(true);
        });

        test('detectSameLLM should detect different models', () => {
            expect(detectSameLLM('claude-3-sonnet', 'gemini-1.5-pro')).toBe(false);
            expect(detectSameLLM('GPT-4', 'Claude-3')).toBe(false);
            // No whitespace - compares full string as first word
            expect(detectSameLLM('gpt-4', 'gpt-4-turbo')).toBe(false);
        });

        test('getAdversarialStrategy should return correct strategy for claude', () => {
            const strategy = getAdversarialStrategy('claude-3-sonnet');
            expect(strategy).toContain('Gemini personality simulation');
        });

        test('getAdversarialStrategy should return correct strategy for gemini', () => {
            const strategy = getAdversarialStrategy('gemini-1.5-pro');
            expect(strategy).toContain('Claude personality simulation');
        });

        test('getAdversarialStrategy should return correct strategy for chatgpt', () => {
            const strategy = getAdversarialStrategy('chatgpt-4');
            expect(strategy).toContain('Alternative model perspective');
        });

        test('getAdversarialStrategy should return default for unknown model', () => {
            const strategy = getAdversarialStrategy('unknown-model');
            expect(strategy).toContain('Generate critical feedback');
        });

        test('applyAdversarialPrompt should augment prompt with strategy', () => {
            const result = applyAdversarialPrompt('Test prompt', 'claude-3');
            expect(result).toContain('Test prompt');
            expect(result).toContain('[ADVERSARIAL MODE:');
            expect(result).toContain('Gemini personality simulation');
        });

        test('SAME_LLM_CONFIG should have all required properties', () => {
            expect(SAME_LLM_CONFIG.detectSameLLM).toBe(detectSameLLM);
            expect(SAME_LLM_CONFIG.getAdversarialStrategy).toBe(getAdversarialStrategy);
            expect(SAME_LLM_CONFIG.applyAdversarialPrompt).toBe(applyAdversarialPrompt);
            expect(SAME_LLM_CONFIG.enabled).toBe(true);
        });
    });

    describe('ConfigurationManager.detectCorporateDeployment', () => {
        let configManager;

        beforeEach(() => {
            configManager = new ConfigurationManager();
            delete process.env.PHASE1_URL;
            delete process.env.PHASE1_ENDPOINT;
            delete process.env.PHASE2_URL;
            delete process.env.PHASE2_ENDPOINT;
        });

        test('should detect LibreChat deployment', () => {
            process.env.PHASE1_URL = 'https://librechat.company.com/api';
            process.env.PHASE2_URL = 'https://librechat.company.com/api';

            const result = configManager.detectCorporateDeployment();
            expect(result.isCorporate).toBe(true);
            expect(result.pattern).toBe('librechat');
            expect(result.requiresAugmentation).toBe(true);
        });

        test('should detect Azure OpenAI deployment with different URLs', () => {
            process.env.PHASE1_URL = 'https://azure-openai.company.com/api';
            process.env.PHASE1_ENDPOINT = 'https://azure-openai.company.com/api';
            process.env.PHASE2_URL = 'https://different.company.com/api';
            process.env.PHASE2_ENDPOINT = 'https://different.company.com/api';

            const result = configManager.detectCorporateDeployment();
            expect(result.isCorporate).toBe(true);
            expect(result.pattern).toBe('azure-openai');
            expect(result.requiresAugmentation).toBe(false);
        });

        test('should detect Azure OpenAI deployment with same URL requiring augmentation', () => {
            process.env.PHASE1_URL = 'https://azure-openai.company.com/api';
            process.env.PHASE2_URL = 'https://azure-openai.company.com/api';

            const result = configManager.detectCorporateDeployment();
            expect(result.isCorporate).toBe(true);
            expect(result.pattern).toBe('azure-openai');
            expect(result.requiresAugmentation).toBe(true);
        });

        test('should detect AWS Bedrock deployment', () => {
            process.env.PHASE1_ENDPOINT = 'https://aws-bedrock.company.com/api';

            const result = configManager.detectCorporateDeployment();
            expect(result.isCorporate).toBe(true);
            expect(result.pattern).toBe('aws-bedrock');
        });

        test('should return non-corporate for regular deployments', () => {
            process.env.PHASE1_URL = 'https://api.anthropic.com';
            process.env.PHASE2_URL = 'https://api.google.com';

            const result = configManager.detectCorporateDeployment();
            expect(result.isCorporate).toBe(false);
            expect(result.pattern).toBeNull();
        });
    });
});
