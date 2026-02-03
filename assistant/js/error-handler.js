/**
 * Error Handler Module
 * @module error-handler
 * Provides user-friendly error messages and recovery hints
 * @module error-handler
 */

const ERROR_MESSAGES = {
  // IndexedDB errors
  QUOTA_EXCEEDED: {
    title: 'Storage Full',
    message: 'Your browser storage is full. Try deleting unused projects or clearing browser data.',
    recoveryHint: 'Delete some projects to free up space'
  },
  DB_NOT_FOUND: {
    title: 'Database Error',
    message: 'Could not access the local database. Your data may not be saved.',
    recoveryHint: 'Try refreshing the page or clearing browser cache'
  },
  DB_CORRUPTED: {
    title: 'Data Error',
    message: 'The data appears to be corrupted. Some information may be lost.',
    recoveryHint: 'Try importing a recent backup if available'
  },

  // Form errors
  VALIDATION_ERROR: {
    title: 'Missing Information',
    message: 'Please fill in all required fields before proceeding.',
    recoveryHint: 'Check that title and context are not empty'
  },
  INVALID_FORMAT: {
    title: 'Invalid Format',
    message: 'The imported data format is not recognized.',
    recoveryHint: 'Make sure you\'re importing a previously exported file'
  },

  // Export errors
  EXPORT_FAILED: {
    title: 'Export Failed',
    message: 'Could not generate the export file. Please try again.',
    recoveryHint: 'Check that your browser allows file downloads'
  },
  IMPORT_FAILED: {
    title: 'Import Failed',
    message: 'Could not read the imported file.',
    recoveryHint: 'Ensure the file is a valid JSON export from this tool'
  },

  // Generic errors
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Your work may not be saved.',
    recoveryHint: 'Refresh the page and try again'
  }
};

/**
 * Get user-friendly error message
 * @module error-handler
 * @param {Error|string} error - Error object or error code
 * @returns {object} Error message with title, message, and recovery hint
 */
function getErrorMessage(error) {
  if (typeof error === 'string' && ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error];
  }

  const errorStr = error?.message?.toUpperCase() || '';

  // Check for specific error types
  if (errorStr.includes('QUOTA')) {
    return ERROR_MESSAGES.QUOTA_EXCEEDED;
  }
  if (errorStr.includes('NOT FOUND') || errorStr.includes('NO SUCH TABLE')) {
    return ERROR_MESSAGES.DB_NOT_FOUND;
  }
  if (errorStr.includes('CORRUPT')) {
    return ERROR_MESSAGES.DB_CORRUPTED;
  }
  if (errorStr.includes('VALIDATION')) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Handle storage errors with user-friendly messages
 * @module error-handler
 * @param {Error} error - The error to handle
 * @param {Function} showToast - Toast notification function
 * @param {string} context - Context for console logging
 */
function handleStorageError(error, showToast, context = 'Storage Operation') {
  console.error(`${context} Error:`, error);

  const errorInfo = getErrorMessage(error);
  const message = `${errorInfo.message} (${errorInfo.recoveryHint})`;

  if (showToast && typeof showToast === 'function') {
    showToast(message, 'error');
  }

  return errorInfo;
}

/**
 * Handle validation errors with user-friendly messages
 * @module error-handler
 * @param {Array|string} errors - Validation errors (array of strings or single string)
 * @param {Function} showToast - Toast notification function
 */
function handleValidationError(errors, showToast) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  const message = errorArray.join('\n');

  if (showToast && typeof showToast === 'function') {
    showToast(message, 'error');
  }

  return {
    title: 'Validation Error',
    message,
    errors: errorArray
  };
}

export {
  getErrorMessage,
  handleStorageError,
  handleValidationError,
  ERROR_MESSAGES
};
