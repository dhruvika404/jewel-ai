import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gem } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })


  // Check ngrok connectivity on component mount
  useEffect(() => {
    const checkNgrokConnection = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL
    

        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })

        if (response.ok) {
          console.log('✅ Ngrok connection successful:', baseUrl)
        } else {
          console.warn('⚠️ Ngrok responded with status:', response.status)
        }
      } catch (error) {
        console.error('❌ Ngrok connection failed:', error)
      }
    }

    checkNgrokConnection()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.identifier || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await login(formData.identifier, formData.password)
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <Gem className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="User ID / Email"
                  id="identifier"
                  type="text"
                  placeholder="Enter your ID or Email"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                  <Input
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

