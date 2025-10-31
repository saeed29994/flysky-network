// 📁 src/utils/formatTimestamp.ts

/**
 * Safely formats a timestamp of any type (Firestore Timestamp, number, Date, etc.)
 * @param timestamp - The timestamp to format
 * @returns Formatted date string or 'Invalid Date' if conversion fails
 */
export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  try {
    // Handle Firestore Timestamp (with toDate method)
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleString();
    }
    
    // Handle Firestore Timestamp (with seconds/nanoseconds)
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const seconds = timestamp.seconds;
      const nanoseconds = timestamp.nanoseconds || 0;
      return new Date(seconds * 1000 + nanoseconds / 1000000).toLocaleString();
    }
    
    // Handle regular timestamp (number or Date)
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp);
    return 'Invalid Date';
  }
};
