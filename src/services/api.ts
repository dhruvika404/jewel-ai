import { API_CONFIG, getHeaders, getUploadHeaders } from '@/config/api'

// Auth APIs
export const authAPI = {
  // Login - accepts either email or userCode with password
  login: async (payload: { email?: string; userCode?: string; password: string }) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error: any) {
      console.error('Auth API Error:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.')
      }
      throw error
    }
  },

  // Set login password for sales person
  setPassword: async (userCode: string, password: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SET_PASSWORD}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ userCode, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error: any) {
      console.error('Set Password API Error:', error)
      throw error
    }
  },
}

// Dashboard APIs
export const dashboardAPI = {
  // Get dashboard overview counts
  getOverview: async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD.OVERVIEW}`, {
        method: 'GET',
        headers: getHeaders(),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error: any) {
      console.error('Dashboard API Error:', error)
      throw error
    }
  },
}

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
      headers: getHeaders()
    })
    return response.json()
  },

  // Create new sales person
  create: async (data: any) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Update sales person
  update: async (id: string, data: any) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Get sales person details by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.DETAIL}/${id}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Import sales person data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.IMPORT}`, {
      method: 'POST',
      headers: getUploadHeaders(),
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
      headers: getHeaders()
    })
    return response.json()
  },

  // Get client details by ID
  getById: async (id: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.DETAIL}/${id}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Create new client
  create: async (data: { userCode: string; name: string; email: string; phone: string }) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Update client
  update: async (id: string, data: { userCode: string; name: string; email: string; phone: string }) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Import client data
  import: async (file: File) => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided')
      }

      if (file.size === 0) {
        throw new Error('File is empty')
      }

      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error('File must be an Excel file (.xlsx or .xls)')
      }

      // Test file readability before upload
      await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as ArrayBuffer
          if (result && result.byteLength > 0) {
            resolve(result)
          } else {
            reject(new Error('File is empty or unreadable'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(file)
      })

      // Create FormData with the validated file
      const formData = new FormData()
      formData.append('file', file, file.name)
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.IMPORT}`


      const response = await fetch(url, {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      })


      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Client import - Failed to parse JSON response:', parseError)
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`)
      }


      if (!response.ok) {
        throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`)
      }

      return result
    } catch (error: any) {
      console.error('Client import - Error:', error)
      throw error
    }
  },
}

// Pending Order APIs
export const pendingOrderAPI = {
  // Get all pending orders with pagination
  getAll: async (params?: {
    page?: number
    size?: number
    clientCode?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.clientCode) queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.LIST}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number
    size?: number
    clientCode: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.size) queryParams.append('size', params.size.toString())
    queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.FOLLOW_UP}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Add follow-up
  addFollowUp: async (data: {
    pendingOrderId: string
    followUpMsg: string
    nextFollowUpDate: string
    followUpStatus: string
  }) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.ADD_FOLLOW_UP}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Import pending order data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.IMPORT}`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    })
    return response.json()
  },
}

// Pending Material APIs
export const pendingMaterialAPI = {
  // Get all pending materials with pagination
  getAll: async (params?: {
    page?: number
    size?: number
    clientCode?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.clientCode) queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.LIST}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number
    size?: number
    clientCode: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.size) queryParams.append('size', params.size.toString())
    queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.FOLLOW_UP}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Add follow-up
  addFollowUp: async (data: {
    pendingMaterialRecordId: string
    followUpMsg: string
    nextFollowUpDate: string
    followUpStatus: string
  }) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.ADD_FOLLOW_UP}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Import pending material data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.IMPORT}`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    })
    return response.json()
  },
}

// New Order APIs
export const newOrderAPI = {
  // Get all new orders with pagination
  getAll: async (params?: {
    page?: number
    size?: number
    clientCode?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.size) queryParams.append('size', params.size.toString())
    if (params?.clientCode) queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.LIST}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number
    size?: number
    clientCode?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.size) queryParams.append('size', params.size.toString())
    if (params.clientCode) queryParams.append('clientCode', params.clientCode)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.FOLLOW_UP}?${queryParams}`, {
      headers: getHeaders()
    })
    return response.json()
  },

  // Add follow-up
  addFollowUp: async (data: {
    newOrderRecordId: string
    followUpMsg: string
    nextFollowUpDate: string
    followUpStatus: string
  }) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.ADD_FOLLOW_UP}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Import new order data
  import: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.IMPORT}`, {
      method: 'POST',
      headers: getUploadHeaders(),
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