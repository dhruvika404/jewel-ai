import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/config/api'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function CurlGenerator() {
  const [curlCommand, setCurlCommand] = useState('')

  const generateCurl = () => {
    const curl = `curl --location '${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.IMPORT}' \\
--form 'file=@"/path/to/your/file.xlsx"'`

    setCurlCommand(curl)
  }

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    toast.success('Curl command copied to clipboard')
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Generate Curl Command</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateCurl} className="w-full">
          Generate Curl Command
        </Button>

        {curlCommand && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Curl Command:</label>
              <Button onClick={copyCurl} variant="ghost" size="sm">
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={curlCommand}
              readOnly
              rows={4}
              className="font-mono text-xs"
            />
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Current Configuration:</strong></p>
          <p>Base URL: {API_CONFIG.BASE_URL}</p>
          <p>Endpoint: {API_CONFIG.ENDPOINTS.CLIENT.IMPORT}</p>
          <p>Authentication: No auth required</p>
        </div>
      </CardContent>
    </Card>
  )
}