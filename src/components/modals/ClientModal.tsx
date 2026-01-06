
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { clientAPI, salesPersonAPI } from '@/services/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: any
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [salesPersons, setSalesPersons] = useState<any[]>([])
  const [formData, setFormData] = useState({
    userCode: '',
    name: '',
    email: '',
    phone: '',
    salesExecCode: '',
  })

  useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const response = await salesPersonAPI.getAll({ page: 1, size: 1000, role: 'sales_executive' })
        if (response.success && response.data?.data) {
          setSalesPersons(response.data.data)
        }
      } catch (error) {
        console.error('Error loading sales persons:', error)
      }
    }
    
    if (isOpen) {
      loadSalesPersons()
    }
  }, [isOpen])

  useEffect(() => {
    if (client) {
      setFormData({
        userCode: client.userCode || '',
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        salesExecCode: client.salesExecCode || 'unassigned',
      })
    } else {
      setFormData({
        userCode: '',
        name: '',
        email: '',
        phone: '',
        salesExecCode: '',
      })
    }
  }, [client, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userCode || !formData.name) {
      toast.error('User Code and Name are required')
      return
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (!client && (!formData.salesExecCode || formData.salesExecCode === 'unassigned')) {
      toast.error('Please select a Sales Executive for new client')
      return
    }

    setLoading(true)
    try {
      const apiData = {
        ...formData,
        salesExecCode: formData.salesExecCode === 'unassigned' ? '' : formData.salesExecCode
      }

      let response
      if (client?.uuid) {
        response = await clientAPI.update(client.uuid, apiData)
      } else {
        response = await clientAPI.create(apiData)
      }

      if (response.success !== false) {
        toast.success(client ? 'Client updated successfully' : 'Client added successfully')
        onSuccess()
        onClose()
      } else {
        toast.error(response.message || 'Something went wrong')
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userCode">User Code</Label>
            <Input
              id="userCode"
              placeholder="e.g. C0909"
              value={formData.userCode}
              onChange={(e) => setFormData({ ...formData, userCode: e.target.value })}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              placeholder="e.g. Nakarani jewelers"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nakarani@yopmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="9898989898"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="salesExecCode">
              Sales Executive Assignment {!client && <span className="text-red-500">*</span>}
            </Label>
            <Select value={formData.salesExecCode} onValueChange={(val) => setFormData({ ...formData, salesExecCode: val })}>
              <SelectTrigger>
                <SelectValue placeholder={"Select sales executive"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  {client ? "Select sales executive" : "No Assignment"}
                </SelectItem>
                {salesPersons.length > 0 ? (
                  salesPersons.map((sp) => (
                    <SelectItem key={sp.uuid} value={sp.userCode}>
                      {sp.name} ({sp.userCode})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-sales-persons" disabled>
                    No sales executives available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
