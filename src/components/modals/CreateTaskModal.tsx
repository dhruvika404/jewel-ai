import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientAPI, salesPersonAPI, pendingMaterialAPI, pendingOrderAPI, newOrderAPI } from '@/services/api'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [salesPersons, setSalesPersons] = useState<any[]>([])
  const [formData, setFormData] = useState({
    taskType: '',
    clientCode: '',
    salesExecCode: user?.userCode || '',
    taskDetails: '',
    nextFollowUpDate: '',
    remarks: '',
    orderNo: '',
    orderDate: '',
    grossWtTotal: '',
    styleNo: '',
    departmentName: '',
    totalNetWt: '',
    expectedDeliveryDate: '',
    subCategory: '',
    lastSaleDate: '',
    lastOrderDate: '',
    clientCategoryName: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      const [clientRes, salesRes] = await Promise.all([
        clientAPI.getAll({ page: 1, size: 1000, role: 'client' }),
        salesPersonAPI.getAll({ page: 1, size: 1000, role: 'sales_executive' })
      ])
      
      if (clientRes?.success !== false) {
        setClients(clientRes?.data?.data || clientRes?.data || [])
      }
      
      if (salesRes?.success && salesRes?.data?.data) {
        setSalesPersons(salesRes?.data?.data)
      }
    } catch (error) {
    }
  }

  const resetForm = () => {
    setFormData({
      taskType: '',
      clientCode: '',
      salesExecCode: user?.userCode || '',
      taskDetails: '',
      nextFollowUpDate: '',
      remarks: '',
      orderNo: '',
      orderDate: '',
      grossWtTotal: '',
      styleNo: '',
      departmentName: '',
      totalNetWt: '',
      expectedDeliveryDate: '',
      subCategory: '',
      lastSaleDate: '',
      lastOrderDate: '',
      clientCategoryName: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData?.taskType || !formData?.clientCode || !formData?.taskDetails || !formData?.nextFollowUpDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      let response
      
      if (formData?.taskType === 'pending-material') {
        if (!formData?.styleNo || !formData?.orderNo) {
          toast.error('Style No and Order No are required for Pending Material tasks')
          return
        }
        
        response = await pendingMaterialAPI.create({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          styleNo: formData?.styleNo,
          orderNo: formData?.orderNo,
          expectedDeliveryDate: formData?.expectedDeliveryDate,
          departmentName: formData?.departmentName,
          totalNetWt: formData?.totalNetWt,
          nextFollowUpDate: formData?.nextFollowUpDate,
          lastFollowUpMsg: formData?.taskDetails,
          status: 'pending'
        })
      } else if (formData?.taskType === 'pending-order') {
        if (!formData?.orderNo || !formData?.orderDate || !formData?.grossWtTotal) {
          toast.error('Order No, Order Date, and Gross Weight are required for Pending Order tasks')
          return
        }
        
        response = await pendingOrderAPI.create({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          orderNo: formData?.orderNo,
          orderDate: formData?.orderDate,
          grossWtTotal: formData?.grossWtTotal,
          remark: formData?.remarks,
          nextFollowUpDate: formData?.nextFollowUpDate,
          lastFollowUpMsg: formData?.taskDetails,
          totalOrderPcs: 0,
          pendingPcs: 0
        })
      } else if (formData?.taskType === 'new-order') {
        if (!formData?.subCategory || !formData?.clientCategoryName) {
          toast.error('Sub Category and Client Category are required for New Order tasks')
          return
        }
        
        response = await newOrderAPI.create({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          subCategory: formData?.subCategory,
          lastSaleDate: formData?.lastSaleDate,
          lastOrderDate: formData?.lastOrderDate,
          clientCategoryName: formData?.clientCategoryName,
          nextFollowUpDate: formData?.nextFollowUpDate
        })
      }

      if (response && response.success !== false) {
        toast.success('Task created successfully')
        onSuccess?.()
        resetForm()
        onClose()
      } else {
        toast.error(response?.message || 'Failed to create task')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const renderTaskSpecificFields = () => {
    switch (formData?.taskType) {
      case 'pending-material':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="styleNo">Style No *</Label>
                <Input
                  id="styleNo"
                  value={formData?.styleNo}
                  onChange={(e) => setFormData({ ...formData, styleNo: e?.target?.value })}
                  placeholder="e.g. 67GBB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderNo">Order No *</Label>
                <Input
                  id="orderNo"
                  value={formData?.orderNo}
                  onChange={(e) => setFormData({ ...formData, orderNo: e?.target?.value })}
                  placeholder="e.g. ORD-1001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentName">Department</Label>
                <Input
                  id="departmentName"
                  value={formData?.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e?.target?.value })}
                  placeholder="e.g. diamond"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalNetWt">Total Net Weight</Label>
                <Input
                  id="totalNetWt"
                  value={formData?.totalNetWt}
                  onChange={(e) => setFormData({ ...formData, totalNetWt: e?.target?.value })}
                  placeholder="e.g. 10.57"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData?.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e?.target?.value })}
              />
            </div>
          </>
        )
      
      case 'pending-order':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNo">Order No *</Label>
                <Input
                  id="orderNo"
                  value={formData?.orderNo}
                  onChange={(e) => setFormData({ ...formData, orderNo: e?.target?.value })}
                  placeholder="e.g. ORD-1001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData?.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e?.target?.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grossWtTotal">Gross Weight Total *</Label>
              <Input
                id="grossWtTotal"
                type="number"
                step="0.01"
                value={formData?.grossWtTotal}
                onChange={(e) => setFormData({ ...formData, grossWtTotal: e?.target?.value })}
                placeholder="e.g. 125.75"
              />
            </div>
          </>
        )
      
      case 'new-order':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCategoryName">Client Category *</Label>
                <Input
                  id="clientCategoryName"
                  value={formData?.clientCategoryName}
                  onChange={(e) => setFormData({ ...formData, clientCategoryName: e?.target?.value })}
                  placeholder="e.g. diamond"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub Category *</Label>
                <Input
                  id="subCategory"
                  value={formData?.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e?.target?.value })}
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
                  value={formData?.lastSaleDate}
                  onChange={(e) => setFormData({ ...formData, lastSaleDate: e?.target?.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastOrderDate">Last Order Date</Label>
                <Input
                  id="lastOrderDate"
                  type="date"
                  value={formData?.lastOrderDate}
                  onChange={(e) => setFormData({ ...formData, lastOrderDate: e?.target?.value })}
                />
              </div>
            </div>
          </>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new follow-up task for a client
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type *</Label>
              <Select value={formData?.taskType} onValueChange={(val) => setFormData({ ...formData, taskType: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-order">New Order</SelectItem>
                  <SelectItem value="pending-order">Pending Order</SelectItem>
                  <SelectItem value="pending-material">Pending Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCode">Client *</Label>
              <Select value={formData?.clientCode} onValueChange={(val) => setFormData({ ...formData, clientCode: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client?.uuid} value={client?.userCode}>
                      {client?.name} ({client?.userCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="salesExecCode">Sales Executive</Label>
              <Select value={formData?.salesExecCode} onValueChange={(val) => setFormData({ ...formData, salesExecCode: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales executive" />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((sp) => (
                    <SelectItem key={sp?.uuid} value={sp?.userCode}>
                      {sp?.name} ({sp?.userCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {renderTaskSpecificFields()}

          <div className="space-y-2">
            <Label htmlFor="taskDetails">Task Details *</Label>
            <Textarea
              id="taskDetails"
              value={formData?.taskDetails}
              onChange={(e) => setFormData({ ...formData, taskDetails: e?.target?.value })}
              placeholder="Enter task details and follow-up notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpDate">Next Follow-up Date *</Label>
              <Input
                id="nextFollowUpDate"
                type="date"
                value={formData?.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e?.target?.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={formData?.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e?.target?.value })}
                placeholder="Additional remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}