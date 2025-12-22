export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  AUTH_TOKEN: 'ru498ru849ur3984ur849uvm48uv48r48mr4339ie09cr8y4783brv74ryn38uc093rcm493fnvr',
  ENDPOINTS: {
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
    HEALTH: '/'
  }
}

export const getAuthHeaders = () => ({
  'x-auth-token': API_CONFIG.AUTH_TOKEN,
  'Content-Type': 'application/json',
})

export const getAuthHeadersForUpload = () => ({
  'x-auth-token': API_CONFIG.AUTH_TOKEN,
})