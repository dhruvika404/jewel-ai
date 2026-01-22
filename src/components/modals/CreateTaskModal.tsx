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
import { Combobox } from '@/components/ui/combobox'

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
    clientCategoryName: '',
    lastMovementDate: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadData()
      setErrors({})
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
      console.error('Error loading data:', error)
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
      clientCategoryName: '',
      lastMovementDate: ''
    })
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData?.taskType) newErrors.taskType = 'Task Type is required'
    if (!formData?.clientCode) newErrors.clientCode = 'Client is required'
    if (!formData?.taskDetails) newErrors.taskDetails = 'Task Details are required'
    if (!formData?.nextFollowUpDate) newErrors.nextFollowUpDate = 'Next Follow-up Date is required'

    if (formData?.taskType === 'pending-material') {
      if (!formData?.styleNo) newErrors.styleNo = 'Style No is required'
      if (!formData?.orderNo) newErrors.orderNo = 'Order No is required'
    } else if (formData?.taskType === 'pending-order') {
      if (!formData?.orderNo) newErrors.orderNo = 'Order No is required'
      if (!formData?.orderDate) newErrors.orderDate = 'Order Date is required'
      if (!formData?.grossWtTotal) newErrors.grossWtTotal = 'Gross Weight is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    const filterEmptyFields = (data: Record<string, any>) => {
      const cleanData: Record<string, any> = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanData[key] = value
        }
      })
      return cleanData
    }

    setLoading(true)
    try {
      let response
      
      if (formData?.taskType === 'pending-material') {
        const payload = filterEmptyFields({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          styleNo: formData?.styleNo,
          orderNo: formData?.orderNo,
          orderDate: formData?.orderDate,
          lastMovementDate: formData?.lastMovementDate,
          expectedDeliveryDate: formData?.expectedDeliveryDate,
          departmentName: formData?.departmentName,
          totalNetWt: formData?.totalNetWt,
          nextFollowUpDate: formData?.nextFollowUpDate
        })
        response = await pendingMaterialAPI.create(payload as any)
      } else if (formData?.taskType === 'pending-order') {
        const payload = filterEmptyFields({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          orderNo: formData?.orderNo,
          orderDate: formData?.orderDate,
          grossWtTotal: formData?.grossWtTotal,
          remark: formData?.remarks ? `${formData?.remarks} | ${formData?.taskDetails}` : formData?.taskDetails,
          nextFollowUpDate: formData?.nextFollowUpDate,
          totalOrderPcs: 0,
          pendingPcs: 0
        })
        response = await pendingOrderAPI.create(payload as any)
      } else if (formData?.taskType === 'new-order') {
        const payload = filterEmptyFields({
          salesExecCode: formData?.salesExecCode,
          clientCode: formData?.clientCode,
          subCategory: formData?.subCategory,
          lastSaleDate: formData?.lastSaleDate,
          lastOrderDate: formData?.lastOrderDate,
          clientCategoryName: formData?.clientCategoryName,
          nextFollowUpDate: formData?.nextFollowUpDate
        })
        response = await newOrderAPI.create(payload as any)
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
            <Input
              id="styleNo"
              label="Style No"
              required
              value={formData?.styleNo}
              onChange={(e) => {
                setFormData({ ...formData, styleNo: e?.target?.value })
                if (errors.styleNo) setErrors({ ...errors, styleNo: '' })
              }}
              placeholder="e.g. 67GBB"
              error={errors.styleNo}
            />
            <Input
              id="orderNo"
              label="Order No"
              required
              value={formData?.orderNo}
              onChange={(e) => {
                setFormData({ ...formData, orderNo: e?.target?.value })
                if (errors.orderNo) setErrors({ ...errors, orderNo: '' })
              }}
              placeholder="e.g. ORD-1001"
              error={errors.orderNo}
            />
            <Input
              id="departmentName"
              label="Department"
              value={formData?.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e?.target?.value })}
              placeholder="e.g. diamond"
            />
            <Input
              id="totalNetWt"
              label="Total Net Weight"
              value={formData?.totalNetWt}
              onChange={(e) => setFormData({ ...formData, totalNetWt: e?.target?.value })}
              placeholder="e.g. 10.57"
            />
            <Input
              id="expectedDeliveryDate"
              label="Expected Delivery Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData?.expectedDeliveryDate}
              onChange={(e) => {
                setFormData({ ...formData, expectedDeliveryDate: e?.target?.value })
                if (errors.expectedDeliveryDate) setErrors({ ...errors, expectedDeliveryDate: '' })
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate < today) {
                  setErrors({ ...errors, expectedDeliveryDate: 'Cannot select a past date' });
                  setFormData({ ...formData, expectedDeliveryDate: '' });
                }
              }}
              error={errors.expectedDeliveryDate}
            />
            <Input
              id="orderDate"
              label="Order Date"
              type="date"
              value={formData?.orderDate}
              onChange={(e) => setFormData({ ...formData, orderDate: e?.target?.value })}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate > today) {
                  setErrors({ ...errors, orderDate: 'Cannot select a future date' });
                  setFormData({ ...formData, orderDate: '' });
                }
              }}
              error={errors.orderDate}
              max={new Date().toISOString().split('T')[0]}
            />
            <Input
              id="lastMovementDate"
              label="Last Movement Date"
              type="date"
              value={formData?.lastMovementDate}
              onChange={(e) => setFormData({ ...formData, lastMovementDate: e?.target?.value })}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate > today) {
                  setErrors({ ...errors, lastMovementDate: 'Cannot select a future date' });
                  setFormData({ ...formData, lastMovementDate: '' });
                }
              }}
              error={errors.lastMovementDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </>
        )
      
      case 'pending-order':
        return (
          <>
            <Input
              id="orderNo"
              label="Order No"
              required
              value={formData?.orderNo}
              onChange={(e) => {
                setFormData({ ...formData, orderNo: e?.target?.value })
                if (errors.orderNo) setErrors({ ...errors, orderNo: '' })
              }}
              placeholder="e.g. ORD-1001"
              error={errors.orderNo}
            />
            <Input
              id="orderDate"
              label="Order Date"
              required
              type="date"
              value={formData?.orderDate}
              onChange={(e) => {
                setFormData({ ...formData, orderDate: e?.target?.value })
                if (errors.orderDate) setErrors({ ...errors, orderDate: '' })
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate > today) {
                  setErrors({ ...errors, orderDate: 'Cannot select a future date' });
                  setFormData({ ...formData, orderDate: '' });
                }
              }}
              error={errors.orderDate}
              max={new Date().toISOString().split('T')[0]}
            />
            <Input
              id="grossWtTotal"
              label="Gross Weight Total"
              required
              type="number"
              step="0.01"
              value={formData?.grossWtTotal}
              onChange={(e) => {
                setFormData({ ...formData, grossWtTotal: e?.target?.value })
                if (errors.grossWtTotal) setErrors({ ...errors, grossWtTotal: '' })
              }}
              placeholder="e.g. 125.75"
              error={errors.grossWtTotal}
            />
          </>
        )
      
      case 'new-order':
        return (
          <>
            <Input
              id="clientCategoryName"
              label="Client Category"
              value={formData?.clientCategoryName}
              onChange={(e) => setFormData({ ...formData, clientCategoryName: e?.target?.value })}
              placeholder="e.g. diamond"
            />
            <Input
              id="subCategory"
              label="Sub Category"
              value={formData?.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e?.target?.value })}
              placeholder="e.g. 67GBB"
            />
            <Input
              id="lastSaleDate"
              label="Last Sale Date"
              type="date"
              value={formData?.lastSaleDate}
              onChange={(e) => setFormData({ ...formData, lastSaleDate: e?.target?.value })}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate > today) {
                  setErrors({ ...errors, lastSaleDate: 'Cannot select a future date' });
                  setFormData({ ...formData, lastSaleDate: '' });
                }
              }}
              error={errors.lastSaleDate}
              max={new Date().toISOString().split('T')[0]}
            />
            <Input
              id="lastOrderDate"
              label="Last Order Date"
              type="date"
              value={formData?.lastOrderDate}
              onChange={(e) => setFormData({ ...formData, lastOrderDate: e?.target?.value })}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate > today) {
                  setErrors({ ...errors, lastOrderDate: 'Cannot select a future date' });
                  setFormData({ ...formData, lastOrderDate: '' });
                }
              }}
              error={errors.lastOrderDate}
              max={new Date().toISOString().split('T')[0]}
            />
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
              <Label htmlFor="taskType" required>Task Type</Label>
              <Select 
                value={formData?.taskType} 
                onValueChange={(val) => {
                  setFormData({ ...formData, taskType: val })
                  if (errors.taskType) setErrors({ ...errors, taskType: '' })
                }}
              >
                <SelectTrigger className={errors.taskType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-order">New Order</SelectItem>
                  <SelectItem value="pending-order">Pending Order</SelectItem>
                  <SelectItem value="pending-material">Pending Material</SelectItem>
                </SelectContent>
              </Select>
              {errors.taskType && <p className="text-sm text-red-600 mt-1">{errors.taskType}</p>}
            </div>

            <Input
              id="nextFollowUpDate"
              label="Next Follow-up Date"
              required
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData?.nextFollowUpDate}
              onChange={(e) => {
                setFormData({ ...formData, nextFollowUpDate: e?.target?.value })
                if (errors.nextFollowUpDate) setErrors({ ...errors, nextFollowUpDate: '' })
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (typedDate && typedDate < today) {
                  setErrors({ ...errors, nextFollowUpDate: 'Cannot select a past date' });
                  setFormData({ ...formData, nextFollowUpDate: '' });
                }
              }}
              error={errors.nextFollowUpDate}
            />

            <Combobox
              label="Client"
              required
              options={clients.map((client) => ({
                value: client?.userCode,
                label: `${client?.name} (${client?.userCode})`
              }))}
              value={formData?.clientCode}
              onSelect={(val) => {
                setFormData({ ...formData, clientCode: val })
                if (errors.clientCode) setErrors({ ...errors, clientCode: '' })
              }}
              placeholder="Select client"
              searchPlaceholder="Search client..."
              className="w-full"
              error={errors.clientCode}
            />

            {user?.role === 'admin' && (
              <Combobox
                label="Sales Executive"
                options={salesPersons.map((sp) => ({
                  value: sp?.userCode,
                  label: `${sp?.name || 'Staff'} (${sp?.userCode})`
                }))}
                value={formData?.salesExecCode}
                onSelect={(val) => setFormData({ ...formData, salesExecCode: val })}
                placeholder="Select sales executive"
                searchPlaceholder="Search sales executive..."
                className="w-full"
              />
            )}

            {renderTaskSpecificFields()}

            <Input
              id="remarks"
              label="Remarks"
              value={formData?.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e?.target?.value })}
              placeholder="Additional remarks"
              containerClassName={formData?.taskType === 'new-order' ? "col-span-2" : ""}
            />
          </div>

          <Textarea
            id="taskDetails"
            label="Task Details"
            required
            value={formData?.taskDetails}
            onChange={(e) => {
              setFormData({ ...formData, taskDetails: e?.target?.value })
              if (errors.taskDetails) setErrors({ ...errors, taskDetails: '' })
            }}
            placeholder="Enter task details and follow-up notes..."
            rows={3}
            error={errors.taskDetails}
          />

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
