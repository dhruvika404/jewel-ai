export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_BASE_URL || 'http://localhost:3000') + '/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login'
    },
    SALES_PERSON: {
      LIST: '/sales-person',
      IMPORT: '/sales-person/import',
      DETAIL: '/sales-person'
    },
    CLIENT: {
      LIST: '/client',
      IMPORT: '/client/import',
      DETAIL: '/client'
    },
    PENDING_ORDER: {
      LIST: '/pending-order',
      IMPORT: '/pending-order/import',
      FOLLOW_UP: '/pending-order/follow-up',
      ADD_FOLLOW_UP: '/pending-order/add-followup'
    },
    PENDING_MATERIAL: {
      LIST: '/pending-material',
      IMPORT: '/pending-material/import',
      FOLLOW_UP: '/pending-material/follow-up',
      ADD_FOLLOW_UP: '/pending-material/add-followup'
    },
    NEW_ORDER: {
      LIST: '/new-order',
      IMPORT: '/new-order/import',
      FOLLOW_UP: '/new-order/follow-up',
      ADD_FOLLOW_UP: '/new-order/add-followup'
    },
    HEALTH: '/'
  }
}

// Get auth headers with token
export const getHeaders = () => {
  const token = localStorage.getItem('jewelai_token')
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token && { 'x-auth-token': token })
  }
}

// Get auth headers for uploads
export const getUploadHeaders = () => {
  const token = localStorage.getItem('jewelai_token')
  return {
    // Let browser set Content-Type for multipart/form-data
    'ngrok-skip-browser-warning': 'true',
    ...(token && { 'x-auth-token': token })
  }
}