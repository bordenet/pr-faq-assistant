import {
  getErrorMessage,
  handleStorageError,
  handleValidationError,
  ERROR_MESSAGES
} from '../../shared/js/error-handler.js';

describe('Error Handler Module', () => {
  test('should have predefined error messages', () => {
    expect(ERROR_MESSAGES.QUOTA_EXCEEDED).toBeTruthy();
    expect(ERROR_MESSAGES.DB_NOT_FOUND).toBeTruthy();
    expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeTruthy();
  });

  test('should get error message by code', () => {
    const msg = getErrorMessage('QUOTA_EXCEEDED');
    expect(msg.title).toBe('Storage Full');
    expect(msg.recoveryHint).toBeTruthy();
  });

  test('should get error message from Error object', () => {
    const error = new Error('QuotaExceededError');
    const msg = getErrorMessage(error);
    expect(msg.title).toBe('Storage Full');
  });

  test('should return unknown error for unrecognized errors', () => {
    const error = new Error('SomeRandomError');
    const msg = getErrorMessage(error);
    expect(msg.title).toBe('Something Went Wrong');
  });

  test('should handle storage errors with toast', () => {
    const mockToast = jest.fn();
    const error = new Error('QuotaExceededError');

    const result = handleStorageError(error, mockToast, 'Test');

    expect(mockToast).toHaveBeenCalled();
    expect(result.title).toBe('Storage Full');
  });

  test('should handle validation errors', () => {
    const mockToast = jest.fn();
    const errors = ['Title is required', 'Context is required'];

    const result = handleValidationError(errors, mockToast);

    expect(mockToast).toHaveBeenCalled();
    expect(result.errors).toEqual(errors);
  });

  test('should handle single validation error string', () => {
    const mockToast = jest.fn();

    const result = handleValidationError('Title is required', mockToast);

    expect(mockToast).toHaveBeenCalled();
    expect(result.errors[0]).toBe('Title is required');
  });

  test('should work without toast function', () => {
    const error = new Error('Test error');
    const result = handleStorageError(error, null);
    expect(result).toBeTruthy();
    expect(result.title).toBe('Something Went Wrong');
  });

  test('should detect quota errors', () => {
    const msg = getErrorMessage(new Error('QuotaExceededError'));
    expect(msg.title).toBe('Storage Full');
  });

  test('should detect not found errors', () => {
    const msg = getErrorMessage(new Error('NOT FOUND'));
    expect(msg.title).toBe('Database Error');
  });

  test('should detect corruption errors', () => {
    const msg = getErrorMessage(new Error('Data CORRUPT'));
    expect(msg.title).toBe('Data Error');
  });

  test('should detect validation errors', () => {
    const msg = getErrorMessage(new Error('VALIDATION failed'));
    expect(msg.title).toBe('Missing Information');
  });
});
