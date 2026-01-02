import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { pendingMaterialAPI, salesPersonAPI } from '@/services/api'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateForInput } from '@/lib/utils'

interface PendingMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientCode: string
  material?: any
}

export function PendingMaterialModal({ isOpen, onClose, onSuccess, clientCode, material }: PendingMaterialModalProps) {
  const [loading, setLoading] = useState(false)
  const [salesPersons, setSalesPersons] = useState<any[]>([])
  const [formData, setFormData] = useState({
    salesExecCode: '',
    clientCode: clientCode,
    styleNo: '',
    orderNo: '',
    expectedDeliveryDate: '',
    departmentName: '',
    totalNetWt: '',
    nextFollowUpDate: '',
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
    if (material) {
      setFormData({
        salesExecCode: material.salesExecCode || '',
        clientCode: material.clientCode || clientCode,
        styleNo: material.styleNo || '',
        orderNo: material.orderNo || '',
        expectedDeliveryDate: formatDateForInput(material.expectedDeliveryDate),
        departmentName: material.departmentName || '',
        totalNetWt: material.totalNetWt || '',
        nextFollowUpDate: formatDateForInput(material.nextFollowUpDate),
      })
    } else {
      setFormData({
        salesExecCode: '',
        clientCode: clientCode,
        styleNo: '',
        orderNo: '',
        expectedDeliveryDate: '',
        departmentName: '',
        totalNetWt: '',
        nextFollowUpDate: '',
      })
    }
  }, [material, clientCode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.salesExecCode || !formData.styleNo || !formData.orderNo) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (material) {
        await pendingMaterialAPI.update(material.uuid || material.id, formData)
        toast.success('Pending material updated successfully')
      } else {
        await pendingMaterialAPI.create(formData)
        toast.success('Pending material created successfully')
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
          <DialogTitle>{material ? 'Edit' : 'Add'} Pending Material</DialogTitle>
          <DialogDescription>
            {material ? 'Update the pending material details' : 'Create a new pending material record'}
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
              <Label htmlFor="styleNo">Style No *</Label>
              <Input
                id="styleNo"
                value={formData.styleNo}
                onChange={(e) => setFormData({ ...formData, styleNo: e.target.value })}
                placeholder="e.g. 67GBB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNo">Order No *</Label>
              <Input
                id="orderNo"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                placeholder="e.g. ORD-1001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department Name</Label>
              <Input
                id="departmentName"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="e.g. diamond"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalNetWt">Total Net Weight</Label>
              <Input
                id="totalNetWt"
                value={formData.totalNetWt}
                onChange={(e) => setFormData({ ...formData, totalNetWt: e.target.value })}
                placeholder="e.g. 10.57"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {material ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
