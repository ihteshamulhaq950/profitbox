/**
 * Date utility functions for handling timestampz filtering
 * Ensures consistent date/time conversions across the application
 */

export type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'alltime'

export interface DateRange {
  from: string // ISO 8601 timestamp string
  to: string   // ISO 8601 timestamp string
}

/**
 * Get the start of today in user's timezone (beginning of day)
 * Returns start and end timestamps for the entire day
 */
export function getTodayRange(): DateRange {
  const now = new Date()
  
  // Start of today (00:00:00 in user's timezone)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  
  // End of today (23:59:59.999 in user's timezone)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  
  return {
    from: startOfToday.toISOString(),
    to: endOfToday.toISOString(),
  }
}

/**
 * Get yesterday's date range in user's timezone
 */
export function getYesterdayRange(): DateRange {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Start of yesterday (00:00:00 in user's timezone)
  const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0)
  
  // End of yesterday (23:59:59.999 in user's timezone)
  const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
  
  return {
    from: startOfYesterday.toISOString(),
    to: endOfYesterday.toISOString(),
  }
}

/**
 * Get last 7 days range in user's timezone
 */
export function getLast7DaysRange(): DateRange {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  startDate.setHours(0, 0, 0, 0)
  
  return {
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  }
}

/**
 * Get last 30 days range in user's timezone
 */
export function getLast30DaysRange(): DateRange {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  startDate.setHours(0, 0, 0, 0)
  
  return {
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  }
}

/**
 * Get entire time range (return undefined for no filter)
 */
export function getAllTimeRange(): { from?: string; to?: string } {
  return {}
}

/**
 * Convert DateFilter to DateRange
 * This is the main function to use in components and API routes
 */
export function getDateRangeFromFilter(filter: DateFilter): DateRange | { from?: string; to?: string } {
  switch (filter) {
    case 'today':
      return getTodayRange()
    case 'yesterday':
      return getYesterdayRange()
    case 'last7days':
      return getLast7DaysRange()
    case 'last30days':
      return getLast30DaysRange()
    case 'alltime':
      return getAllTimeRange()
    default:
      return getTodayRange()
  }
}

/**
 * Format a date for display
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date and time for display
 */
export function formatDateTimeDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get yesterday's date as YYYY-MM-DD string (for display/filters)
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatToDateString(yesterday)
}

/**
 * Get today's date as YYYY-MM-DD string (for display/filters)
 */
export function getTodayDateString(): string {
  return formatToDateString(new Date())
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatToDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get date N days ago as YYYY-MM-DD string
 */
export function getDateStringDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatToDateString(date)
}
