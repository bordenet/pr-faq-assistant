/**
 * Tests for validator/js/prompts.js
 * Tests prompt generation functions for LLM-based PR/FAQ scoring
 */

import { describe, test, expect } from '@jest/globals';
import {
  generateLLMScoringPrompt,
  generateCritiquePrompt,
  generateRewritePrompt,
  cleanAIResponse
} from '../js/prompts.js';

describe('prompts.js', () => {
  const sampleContent = `# New Product Launch: Customer Analytics Dashboard
## Press Release
Today we announce the launch of our Customer Analytics Dashboard, enabling businesses to understand customer behavior in real-time.
## FAQ
**Q: What problem does this solve?**
A: Businesses struggle to understand customer behavior patterns.
**Q: How is this different from existing solutions?**
A: Our solution provides real-time insights with AI-powered recommendations.`;

  describe('generateLLMScoringPrompt', () => {
    test('should generate a prompt containing the content', () => {
      const prompt = generateLLMScoringPrompt(sampleContent);
      expect(prompt).toContain(sampleContent);
    });

    test('should include scoring calibration sections', () => {
      const prompt = generateLLMScoringPrompt(sampleContent);
      expect(prompt).toContain('SCORING CALIBRATION');
    });

    test('should include calibration guidance', () => {
      const prompt = generateLLMScoringPrompt(sampleContent);
      expect(prompt).toContain('CALIBRATION');
    });
  });

  describe('generateCritiquePrompt', () => {
    const mockResult = {
      totalScore: 65,
      pressRelease: { score: 18, issues: ['Missing customer quote'] },
      faqs: { score: 20, issues: [] }
    };

    test('should generate a prompt containing the content', () => {
      const prompt = generateCritiquePrompt(sampleContent, mockResult);
      expect(prompt).toContain(sampleContent);
    });

    test('should include current validation results', () => {
      const prompt = generateCritiquePrompt(sampleContent, mockResult);
      expect(prompt).toContain('65');
    });

    test('should handle missing result fields gracefully', () => {
      const minimalResult = { totalScore: 50 };
      const prompt = generateCritiquePrompt(sampleContent, minimalResult);
      expect(prompt).toContain('50');
    });
  });

  describe('generateRewritePrompt', () => {
    const mockResult = { totalScore: 45 };

    test('should generate a prompt containing the content', () => {
      const prompt = generateRewritePrompt(sampleContent, mockResult);
      expect(prompt).toContain(sampleContent);
    });

    test('should include current score', () => {
      const prompt = generateRewritePrompt(sampleContent, mockResult);
      expect(prompt).toContain('45');
    });

    test('should accept optional targetDimension parameter', () => {
      const prompt = generateRewritePrompt(sampleContent, mockResult, { name: 'Press Release', score: 15, maxScore: 30 });
      expect(prompt).toBeDefined();
    });
  });

  describe('cleanAIResponse', () => {
    test('should remove common AI preambles', () => {
      const response = "Sure, here's the rewrite. Some content";
      const cleaned = cleanAIResponse(response);
      expect(cleaned).not.toContain("Sure, here's");
    });

    test('should extract content from markdown code blocks', () => {
      const response = '```markdown\nExtracted content\n```';
      expect(cleanAIResponse(response)).toBe('Extracted content');
    });

    test('should handle code blocks without language specifier', () => {
      const response = '```\nExtracted content\n```';
      expect(cleanAIResponse(response)).toBe('Extracted content');
    });

    test('should trim whitespace', () => {
      const response = '  Some content with spaces  ';
      expect(cleanAIResponse(response)).toBe('Some content with spaces');
    });

    test('should handle responses without prefixes or code blocks', () => {
      const response = 'Plain response text';
      expect(cleanAIResponse(response)).toBe('Plain response text');
    });
  });
});

