import { API_CONFIG, getAuthHeaders, getAuthHeadersForUpload } from '@/config/api'

// Sales Person APIs
export const salesPersonAPI = {
  // Get all sales persons with pagination and filters
  getAll: async (params?: {
    page?: number
    size?: number
    search?: string
    role?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}?${queryParams}`, {
      headers: getAuthHeaders(),
    })
    return response.json()
  },

  // Get sales person details by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.DETAIL}/${id}`, {
      headers: getAuthHeaders(),
    })
    return response.json()
  },

  // Import sales person data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.IMPORT}`, {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData,
    })
    return response.json()
  },
}

// Client APIs
export const clientAPI = {
  // Get all clients with pagination and filters
  getAll: async (params?: {
    page?: number
    size?: number
    search?: string
    role?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}?${queryParams}`, {
      headers: getAuthHeaders(),
    })
    return response.json()
  },

  // Get client details by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.DETAIL}/${id}`, {
      headers: getAuthHeaders(),
    })
    return response.json()
  },

  // Import client data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.IMPORT}`, {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData,
    })
    return response.json()
  },
}

// Health check
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}${API_CONFIG.ENDPOINTS.HEALTH}`)
    return response.json()
  },
}