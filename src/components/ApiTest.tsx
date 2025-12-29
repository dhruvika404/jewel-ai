import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authAPI } from '@/services/api'
import { toast } from 'sonner'

export default function ApiTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testLogin = async () => {
    setTesting(true)
    setResult(null)
    
    try {
      const response = await authAPI.login('admin@test.com', 'password123', 'admin')
      setResult({ success: true, data: response })
      toast.success('API connection successful!')
    } catch (error: any) {
      setResult({ success: false, error: error.message })
      toast.error('API test failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testLogin} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Admin Login API'}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 rounded-md bg-gray-100 dark:bg-gray-800">
            <h4 className="font-medium mb-2">
              Result: {result.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Endpoint:</strong> POST /api/auth/login</p>
          <p><strong>Base URL:</strong> {import.meta.env.VITE_BASE_URL}/api</p>
        </div>
      </CardContent>
    </Card>
  )
}