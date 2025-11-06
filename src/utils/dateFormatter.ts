/**
 * Formats a date string to DD/MM/YYYY format
 * @param dateString - ISO date string or already formatted DD/MM/YYYY string
 * @returns Formatted date string in DD/MM/YYYY format or empty string if invalid
 */
export function formatDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (dateString.includes('/')) {
    return dateString;
  }
  
  // Otherwise, assume ISO format and convert
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString; // Return original string on error
  }
}

/**
 * Formats time string to display in hours
 * @param timeString - Time string (e.g., "2 hours", "30 minutes")
 * @returns Formatted time string
 */
export function formatTimeInHours(timeString: string): string {
  if (!timeString) return 'N/A';
  
  // Expected format: "23 hr 59"
  const match = timeString.match(/^(\d{1,2})\s+hr\s+(\d{1,2})$/);
  
  if (!match) return timeString; // Return as-is if format doesn't match
  
  const hours = match[1];
  const minutes = match[2];
  
  return `${hours} hr ${minutes} min`;
}