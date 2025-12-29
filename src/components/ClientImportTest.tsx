import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { clientAPI } from '@/services/api'
import { API_CONFIG } from '@/config/api'
import { toast } from 'sonner'

export default function ClientImportTest() {
  const [file, setFile] = useState<File | null>(null)
  
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const testClientImport = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setTesting(true)
    setResult(null)
    
    try {
      const response = await clientAPI.import(file)
      setResult({ success: true, data: response })
      toast.success('Client import test successful!')
    } catch (error: any) {
      console.error('Client import test error:', error)
      setResult({ success: false, error: error.message })
      toast.error('Client import test failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Client Import API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Excel File:</label>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button 
          onClick={testClientImport} 
          disabled={!file || testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Client Import'}
        </Button>
        
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Endpoint:</strong> POST {API_CONFIG.BASE_URL}{API_CONFIG.ENDPOINTS.CLIENT.IMPORT}</p>
          <p><strong>Authentication:</strong> Bearer token required (auto-included)</p>
          {file && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <p><strong>Selected File:</strong></p>
              <p>Name: {file.name}</p>
              <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
              <p>Type: {file.type}</p>
            </div>
          )}
        </div>
        
        {result && (
          <div className="mt-4 p-3 rounded-md bg-gray-100 dark:bg-gray-800">
            <h4 className="font-medium mb-2">
              Result: {result.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}