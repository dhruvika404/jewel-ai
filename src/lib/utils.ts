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
 * Removes null, undefined, and empty string values from an object.
 * Optionally converts all values to strings for URLSearchParams.
 * @param obj Object to filter
 * @param toString Whether to convert values to strings
 * @returns New object with empty values removed
 */
export function filterEmptyValues<T extends Record<string, any>>(
  obj: T,
  toString = false
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [k, toString ? String(v) : v])
  )
}
/**
 * Returns the name or userCode if name is invalid (null, "null", or empty).
 * @param lastFollowUpBy The follower object or string
 * @returns {string} The name or userCode
 */
export function getTakenByName(lastFollowUpBy: any): string {
  if (lastFollowUpBy && typeof lastFollowUpBy === "object") {
    const { name, userCode } = lastFollowUpBy;
    const isNameInvalid =
      !name || name.toLowerCase() === "null" || name.trim() === "";
    
    if (!isNameInvalid) return name;
    if (userCode && userCode.trim() !== "" && userCode.toLowerCase() !== "null") return userCode;
    return "-";
  }
  return (lastFollowUpBy && lastFollowUpBy !== "null") ? String(lastFollowUpBy) : "-";
}
