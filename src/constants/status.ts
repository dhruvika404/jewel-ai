export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;

export const STATUS_COLORS = {
  pending: 'yellow',
  completed: 'green',
  cancelled: 'red',
  rescheduled: 'blue',
  active: 'blue',
  inactive: 'gray',
} as const;

export const STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  SALES_EXECUTIVE: 'sales_executive',
} as const;

export const FOLLOWUP_COLOR_CLASSES = {
  PURPLE: 'bg-purple-50 border-l-4 border-purple-500',
  BLUE: 'bg-blue-50 border-l-4 border-blue-500',
  YELLOW: 'bg-yellow-50 border-l-4 border-yellow-500',
  RED: 'bg-red-50 border-l-4 border-red-500',
  GRAY: 'bg-gray-50',
} as const;
