import { initMockMode, setMockMode, isMockMode, getMockResponse } from '../js/ai-mock.js';

describe('AI Mock Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset mock mode
    setMockMode(false);
  });

  describe('initMockMode', () => {
    test('should initialize with false by default', () => {
      const result = initMockMode();
      expect(result).toBe(false);
    });

    test('should read from localStorage if set', () => {
      localStorage.setItem('aiMockMode', 'true');
      const result = initMockMode();
      expect(result).toBe(true);
    });

    test('should show toggle on localhost', () => {
      // Mock the DOM elements
      const mockToggle = { classList: { remove: jest.fn() } };
      const mockCheckbox = { checked: false };
      document.getElementById = jest.fn((id) => {
        if (id === 'aiMockToggle') return mockToggle;
        if (id === 'mockModeCheckbox') return mockCheckbox;
        return null;
      });

      initMockMode();

      expect(mockToggle.classList.remove).toHaveBeenCalledWith('hidden');
    });
  });

  describe('setMockMode', () => {
    test('should enable mock mode', () => {
      setMockMode(true);
      expect(isMockMode()).toBe(true);
    });

    test('should disable mock mode', () => {
      setMockMode(true);
      setMockMode(false);
      expect(isMockMode()).toBe(false);
    });

    test('should persist to localStorage', () => {
      setMockMode(true);
      expect(localStorage.getItem('aiMockMode')).toBe('true');
    });

    test('should update checkbox when set', () => {
      const mockCheckbox = { checked: false };
      document.getElementById = jest.fn(() => mockCheckbox);

      setMockMode(true);

      expect(mockCheckbox.checked).toBe(true);
    });
  });

  describe('isMockMode', () => {
    test('should return false by default', () => {
      expect(isMockMode()).toBe(false);
    });

    test('should return true when enabled', () => {
      setMockMode(true);
      expect(isMockMode()).toBe(true);
    });
  });

  describe('getMockResponse', () => {
    test('should return mock response for phase 1', () => {
      const response = getMockResponse(1);
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response).toContain('Press Release');
    });

    test('should return mock response for phase 2', () => {
      const response = getMockResponse(2);
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response).toContain('Review Feedback');
    });

    test('should return mock response for phase 3', () => {
      const response = getMockResponse(3);
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response).toContain('Final');
    });

    test('should return default message for unknown phase', () => {
      const response = getMockResponse(999);
      expect(response).toContain('not available');
    });

    test('should return default message for invalid phase', () => {
      const response = getMockResponse(0);
      expect(response).toContain('not available');
    });
  });
});
