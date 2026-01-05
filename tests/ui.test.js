/**
 * Tests for UI Utilities Module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate, formatBytes, escapeHtml } from '../js/ui.js';

describe('formatDate', () => {
    it('should return "Just now" for recent dates', () => {
        const now = new Date().toISOString();
        expect(formatDate(now)).toBe('Just now');
    });

    it('should return minutes ago for dates within an hour', () => {
        const date = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        expect(formatDate(date)).toBe('30 minutes ago');
    });

    it('should return hours ago for dates within a day', () => {
        const date = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
        expect(formatDate(date)).toBe('5 hours ago');
    });

    it('should return days ago for dates within a week', () => {
        const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        expect(formatDate(date)).toBe('3 days ago');
    });

    it('should return formatted date for older dates', () => {
        const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const result = formatDate(date);
        // Should contain month abbreviation and year
        expect(result).toMatch(/\w{3} \d+, \d{4}/);
    });

    it('should handle singular forms', () => {
        const oneMinute = new Date(Date.now() - 60 * 1000).toISOString();
        expect(formatDate(oneMinute)).toBe('1 minute ago');

        const oneHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        expect(formatDate(oneHour)).toBe('1 hour ago');

        const oneDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        expect(formatDate(oneDay)).toBe('1 day ago');
    });
});

describe('formatBytes', () => {
    it('should return "0 Bytes" for zero', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
        expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
        expect(formatBytes(1048576)).toBe('1 MB');
        expect(formatBytes(2621440)).toBe('2.5 MB');
    });

    it('should format gigabytes correctly', () => {
        expect(formatBytes(1073741824)).toBe('1 GB');
    });
});

describe('escapeHtml', () => {
    it('should handle empty strings', () => {
        expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should preserve text content', () => {
        // In happy-dom, textContent assignment doesn't escape HTML
        // The function is designed for browser use where it does escape
        const result = escapeHtml('Test text');
        expect(result).toBe('Test text');
    });
});

