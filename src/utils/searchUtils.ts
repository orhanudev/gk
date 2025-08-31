// Utility functions for search operations

export function normalizeSearchText(text: string): string {
  // Convert to lowercase and trim whitespace
  let normalized = text.toLowerCase().trim();
  
  // Turkish to English character mapping
  const turkishToEnglish: { [key: string]: string } = {
    'ç': 'c',
    'ğ': 'g',
    'ı': 'i',
    'i': 'i',
    'ö': 'o',
    'ş': 's',
    'ü': 'u',
    'Ç': 'c',
    'Ğ': 'g',
    'İ': 'i',
    'I': 'i',
    'Ö': 'o',
    'Ş': 's',
    'Ü': 'u'
  };
  
  // Replace Turkish characters with English equivalents
  Object.keys(turkishToEnglish).forEach(turkishChar => {
    const englishChar = turkishToEnglish[turkishChar];
    normalized = normalized.replace(new RegExp(turkishChar, 'g'), englishChar);
  });
  
  return normalized;
}

export function searchMatch(searchTerm: string, targetText: string): boolean {
  // Normalize both search term and target text
  const normalizedSearch = normalizeSearchText(searchTerm);
  const normalizedTarget = normalizeSearchText(targetText);
  
  // Split search term into words for better matching
  const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);
  
  // Check if all search words are found in the target text
  return searchWords.every(word => normalizedTarget.includes(word));
}