// Utility functions for search operations

export function normalizeSearchText(text: string): string {
  // Convert to lowercase first
  let normalized = text.toLowerCase();
  
  // Turkish to English character mapping
  const turkishToEnglish: { [key: string]: string } = {
    'ç': 'c',
    'ğ': 'g',
    'ı': 'i',
    'ö': 'o',
    'ş': 's',
    'ü': 'u',
    'â': 'a',
    'î': 'i',
    'û': 'u',
    'ê': 'e',
    'ô': 'o'
  };
  
  // Replace Turkish characters with English equivalents
  Object.keys(turkishToEnglish).forEach(turkishChar => {
    const englishChar = turkishToEnglish[turkishChar];
    normalized = normalized.replace(new RegExp(turkishChar, 'g'), englishChar);
  });
  
  return normalized;
}

export function searchMatch(searchTerm: string, targetText: string): boolean {
  const normalizedSearch = normalizeSearchText(searchTerm);
  const normalizedTarget = normalizeSearchText(targetText);
  
  return normalizedTarget.includes(normalizedSearch);
}