import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

export function formatDateForAPI(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString + 'T00:00:00.000Z')
    return date.toISOString()
  } catch (error) {
    console.error('Error formatting date for API:', error)
    return ''
  }
}
export function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formatting display date:', error)
    return '-'
  }
}

/**
 * Calculate the number of days between two dates
 */
export function calculateDaysDiff(date1: Date | string, date2: Date | string = new Date()): number {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Error calculating days difference:', error)
    return 0
  }
}

/**
 * Get follow-up color class based on next follow-up date
 */
export function getFollowUpColor(nextFollowUpDate: string | null | undefined): string {
  if (!nextFollowUpDate) return 'bg-gray-50'

  try {
    const nextDate = new Date(nextFollowUpDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    nextDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor(
      (today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff <= 0) return 'bg-purple-50 border-l-4 border-purple-500'
    if (daysDiff >= 1 && daysDiff <= 2) return 'bg-blue-50 border-l-4 border-blue-500'
    if (daysDiff >= 3 && daysDiff <= 4) return 'bg-yellow-50 border-l-4 border-yellow-500'
    if (daysDiff >= 5) return 'bg-red-50 border-l-4 border-red-500'

    return 'bg-gray-50'
  } catch (error) {
    console.error('Error getting follow-up color:', error)
    return 'bg-gray-50'
  }
}
