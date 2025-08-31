// Utility functions for search operations

export function normalizeSearchText(text: string): string {
  // Convert to lowercase and trim whitespace
  let normalized = text.toLowerCase().trim();
  
  // Turkish to English character mapping
  const turkishToEnglish: { [key: string]: string } = {
    'ç': 'c',
    'ğ': 'g',
    'ı': 'i',
    'ö': 'o',
    'ş': 's',
    'ü': 'u',
    'Ç': 'c',
    'Ğ': 'g',
    'İ': 'i',
    'Ö': 'o',
    'Ş': 's',
    'Ü': 'u'
  };
  
  // Replace Turkish characters with English equivalents
  for (const [turkishChar, englishChar] of Object.entries(turkishToEnglish)) {
    normalized = normalized.split(turkishChar).join(englishChar);
  }
  
  return normalized;
}

export function searchMatch(searchTerm: string, targetText: string): boolean {
  // Normalize and lowercase both sides
  const normalizedSearch = normalizeSearchText(searchTerm.toLowerCase());
  const normalizedTarget = normalizeSearchText(targetText.toLowerCase());
  
  // Simple contains check after normalization
  return normalizedTarget.includes(normalizedSearch);
}