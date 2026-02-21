/**
 * Get full image URL from relative path or full URL
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getImageUrl(logoPath) {
  if (!logoPath) return null;
  
  // If already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // If relative path, prepend API base
  if (logoPath.startsWith('/')) {
    return `${API_BASE}${logoPath}`;
  }
  
  // If just filename, assume it's in /uploads
  return `${API_BASE}/uploads/${logoPath}`;
}

export function getImageUrlOrDefault(logoPath, tokenSymbol) {
  const url = getImageUrl(logoPath);
  if (url) return url;
  
  // Return null to use fallback UI (gradient with symbol letter)
  return null;
}
