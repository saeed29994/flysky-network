// 📁 src/utils/formatDate.ts

import { format } from 'date-fns';

/**
 * Format a Firebase timestamp or date object into a readable string
 * @param timestamp - Firebase timestamp, Date object, or number
 * @param formatString - Optional date-fns format string (default: 'MMM d, yyyy h:mm a')
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDate = (
  timestamp: any, 
  formatString: string = 'MMM d, yyyy h:mm a'
): string => {
  if (!timestamp) return 'N/A';
  
  try {
    // Handle Firebase timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), formatString);
    }
    
    // Handle Date object or timestamp number
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a Firebase timestamp or date object into a relative time string (e.g., "2 days ago")
 * @param timestamp - Firebase timestamp, Date object, or number
 * @returns Relative time string or 'N/A' if invalid
 */
export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  try {
    // Convert to Date object
    const date = timestamp.toDate ? timestamp.toDate() : 
                 timestamp instanceof Date ? timestamp : 
                 new Date(timestamp);
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return `${diffYear}y ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
}; 