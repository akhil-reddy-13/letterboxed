// Word list loader and validator
// Uses dictionary.txt via API endpoint

// Cache the dictionary in memory on the client side after first load
let wordCache: Set<string> | null = null;

async function loadDictionary(): Promise<Set<string>> {
  if (wordCache) {
    return wordCache;
  }

  try {
    const response = await fetch('/api/dictionary');
    const data = await response.json();
    wordCache = new Set(data.words.map((word: string) => word.toUpperCase()));
    return wordCache;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    // Fallback to empty set if API fails
    return new Set<string>();
  }
}

export async function isValidWord(word: string): Promise<boolean> {
  const dictionary = await loadDictionary();
  return dictionary.has(word.toUpperCase());
}

export function getWordLength(word: string): number {
  return word.length;
}