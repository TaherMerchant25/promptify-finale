/**
 * Fuzzy Matching and Keyword-Based Scoring Utilities
 * Score Scale: 0-5
 */

/**
 * Normalize text for comparison (lowercase, remove extra whitespace)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Extract keywords from a phrase (removes common stop words)
 */
function extractKeywords(phrase: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'and', 'but', 'if', 'or', 'because', 'until', 'while', 'it', 'its',
    'i', 'me', 'my', 'you', 'your', 'he', 'she', 'they', 'them', 'this', 'that'
  ]);

  const words = normalizeText(phrase)
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));

  return [...new Set(words)]; // Remove duplicates
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate fuzzy similarity between two strings (0-1)
 */
function fuzzySimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLen);
}

/**
 * Check if target phrase appears exactly in the generated text
 */
export function containsExactPhrase(targetPhrase: string, generatedText: string): boolean {
  const normalizedTarget = normalizeText(targetPhrase);
  const normalizedGenerated = normalizeText(generatedText);
  return normalizedGenerated.includes(normalizedTarget);
}

/**
 * Check if prompt contains ordered subset of target phrase words
 */
function containsOrderedSubset(prompt: string, target: string): boolean {
  const promptWords = normalizeText(prompt).split(/\s+/);
  const targetWords = normalizeText(target).split(/\s+/);
  
  // Check if target words appear in order in the prompt
  let targetIndex = 0;
  for (const promptWord of promptWords) {
    if (targetIndex < targetWords.length && promptWord === targetWords[targetIndex]) {
      targetIndex++;
    }
  }
  
  // If we found 50% or more of target words in order, flag it
  const orderedMatchRatio = targetIndex / targetWords.length;
  return orderedMatchRatio >= 0.5;
}

/**
 * Check if the user's prompt is the exact target phrase (cheating detection)
 */
export function isExactPrompt(userPrompt: string, targetPhrase: string): boolean {
  const normalizedPrompt = normalizeText(userPrompt);
  const normalizedTarget = normalizeText(targetPhrase);
  
  // Check for exact match
  if (normalizedPrompt === normalizedTarget) return true;
  
  // Check if prompt contains the exact phrase
  if (normalizedPrompt.includes(normalizedTarget)) return true;
  
  // Check for ordered subset (e.g., "the cage is" from "the cage is out of the lion")
  if (containsOrderedSubset(userPrompt, targetPhrase)) return true;
  
  // Check for very high similarity (user trying to sneak in the phrase)
  const similarity = fuzzySimilarity(normalizedPrompt, normalizedTarget);
  if (similarity > 0.85) return true;
  
  return false;
}

/**
 * Find how many keywords from the target appear in the generated text
 */
function findMatchingKeywords(targetPhrase: string, generatedText: string): {
  matched: string[];
  total: string[];
  fuzzyMatched: string[];
} {
  const keywords = extractKeywords(targetPhrase);
  const normalizedGenerated = normalizeText(generatedText);
  const generatedWords = normalizedGenerated.replace(/[^\w\s]/g, '').split(/\s+/);
  
  const matched: string[] = [];
  const fuzzyMatched: string[] = [];
  
  for (const keyword of keywords) {
    // Exact match
    if (normalizedGenerated.includes(keyword)) {
      matched.push(keyword);
      continue;
    }
    
    // Fuzzy match - check if any word in generated text is similar
    for (const genWord of generatedWords) {
      const similarity = fuzzySimilarity(keyword, genWord);
      if (similarity > 0.75) { // 75% similar
        fuzzyMatched.push(keyword);
        break;
      }
    }
  }
  
  return { matched, total: keywords, fuzzyMatched };
}

export interface ScoringResult {
  score: number; // 0-5
  reasoning: string;
  exactMatch: boolean;
  keywordsMatched: string[];
  keywordsTotal: string[];
  fuzzyMatched: string[];
  flagged: boolean;
  flagReason?: string;
}

/**
 * Main scoring function - returns score from 0-5
 * 
 * Scoring criteria:
 * - 5: Exact phrase match found in output
 * - 4: All keywords match (exact or fuzzy)
 * - 3: Most keywords match (75%+)
 * - 2: Half keywords match (50%+)
 * - 1: Some keywords match (25%+)
 * - 0: Few/no keywords match OR flagged for cheating
 */
export function calculateScore(
  targetPhrase: string,
  generatedText: string,
  userPrompt: string
): ScoringResult {
  // Check for cheating - user used exact phrase in prompt
  if (isExactPrompt(userPrompt, targetPhrase)) {
    return {
      score: 0,
      reasoning: "⚠️ Your prompt contained the target phrase or was too similar to it. This is not allowed!",
      exactMatch: false,
      keywordsMatched: [],
      keywordsTotal: extractKeywords(targetPhrase),
      fuzzyMatched: [],
      flagged: true,
      flagReason: "Prompt contained target phrase"
    };
  }

  // Check for exact phrase in output
  if (containsExactPhrase(targetPhrase, generatedText)) {
    return {
      score: 5,
      reasoning: "🎉 Perfect! The exact target phrase was found in the AI's output!",
      exactMatch: true,
      keywordsMatched: extractKeywords(targetPhrase),
      keywordsTotal: extractKeywords(targetPhrase),
      fuzzyMatched: [],
      flagged: false
    };
  }

  // Keyword-based scoring
  const { matched, total, fuzzyMatched } = findMatchingKeywords(targetPhrase, generatedText);
  const allMatched = matched.length + fuzzyMatched.length;
  const totalKeywords = total.length;
  
  if (totalKeywords === 0) {
    return {
      score: 0,
      reasoning: "Could not extract meaningful keywords from target phrase.",
      exactMatch: false,
      keywordsMatched: [],
      keywordsTotal: [],
      fuzzyMatched: [],
      flagged: false
    };
  }

  const matchRatio = allMatched / totalKeywords;
  
  let score: number;
  let reasoning: string;

  if (matchRatio >= 1) {
    score = 4;
    reasoning = `✨ Excellent! All ${totalKeywords} keywords matched (${matched.length} exact, ${fuzzyMatched.length} fuzzy). Just missing the exact phrase!`;
  } else if (matchRatio >= 0.75) {
    score = 3;
    reasoning = `👍 Great job! ${allMatched}/${totalKeywords} keywords matched. Keywords found: ${[...matched, ...fuzzyMatched].join(', ')}`;
  } else if (matchRatio >= 0.5) {
    score = 2;
    reasoning = `👌 Good effort! ${allMatched}/${totalKeywords} keywords matched. Keywords found: ${[...matched, ...fuzzyMatched].join(', ')}`;
  } else if (matchRatio >= 0.25) {
    score = 1;
    reasoning = `🤔 Some keywords matched: ${[...matched, ...fuzzyMatched].join(', ')}. Missing: ${total.filter(k => !matched.includes(k) && !fuzzyMatched.includes(k)).join(', ')}`;
  } else {
    score = 0;
    reasoning = `❌ Few keywords matched. Looking for: ${total.join(', ')}`;
  }

  return {
    score,
    reasoning,
    exactMatch: false,
    keywordsMatched: matched,
    keywordsTotal: total,
    fuzzyMatched,
    flagged: false
  };
}

/**
 * ASCII Art Scoring Function
 * Compares two ASCII art strings based on character similarity
 */
export function calculateAsciiScore(
  targetArt: string,
  generatedArt: string,
  userPrompt: string
): ScoringResult {
  // Check for cheating - user included the target art in prompt
  if (userPrompt.includes(targetArt.trim())) {
    return {
      score: 0,
      reasoning: "⚠️ Your prompt contained the target ASCII art. This is not allowed!",
      exactMatch: false,
      keywordsMatched: [],
      keywordsTotal: [],
      fuzzyMatched: [],
      flagged: true,
      flagReason: "Prompt contained target ASCII art"
    };
  }

  const normalizedTarget = targetArt.trim();
  const normalizedGenerated = generatedArt.trim();

  // Check for exact match
  if (normalizedTarget === normalizedGenerated) {
    return {
      score: 5,
      reasoning: "🎉 Perfect! The ASCII art matches exactly!",
      exactMatch: true,
      keywordsMatched: [],
      keywordsTotal: [],
      fuzzyMatched: [],
      flagged: false
    };
  }

  // Extract unique symbols from both arts
  const targetSymbols = new Set(normalizedTarget.replace(/\s/g, '').split(''));
  const generatedSymbols = new Set(normalizedGenerated.replace(/\s/g, '').split(''));

  // Calculate symbol overlap
  const commonSymbols = [...targetSymbols].filter(s => generatedSymbols.has(s));
  const symbolMatchRatio = commonSymbols.length / targetSymbols.size;

  // Calculate line count similarity
  const targetLines = normalizedTarget.split('\n').filter(l => l.trim().length > 0);
  const generatedLines = normalizedGenerated.split('\n').filter(l => l.trim().length > 0);
  const lineCountSimilarity = 1 - Math.abs(targetLines.length - generatedLines.length) / Math.max(targetLines.length, generatedLines.length);

  // Calculate character count similarity
  const targetChars = normalizedTarget.replace(/\s/g, '').length;
  const generatedChars = normalizedGenerated.replace(/\s/g, '').length;
  const charCountSimilarity = 1 - Math.abs(targetChars - generatedChars) / Math.max(targetChars, generatedChars);

  // Calculate overall similarity (weighted average)
  const overallSimilarity = (
    symbolMatchRatio * 0.5 + 
    lineCountSimilarity * 0.25 + 
    charCountSimilarity * 0.25
  );

  let score: number;
  let reasoning: string;

  if (overallSimilarity >= 0.9) {
    score = 4;
    reasoning = `✨ Almost perfect! ${Math.round(overallSimilarity * 100)}% similarity. ${commonSymbols.length}/${targetSymbols.size} symbols matched.`;
  } else if (overallSimilarity >= 0.7) {
    score = 3;
    reasoning = `👍 Good attempt! ${Math.round(overallSimilarity * 100)}% similarity. ${commonSymbols.length}/${targetSymbols.size} symbols matched.`;
  } else if (overallSimilarity >= 0.5) {
    score = 2;
    reasoning = `👌 Decent effort! ${Math.round(overallSimilarity * 100)}% similarity. ${commonSymbols.length}/${targetSymbols.size} symbols matched.`;
  } else if (overallSimilarity >= 0.3) {
    score = 1;
    reasoning = `🤔 Some similarity detected (${Math.round(overallSimilarity * 100)}%). Try matching more symbols and structure.`;
  } else {
    score = 0;
    reasoning = `❌ Low similarity (${Math.round(overallSimilarity * 100)}%). Make sure to create ASCII art!`;
  }

  const symbolsList = [...targetSymbols];
  const matchedSymbols = symbolsList.filter(s => generatedSymbols.has(s));

  return {
    score,
    reasoning,
    exactMatch: false,
    keywordsMatched: matchedSymbols,
    keywordsTotal: symbolsList,
    fuzzyMatched: [],
    flagged: false
  };
}
