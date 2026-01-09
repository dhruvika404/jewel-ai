import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { pendingOrderAPI, salesPersonAPI } from '@/services/api'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateForInput } from '@/lib/utils'

interface PendingOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientCode: string
  order?: any
}

export function PendingOrderModal({ isOpen, onClose, onSuccess, clientCode, order }: PendingOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [salesPersons, setSalesPersons] = useState<any[]>([])
  const [formData, setFormData] = useState({
    salesExecCode: '',
    clientCode: clientCode,
    orderNo: '',
    orderDate: '',
    grossWtTotal: '',
    totalOrderPcs: '',
    pendingPcs: '',
    remark: '',
    nextFollowUpDate: '',
    status: 'pending',
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
        orderNo: order.orderNo || '',
        orderDate: formatDateForInput(order.orderDate),
        grossWtTotal: order.grossWtTotal?.toString() || '',
        totalOrderPcs: order.totalOrderPcs?.toString() || '',
        pendingPcs: order.pendingPcs?.toString() || '',
        remark: order.remark || '',
        nextFollowUpDate: formatDateForInput(order.nextFollowUpDate),
        status: order.status || 'pending',
      })
    } else {
      setFormData({
        salesExecCode: '',
        clientCode: clientCode,
        orderNo: '',
        orderDate: '',
        grossWtTotal: '',
        totalOrderPcs: '',
        pendingPcs: '',
        remark: '',
        nextFollowUpDate: '',
        status: 'pending',
      })
    }
  }, [order, clientCode, isOpen])

  const resetForm = () => {
    setFormData({
      salesExecCode: '',
      clientCode: clientCode,
      orderNo: '',
      orderDate: '',
      grossWtTotal: '',
      totalOrderPcs: '',
      pendingPcs: '',
      remark: '',
      nextFollowUpDate: '',
      status: 'pending',
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.salesExecCode || !formData.orderNo || !formData.orderDate || !formData.grossWtTotal || !formData.totalOrderPcs || !formData.pendingPcs) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.nextFollowUpDate) {
      toast.error('Next follow-up date is required')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        salesExecCode: formData.salesExecCode,
        clientCode: formData.clientCode,
        orderNo: formData.orderNo,
        orderDate: formData.orderDate,
        grossWtTotal: formData.grossWtTotal,
        totalOrderPcs: Number(formData.totalOrderPcs),
        pendingPcs: Number(formData.pendingPcs),
        remark: formData.remark,
        nextFollowUpDate: formData.nextFollowUpDate,
      };

      // Only include status if explicitly needed, but user says it's not allowed
      // if (formData.status) payload.status = formData.status;

      let response
      if (order) {
        response = await pendingOrderAPI.update(order.uuid || order.id, payload)
      } else {
        response = await pendingOrderAPI.create(payload)
      }

      // Check if response indicates failure
      if (response && response.success === false) {
        toast.error(response.message || 'Operation failed')
        return
      }

      toast.success(order ? 'Pending order updated successfully' : 'Pending order created successfully')
      onSuccess()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Edit' : 'Add'} Pending Order</DialogTitle>
          <DialogDescription>
            {order ? 'Update the pending order details' : 'Create a new pending order record'}
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
              <Label htmlFor="orderNo">Order No *</Label>
              <Input
                id="orderNo"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                placeholder="e.g. ORD-1001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              />
            </div>
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="Enter any remarks or notes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalOrderPcs">Total Order Pcs *</Label>
              <Input
                id="totalOrderPcs"
                type="number"
                value={formData.totalOrderPcs}
                onChange={(e) => setFormData({ ...formData, totalOrderPcs: e.target.value })}
                placeholder="e.g. 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pendingPcs">Pending Pcs *</Label>
              <Input
                id="pendingPcs"
                type="number"
                value={formData.pendingPcs}
                onChange={(e) => setFormData({ ...formData, pendingPcs: e.target.value })}
                placeholder="e.g. 50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpDate">Next Follow-up Date *</Label>
              <Input
                id="nextFollowUpDate"
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grossWtTotal">Gross Weight Total *</Label>
              <Input
                id="grossWtTotal"
                type="number"
                step="0.01"
                value={formData.grossWtTotal}
                onChange={(e) => setFormData({ ...formData, grossWtTotal: e.target.value })}
                placeholder="e.g. 125.75"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
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
