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
  
  // Also handle the reverse mapping - English to Turkish characters
  // This helps when searching with English keyboard for Turkish text
  const englishToTurkish: { [key: string]: string } = {
    'c': '[cç]',
    'g': '[gğ]', 
    'i': '[iıİ]',
    'o': '[oö]',
    's': '[sş]',
    'u': '[uü]'
  };
  
  console.log('After character conversion:', normalized);
  return normalized;
}

export function searchMatch(searchTerm: string, targetText: string): boolean {
  // For search term, create a regex pattern that matches both English and Turkish characters
  const searchLower = searchTerm.toLowerCase().trim();
  
  // Create regex pattern that matches both English and Turkish variants
  let regexPattern = searchLower
    .replace(/c/g, '[cç]')
    .replace(/g/g, '[gğ]')
    .replace(/i/g, '[iıİ]')
    .replace(/o/g, '[oö]')
    .replace(/s/g, '[sş]')
    .replace(/u/g, '[uü]');
  
  const targetLower = targetText.toLowerCase();
  
  console.log('Search term:', searchTerm);
  console.log('Regex pattern:', regexPattern);
  console.log('Target text:', targetText);
  console.log('Target lower:', targetLower);
  
  try {
    const regex = new RegExp(regexPattern, 'i');
    const result = regex.test(targetLower);
    console.log('Match result:', result);
    return result;
  } catch (error) {
    console.error('Regex error:', error);
    // Fallback to simple includes
    return targetLower.includes(searchLower);
  }
}