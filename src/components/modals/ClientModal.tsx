
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
import { clientAPI } from '@/services/api'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: any // If provided, we are in edit mode
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userCode: '',
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        userCode: client.userCode || '',
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
      })
    } else {
      setFormData({
        userCode: '',
        name: '',
        email: '',
        phone: '',
      })
    }
  }, [client, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userCode || !formData.name) {
      toast.error('User Code and Name are required')
      return
    }

    setLoading(true)
    try {
      let response
      if (client?.uuid) {
        response = await clientAPI.update(client.uuid, formData)
      } else {
        response = await clientAPI.create(formData)
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
