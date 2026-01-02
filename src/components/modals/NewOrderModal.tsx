import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { newOrderAPI, salesPersonAPI } from '@/services/api'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateForInput } from '@/lib/utils'

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientCode: string
  order?: any
}

export function NewOrderModal({ isOpen, onClose, onSuccess, clientCode, order }: NewOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [salesPersons, setSalesPersons] = useState<any[]>([])
  const [formData, setFormData] = useState({
    salesExecCode: '',
    clientCode: clientCode,
    subCategory: '',
    lastSaleDate: '',
    lastOrderDate: '',
    clientCategoryName: '',
    nextFollowUpDate: ''
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
    loadSalesPersons()
  }, [])

  useEffect(() => {
    if (order) {
      setFormData({
        salesExecCode: order.salesExecCode || '',
        clientCode: order.clientCode || clientCode,
        subCategory: order.subCategory || '',
        lastSaleDate: formatDateForInput(order.lastSaleDate),
        lastOrderDate: formatDateForInput(order.lastOrderDate),
        clientCategoryName: order.clientCategoryName || '',
        nextFollowUpDate: formatDateForInput(order.nextFollowUpDate)
      })
    } else {
      setFormData({
        salesExecCode: '',
        clientCode: clientCode,
        subCategory: '',
        lastSaleDate: '',
        lastOrderDate: '',
        clientCategoryName: '',
        nextFollowUpDate: ''
      })
    }
  }, [order, clientCode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.salesExecCode || !formData.subCategory || !formData.clientCategoryName) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (order) {
        await newOrderAPI.update(order.uuid || order.id, formData)
        toast.success('New order updated successfully')
      } else {
        await newOrderAPI.create(formData)
        toast.success('New order created successfully')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Edit' : 'Add'} New Order</DialogTitle>
          <DialogDescription>
            {order ? 'Update the new order details' : 'Create a new order record'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesExecCode">Sales Executive *</Label>
              <Select value={formData.salesExecCode} onValueChange={(val) => setFormData({ ...formData, salesExecCode: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales executive" />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((sp) => (
                    <SelectItem key={sp.uuid} value={sp.userCode}>
                      {sp.name} ({sp.userCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCode">Client Code</Label>
              <Input id="clientCode" value={formData.clientCode} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientCategoryName">Client Category Name *</Label>
              <Input
                id="clientCategoryName"
                value={formData.clientCategoryName}
                onChange={(e) => setFormData({ ...formData, clientCategoryName: e.target.value })}
                placeholder="e.g. diamond"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category *</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                placeholder="e.g. 67GBB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastSaleDate">Last Sale Date</Label>
              <Input
                id="lastSaleDate"
                type="date"
                value={formData.lastSaleDate}
                onChange={(e) => setFormData({ ...formData, lastSaleDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastOrderDate">Last Order Date</Label>
              <Input
                id="lastOrderDate"
                type="date"
                value={formData.lastOrderDate}
                onChange={(e) => setFormData({ ...formData, lastOrderDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextFollowUpDate">Next Follow-up Date</Label>
            <Input
              id="nextFollowUpDate"
              type="date"
              value={formData.nextFollowUpDate}
              onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {order ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
