// Utility functions for search operations

export function normalizeSearchText(text: string): string {
  // Convert to lowercase and trim whitespace
  let normalized = text.toLowerCase().trim();
  
  console.log('Original text:', text);
  console.log('After lowercase:', normalized);
  
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
    'I': 'i', // Turkish capital I
    'İ': 'i', // Turkish dotted capital I
    'Ö': 'o',
    'Ş': 's',
    'Ü': 'u',
    'â': 'a',
    'î': 'i',
    'û': 'u',
    'ê': 'e',
    'ô': 'o',
    'Â': 'a',
    'Î': 'i',
    'Û': 'u',
    'Ê': 'e',
    'Ô': 'o'
  };
  
  // Replace Turkish characters with English equivalents
  Object.keys(turkishToEnglish).forEach(turkishChar => {
    const englishChar = turkishToEnglish[turkishChar];
    normalized = normalized.replace(new RegExp(turkishChar, 'g'), englishChar);
  });
  
  console.log('After character conversion:', normalized);
  return normalized;
}

export function searchMatch(searchTerm: string, targetText: string): boolean {
  const normalizedSearch = normalizeSearchText(searchTerm);
  const normalizedTarget = normalizeSearchText(targetText);
  
  console.log('Search term normalized:', normalizedSearch);
  console.log('Target text normalized:', normalizedTarget);
  console.log('Match result:', normalizedTarget.includes(normalizedSearch));
  
  return normalizedTarget.includes(normalizedSearch);
}