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
    return ''
  }
}

export function formatDateForAPI(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString + 'T00:00:00.000Z')
    return date.toISOString()
  } catch (error) {
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
    return '-'
  }
}

/**
 * Removes null, undefined, and empty string values from an object
 * @param obj Object to filter
 * @returns New object with empty values removed
 */
export function filterEmptyValues<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  ) as Partial<T>
}
