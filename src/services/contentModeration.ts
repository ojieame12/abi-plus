// Content Moderation Service
// Checks user-generated content for profanity, hate speech, and policy violations

/**
 * Result of a content moderation check
 */
export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  severity: 'none' | 'low' | 'medium' | 'high';
  flaggedTerms: string[];
}

/**
 * Blocked word patterns - includes profanity, slurs, hate speech
 * Using regex patterns for flexibility
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; severity: 'low' | 'medium' | 'high'; category: string }> = [
  // Profanity - common expletives (medium severity)
  { pattern: /\b(fuck|shit|damn|ass|bitch|crap|piss)\w*/gi, severity: 'medium', category: 'profanity' },
  { pattern: /\bf+u+c+k+/gi, severity: 'medium', category: 'profanity' },
  { pattern: /\bs+h+i+t+/gi, severity: 'medium', category: 'profanity' },

  // Hate speech / slurs (high severity)
  { pattern: /\b(nigger|nigga|faggot|retard|spic|chink|kike)\w*/gi, severity: 'high', category: 'hate_speech' },

  // Personal attacks (low severity)
  { pattern: /\b(idiot|stupid|moron|dumb|loser)\b/gi, severity: 'low', category: 'personal_attack' },

  // Threats (high severity)
  { pattern: /\b(kill|murder|attack|harm|hurt)\s+(you|them|him|her)\b/gi, severity: 'high', category: 'threat' },

  // Spam patterns (low severity)
  { pattern: /(.)\1{5,}/gi, severity: 'low', category: 'spam' }, // Repeated characters
];

/**
 * Allowed business terms that might be false positives
 * These override blocked patterns when in business context
 */
const BUSINESS_ALLOWLIST = [
  'assess', 'assessment', 'class', 'classification', 'mass', 'massive',
  'pass', 'passing', 'bass', 'grass', 'brass', 'asset', 'assets',
  'assumption', 'assume', 'assuming',
];

/**
 * Check if text contains any blocked patterns
 * @param text - The text to check
 * @returns ModerationResult with flagged status and details
 */
export function checkProfanity(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return {
      flagged: false,
      reason: null,
      severity: 'none',
      flaggedTerms: [],
    };
  }

  const normalizedText = text.toLowerCase();
  const flaggedTerms: string[] = [];
  let highestSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';
  let flagReason: string | null = null;

  // Check each pattern
  for (const { pattern, severity, category } of BLOCKED_PATTERNS) {
    const matches = normalizedText.match(pattern);

    if (matches) {
      // Filter out allowlisted business terms
      const actualViolations = matches.filter(match => {
        const cleanMatch = match.toLowerCase().trim();
        return !BUSINESS_ALLOWLIST.some(allowed =>
          cleanMatch === allowed || cleanMatch.includes(allowed)
        );
      });

      if (actualViolations.length > 0) {
        flaggedTerms.push(...actualViolations);

        // Track highest severity
        const severityOrder = { none: 0, low: 1, medium: 2, high: 3 };
        if (severityOrder[severity] > severityOrder[highestSeverity]) {
          highestSeverity = severity;
          flagReason = getCategoryMessage(category);
        }
      }
    }
  }

  return {
    flagged: flaggedTerms.length > 0,
    reason: flagReason,
    severity: highestSeverity,
    flaggedTerms: [...new Set(flaggedTerms)], // Dedupe
  };
}

/**
 * Get user-friendly message for violation category
 */
function getCategoryMessage(category: string): string {
  switch (category) {
    case 'profanity':
      return 'Please remove inappropriate language.';
    case 'hate_speech':
      return 'Content contains offensive or discriminatory language.';
    case 'personal_attack':
      return 'Please keep the discussion respectful and professional.';
    case 'threat':
      return 'Content contains threatening language.';
    case 'spam':
      return 'Content appears to contain spam patterns.';
    default:
      return 'Content violates community guidelines.';
  }
}

/**
 * Check both title and body for a question post
 * Returns combined result
 */
export function checkQuestionContent(title: string, body: string): ModerationResult {
  const titleResult = checkProfanity(title);
  const bodyResult = checkProfanity(body);

  // Combine results, taking highest severity
  const severityOrder = { none: 0, low: 1, medium: 2, high: 3 };
  const combinedSeverity = severityOrder[titleResult.severity] >= severityOrder[bodyResult.severity]
    ? titleResult.severity
    : bodyResult.severity;

  const flagged = titleResult.flagged || bodyResult.flagged;
  const flaggedTerms = [...new Set([...titleResult.flaggedTerms, ...bodyResult.flaggedTerms])];

  // Prefer more specific reason
  const reason = titleResult.reason || bodyResult.reason;

  return {
    flagged,
    reason: flagged ? (reason || 'Content violates community guidelines.') : null,
    severity: combinedSeverity,
    flaggedTerms,
  };
}

/**
 * Sanitize text by removing/masking flagged content
 * Useful for preview or partial display
 */
export function sanitizeText(text: string): string {
  let sanitized = text;

  for (const { pattern } of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Mask with asterisks, keeping first and last character
      if (match.length <= 2) return '*'.repeat(match.length);
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }

  return sanitized;
}

export default {
  checkProfanity,
  checkQuestionContent,
  sanitizeText,
};
