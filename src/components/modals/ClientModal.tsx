
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { clientAPI, salesPersonAPI } from '@/services/api'
import { Combobox } from '@/components/ui/combobox'

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const response = await salesPersonAPI.getAll({ page: 1, size: 1000, role: 'sales_executive' })
        if (response?.success && response?.data?.data) {
          setSalesPersons(response?.data?.data)
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
        userCode: client?.userCode || '',
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        salesExecCode: client?.salesExecCode || 'unassigned',
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
    setErrors({})
  }, [client, isOpen])

  const resetForm = () => {
    setFormData({
      userCode: '',
      name: '',
      email: '',
      phone: '',
      salesExecCode: '',
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData?.userCode) newErrors.userCode = 'User Code is required'
    if (!formData?.name) newErrors.name = 'Client Name is required'
    
    if (formData?.email && formData?.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData?.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!client && (!formData?.salesExecCode || formData?.salesExecCode === 'unassigned')) {
      newErrors.salesExecCode = 'Please select a Sales Executive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    try {
      const apiData = {
        ...formData,
        salesExecCode: formData?.salesExecCode === 'unassigned' ? '' : formData?.salesExecCode
      }

      let response
      if (client?.uuid) {
        response = await clientAPI.update(client?.uuid, apiData)
      } else {
        response = await clientAPI.create(apiData)
      }

      if (response.success !== false) {
        toast.success(client ? 'Client updated successfully' : 'Client added successfully')
        onSuccess()
        resetForm()
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Input
            id="userCode"
            label="User Code"
            placeholder="e.g. C0909"
            value={formData?.userCode}
            onChange={(e) => {
              setFormData({ ...formData, userCode: e?.target?.value })
              if (errors.userCode) setErrors({ ...errors, userCode: '' })
            }}
            required
            error={errors.userCode}
            autoComplete="off"
          />
          <Input
            id="name"
            label="Client Name"
            placeholder="e.g. Nakarani jewelers"
            value={formData?.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e?.target?.value })
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
            required
            error={errors.name}
            autoComplete="off"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="nakarani@yopmail.com"
            value={formData?.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e?.target?.value })
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            error={errors.email}
            autoComplete="off"
          />
          <Input
            id="phone"
            label="Phone"
            placeholder="9898989898"
            value={formData?.phone}
            onChange={(e) => setFormData({ ...formData, phone: e?.target?.value })}
            autoComplete="off"
          />
          
          <Combobox
            label="Sales Executive"
            required={!client}
            options={[
              { value: "unassigned", label: client ? "Select sales executive" : "No Assignment" },
              ...salesPersons.map(sp => ({
                value: sp.userCode,
                label: `${sp.name} (${sp.userCode})`
              }))
            ]}
            value={formData?.salesExecCode || "unassigned"}
            onSelect={(val) => {
              setFormData({ ...formData, salesExecCode: val })
              if (errors.salesExecCode) setErrors({ ...errors, salesExecCode: '' })
            }}
            placeholder="Select sales executive"
            searchPlaceholder="Search sales executive..."
            error={errors.salesExecCode}
          />
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
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
