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
    'I': 'i',
    'İ': 'i',
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
  
  // Simple includes check after normalization
  return normalizedTarget.includes(normalizedSearch);
}