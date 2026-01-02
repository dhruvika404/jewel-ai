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
