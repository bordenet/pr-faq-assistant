/**
 * AI Slop Detection Patterns
 * Pattern arrays for detecting AI-generated content
 * @module slop-patterns
 */

/**
 * Generic boosters - intensifiers that add no meaning
 * Delete or replace with specific metrics
 */
export const GENERIC_BOOSTERS = [
  'incredibly', 'extremely', 'highly', 'very', 'truly', 'absolutely',
  'definitely', 'really', 'quite', 'remarkably', 'exceptionally',
  'particularly', 'especially', 'significantly', 'substantially',
  'considerably', 'dramatically', 'tremendously', 'immensely', 'profoundly',
  // Classic AI markers
  'delve', 'tapestry', 'multifaceted', 'myriad', 'plethora'
];

/**
 * Buzzwords - replace with plain language or specific descriptions
 * Includes PRD-specific vague qualifiers for backwards compatibility
 */
export const BUZZWORDS = [
  // Classic AI buzzwords
  'robust', 'seamless', 'comprehensive', 'elegant', 'powerful',
  'flexible', 'intuitive', 'user-friendly', 'streamlined', 'optimized',
  'efficient', 'scalable', 'reliable', 'secure', 'modern',
  'innovative', 'sophisticated', 'advanced', 'state-of-the-art',
  'best-in-class', 'world-class', 'enterprise-ready', 'production-grade',
  'battle-tested', 'industry-leading', 'game-changing', 'revolutionary',
  'transformative', 'disruptive', 'cutting-edge', 'next-generation',
  'bleeding-edge', 'groundbreaking', 'paradigm-shifting',
  // Verb-form buzzwords
  'synergy', 'holistic', 'ecosystem', 'leverage', 'utilize',
  'facilitate', 'enable', 'empower', 'optimize', 'accelerate',
  'amplify', 'unlock', 'drive', 'spearhead', 'champion',
  'pivot', 'actionable',
  // PRD-specific vague qualifiers (legacy compatibility)
  'easy to use', 'fast', 'quick', 'responsive', 'good performance',
  'high quality', 'optimal', 'minimal', 'sufficient', 'reasonable',
  'appropriate', 'adequate'
];

/**
 * Filler phrases - delete entirely, add no meaning
 */
export const FILLER_PHRASES = [
  'it\'s important to note that', 'it\'s worth mentioning that',
  'it should be noted that', 'it goes without saying that',
  'needless to say', 'as you may know', 'as we all know',
  'in today\'s world', 'in today\'s digital age',
  'in today\'s fast-paced environment', 'in the modern era',
  'at the end of the day', 'when all is said and done',
  'having said that', 'that said', 'that being said',
  'with that in mind', 'with that being said',
  'let me explain', 'let me walk you through',
  'let\'s dive in', 'let\'s explore', 'let\'s take a look at',
  'let\'s break this down', 'here\'s the thing', 'the thing is',
  'the fact of the matter is', 'at this point in time',
  'in order to', 'due to the fact that', 'for the purpose of',
  'in the event that', 'in light of', 'with regard to',
  'in terms of', 'on a daily basis', 'first and foremost',
  'last but not least', 'each and every', 'one and only',
  'plain and simple', 'pure and simple'
];

/**
 * Hedge patterns - weasel words that avoid commitment
 */
export const HEDGE_PATTERNS = [
  'of course', 'naturally', 'obviously', 'clearly', 'certainly',
  'undoubtedly', 'in many ways', 'to some extent', 'in some cases',
  'it depends', 'it varies', 'generally speaking', 'for the most part',
  'more or less', 'kind of', 'sort of', 'somewhat', 'relatively',
  'arguably', 'potentially', 'possibly', 'might',
  'may or may not', 'could potentially', 'tends to',
  'seems to', 'appears to'
];

/**
 * Sycophantic phrases - should never appear in PRDs
 */
export const SYCOPHANTIC_PHRASES = [
  'great question', 'excellent question', 'that\'s a great point',
  'good thinking', 'i love that idea', 'what a fascinating topic',
  'happy to help', 'i\'d be happy to help', 'i\'m glad you asked',
  'thanks for asking', 'absolutely!', 'definitely!', 'of course!',
  'sure thing', 'no problem', 'you\'re welcome', 'my pleasure',
  'i appreciate you sharing', 'that\'s an interesting perspective',
  'i understand your concern'
];

/**
 * Transitional filler - overused transitions that pad word count
 */
export const TRANSITIONAL_FILLER = [
  'furthermore', 'moreover', 'additionally', 'in addition',
  'nevertheless', 'nonetheless', 'on the other hand', 'conversely',
  'in contrast', 'similarly', 'likewise', 'consequently',
  'therefore', 'thus', 'hence', 'accordingly', 'as a result',
  'for this reason', 'to that end', 'with this in mind',
  'given the above', 'based on the above', 'as mentioned earlier',
  'as previously stated', 'as noted above', 'moving forward',
  'going forward'
];

/**
 * Patterns for detecting formulaic document structure
 */
export const STRUCTURAL_PATTERNS = {
  // Formulaic introductions
  formulaicIntro: /^(in today's|in this (document|section|prd|spec)|this (document|prd|spec) (will|aims|seeks))/im,

  // Over-signposting
  overSignposting: [
    'in this section, we will',
    'as mentioned earlier',
    'let\'s now turn to',
    'before we proceed',
    'as discussed above',
    'we will now explore'
  ],

  // Template section progression
  templateSections: /overview.{0,500}key points.{0,500}(best practices|conclusion)/is,

  // Symmetric coverage (balanced to a fault)
  symmetricCoverage: /(on one hand|on the other hand|pros and cons|advantages and disadvantages|both.*have (merit|value))/gi
};

