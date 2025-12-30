import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'

export type UserRole = 'admin' | 'sales' | 'sales_executive' | 'client'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('jewelai_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        localStorage.removeItem('jewelai_user')
      }
    }
    setInitializing(false)
  }, [])

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      // Determine if identifier is email or userCode
      // Email format: contains @ symbol
      // UserCode format: typically alphanumeric code like SE009
      const isEmail = identifier.includes('@')
      
      // Prepare login payload WITHOUT role - backend determines role
      let loginPayload: any = { password }
      
      if (isEmail) {
        // Admin login with email
        loginPayload.email = identifier
      } else {
        // Sales person login with userCode
        loginPayload.userCode = identifier
      }

      // Call the real API
      const response = await authAPI.login(loginPayload)
      
      if (response.success === false) {
        throw new Error(response.message || 'Login failed')
      }

      // Extract user data and token from response
      const userData = response.user || response.data || response
      const token = response.token || response.accessToken || userData.token
      
      const userSession: User = {
        id: userData.id || userData.userId || '1',
        email: userData.email || (isEmail ? identifier : ''),
        name: userData.name || userData.username || (isEmail ? 'Admin User' : 'Sales Executive'),
        role: (userData.role || (isEmail ? 'admin' : 'sales_executive')) as UserRole
      }

      setUser(userSession)
      localStorage.setItem('jewelai_user', JSON.stringify(userSession))
      
      // Store authentication token if provided
      if (token) {
        localStorage.setItem('jewelai_token', token)
      }
      
      // Navigate based on role
      const navigateRole = userSession.role === 'sales_executive' ? 'sales' : userSession.role
      navigate(`/${navigateRole}`)
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jewelai_user')
    localStorage.removeItem('jewelai_token')
    navigate('/login')
  }

  if (initializing) {
    return null 
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
