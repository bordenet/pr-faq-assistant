/**
 * Diff View Module - Visual comparison between PRD phases
 * @module diff-view
 */

/**
 * Simple word-level diff algorithm
 * Returns an array of { type: 'equal'|'insert'|'delete', text: string }
 * @param {string} oldText - Original text
 * @param {string} newText - New text
 * @returns {Array} Diff operations
 */
export function computeWordDiff(oldText, newText) {
  const oldWords = tokenize(oldText);
  const newWords = tokenize(newText);

  // Use longest common subsequence for word-level diff
  const lcs = longestCommonSubsequence(oldWords, newWords);
  const diff = [];

  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (lcsIdx < lcs.length) {
      // Add deletions (words in old but not in LCS)
      while (oldIdx < oldWords.length && oldWords[oldIdx] !== lcs[lcsIdx]) {
        diff.push({ type: 'delete', text: oldWords[oldIdx] });
        oldIdx++;
      }
      // Add insertions (words in new but not in LCS)
      while (newIdx < newWords.length && newWords[newIdx] !== lcs[lcsIdx]) {
        diff.push({ type: 'insert', text: newWords[newIdx] });
        newIdx++;
      }
      // Add equal (LCS match)
      if (oldIdx < oldWords.length && newIdx < newWords.length) {
        diff.push({ type: 'equal', text: oldWords[oldIdx] });
        oldIdx++;
        newIdx++;
        lcsIdx++;
      }
    } else {
      // Remaining deletions
      while (oldIdx < oldWords.length) {
        diff.push({ type: 'delete', text: oldWords[oldIdx] });
        oldIdx++;
      }
      // Remaining insertions
      while (newIdx < newWords.length) {
        diff.push({ type: 'insert', text: newWords[newIdx] });
        newIdx++;
      }
    }
  }

  return diff;
}

/**
 * Tokenize text into words and whitespace
 * @param {string} text - Text to tokenize
 * @returns {Array<string>} Tokens
 */
function tokenize(text) {
  if (!text) return [];
  // Split on word boundaries, keeping whitespace and punctuation
  return text.match(/\S+|\s+/g) || [];
}

/**
 * Find longest common subsequence of two arrays
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} LCS elements
 */
function longestCommonSubsequence(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Render diff as HTML with highlighting
 * @param {Array} diff - Diff operations from computeWordDiff
 * @returns {string} HTML string with highlighted changes
 */
export function renderDiffHtml(diff) {
  return diff.map(item => {
    const escaped = escapeHtml(item.text);
    switch (item.type) {
    case 'delete':
      return `<span class="bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 line-through">${escaped}</span>`;
    case 'insert':
      return `<span class="bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200">${escaped}</span>`;
    default:
      return escaped;
    }
  }).join('');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get diff statistics
 * @param {Array} diff - Diff operations
 * @returns {Object} { additions, deletions, unchanged }
 */
export function getDiffStats(diff) {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  diff.forEach(item => {
    const wordCount = item.text.trim() ? 1 : 0;
    switch (item.type) {
    case 'insert': additions += wordCount; break;
    case 'delete': deletions += wordCount; break;
    default: unchanged += wordCount; break;
    }
  });

  return { additions, deletions, unchanged };
}
