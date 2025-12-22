import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Package, ShoppingCart, Box, Plus, Upload, FileUp } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { salesPersonAPI, clientAPI } from '@/services/api'

const todaysFollowups = [
  {
    id: 1,
    client: 'Acme Corp (CJ001)',
    type: 'New order',
    date: '2025-12-18',
    time: '10:00 AM',
    notes: 'Discuss new product catalog',
    nextFollowupDate: '2025-12-20',
    nextFollowupTime: '2:00 PM',
    status: 'Open',
    followupStatus: 'followed up',
  },
  {
    id: 2,
    client: 'Tech Solutions (CD002)',
    type: 'Pending order',
    date: '2025-12-18',
    time: '11:30 AM',
    notes: 'Follow up on order confirmation',
    nextFollowupDate: '2025-12-19',
    nextFollowupTime: '10:00 AM',
    status: 'Open',
    followupStatus: 'still pending',
  },
  {
    id: 3,
    client: 'Global Inc (CR003)',
    type: 'Pending material',
    date: '2025-12-18',
    time: '3:00 PM',
    notes: 'Check material availability',
    nextFollowupDate: '2025-12-19',
    nextFollowupTime: '11:00 AM',
    status: 'Open',
    followupStatus: 'followed up',
  },
  {
    id: 4,
    client: 'Innovation Labs (CS004)',
    type: 'New order',
    date: '2025-12-18',
    time: '4:30 PM',
    notes: 'Proposal discussion',
    nextFollowupDate: '2025-12-21',
    nextFollowupTime: '3:00 PM',
    status: 'Closed',
    followupStatus: 'followed up',
  },
]

const getTypeIcon = (type: string) => {
  if (type === 'New order') return Package
  if (type === 'Pending order') return ShoppingCart
  if (type === 'Pending material') return Box
  return Clock
}

const getTypeColor = (type: string) => {
  if (type === 'New order') return 'text-blue-500 dark:text-blue-400'
  if (type === 'Pending order') return 'text-orange-500 dark:text-orange-400'
  if (type === 'Pending material') return 'text-purple-500 dark:text-purple-400'
  return 'text-gray-500 dark:text-gray-400'
}

export default function SalesHome() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'followed up' | 'still pending'>('all')
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'sales-person' | 'client' | ''>('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [newTask, setNewTask] = useState({
    customerCode: '',
    customerName: '',
    taskType: '',
    salesExecutiveCode: '',
    contactNo: '',
    followupType: '',
    notes: '',
    dueDate: '',
    dueTime: ''
  })

  // Load initial data
  useEffect(() => {
    // Initial data loading can be added here if needed
  }, [])

  const filteredFollowups = todaysFollowups.filter((followup) => {
    if (statusFilter === 'all') return true
    return followup.followupStatus === statusFilter
  })

  const followedUpCount = todaysFollowups.filter((f) => f.followupStatus === 'followed up').length
  const stillPendingCount = todaysFollowups.filter((f) => f.followupStatus === 'still pending').length

  const handleAddTask = () => {
    // Here you would typically send the data to your backend
    console.log('Adding new task:', newTask)
    setIsAddTaskOpen(false)
    // Reset form
    setNewTask({
      customerCode: '',
      customerName: '',
      taskType: '',
      salesExecutiveCode: '',
      contactNo: '',
      followupType: '',
      notes: '',
      dueDate: '',
      dueTime: ''
    })
  }

  const handleDailyUpload = () => {
    // For now, we'll use the client import for all types
    // In a real implementation, you'd have separate endpoints for each type
    setUploadType('client')
    setIsUploadDialogOpen(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadType) return

    setIsUploading(true)
    try {
      let response
      if (uploadType === 'sales-person') {
        response = await salesPersonAPI.import(uploadFile)
      } else {
        response = await clientAPI.import(uploadFile)
      }
      
      console.log('Upload successful:', response)
      
      // Close dialog and reset
      setIsUploadDialogOpen(false)
      setUploadFile(null)
      setUploadType('')
      
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <header className="bg-card border-b border-border px-3 lg:px-4 py-2.5 sticky top-0 z-10 min-h-14 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Dashboard</h1>
      </header>

      <div className="p-3 lg:p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="blur-bg border-blue-200/50 dark:border-blue-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Package className="w-7 h-7 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold">New Orders</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleDailyUpload}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="blur-bg border-orange-200/50 dark:border-orange-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-7 h-7 text-orange-500" />
                  <div>
                    <p className="text-lg font-bold">Pending Orders</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleDailyUpload}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Box className="w-7 h-7 text-purple-500" />
                  <div>
                    <p className="text-lg font-bold">Pending Material</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleDailyUpload}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="blur-bg border-green-200/50 dark:border-green-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-7 h-7 text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Followed Up</p>
                  <p className="text-2xl font-bold">{followedUpCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="blur-bg border-yellow-200/50 dark:border-yellow-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-7 h-7 text-yellow-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Still Pending</p>
                  <p className="text-2xl font-bold">{stillPendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Pending Follow-ups</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new follow-up task with customer details and requirements.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerCode">Customer Code</Label>
                          <Input
                            id="customerCode"
                            value={newTask.customerCode}
                            onChange={(e) => setNewTask({...newTask, customerCode: e.target.value})}
                            placeholder="e.g., CJ001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Customer Name</Label>
                          <Input
                            id="customerName"
                            value={newTask.customerName}
                            onChange={(e) => setNewTask({...newTask, customerName: e.target.value})}
                            placeholder="e.g., Acme Corp"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taskType">Task Type</Label>
                          <Select value={newTask.taskType} onValueChange={(value) => setNewTask({...newTask, taskType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new-order">New Order</SelectItem>
                              <SelectItem value="pending-order">Pending Order</SelectItem>
                              <SelectItem value="pending-material">Pending Material</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salesExecutiveCode">Sales Executive Code</Label>
                          <Input
                            id="salesExecutiveCode"
                            value={newTask.salesExecutiveCode}
                            onChange={(e) => setNewTask({...newTask, salesExecutiveCode: e.target.value})}
                            placeholder="e.g., SE001"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactNo">Contact Number</Label>
                          <Input
                            id="contactNo"
                            value={newTask.contactNo}
                            onChange={(e) => setNewTask({...newTask, contactNo: e.target.value})}
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="followupType">Follow-up Type</Label>
                          <Select value={newTask.followupType} onValueChange={(value) => setNewTask({...newTask, followupType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="visit">Site Visit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes/Details</Label>
                        <Textarea
                          id="notes"
                          value={newTask.notes}
                          onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                          placeholder="Task details and requirements..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueTime">Due Time</Label>
                          <Input
                            id="dueTime"
                            type="time"
                            value={newTask.dueTime}
                            onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTask}>
                        Create Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'followed up' | 'still pending')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="followed up">Followed Up</SelectItem>
                    <SelectItem value="still pending">Still Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFollowups.length === 0 ? (
                <div className="col-span-full">
                  <p className="text-center text-muted-foreground py-8">No follow-ups found</p>
                </div>
              ) : (
                filteredFollowups.map((followup) => {
                  const TypeIcon = getTypeIcon(followup.type)
                  return (
                    <div
                      key={followup.id}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-lg ${
                            followup.type === 'New order' ? 'bg-blue-500/10 dark:bg-blue-400/10' :
                            followup.type === 'Pending order' ? 'bg-orange-500/10 dark:bg-orange-400/10' :
                            followup.type === 'Pending material' ? 'bg-purple-500/10 dark:bg-purple-400/10' :
                            'bg-gray-500/10 dark:bg-gray-400/10'
                          }`}>
                            <TypeIcon className={`w-5 h-5 ${getTypeColor(followup.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-2">{followup.client}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-1 rounded text-sm font-medium ${
                                followup.type === 'New order' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10' :
                                followup.type === 'Pending order' ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10' :
                                followup.type === 'Pending material' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10' :
                                'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-400/10'
                              }`}>
                                {followup.type}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded text-sm font-medium ${
                                  followup.status === 'Open'
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10'
                                    : 'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-400/10'
                                }`}
                              >
                                {followup.status}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded text-sm font-medium ${
                                  followup.followupStatus === 'followed up'
                                    ? 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10'
                                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10'
                                }`}
                              >
                                {followup.followupStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{followup.time}</span>
                          </div>
                        </div>
                      </div>

                      {followup.notes && (
                        <div className="mb-3 pt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Notes: </span>
                            {followup.notes}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Next Follow-up: </span>
                          {followup.nextFollowupDate} at {followup.nextFollowupTime}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <UploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => {
            setIsUploadDialogOpen(false)
            setUploadFile(null)
            setUploadType('')
          }}
          uploadType={uploadType}
          uploadFile={uploadFile}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
        />
      </div>
    </>
  )
}

// Upload Dialog Component
const UploadDialog = ({ 
  isOpen, 
  onClose, 
  uploadType, 
  uploadFile, 
  onFileSelect, 
  onUpload, 
  isUploading,
  fileInputRef 
}: {
  isOpen: boolean
  onClose: () => void
  uploadType: string
  uploadFile: File | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  isUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>Upload {uploadType === 'sales-person' ? 'Sales Person' : 'Client'} Data</DialogTitle>
        <DialogDescription>
          Select an Excel file to import {uploadType === 'sales-person' ? 'sales person' : 'client'} data.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="file">Excel File</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <FileUp className="w-4 h-4 mr-2" />
              {uploadFile ? uploadFile.name : 'Choose File'}
            </Button>
          </div>
          {uploadFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={onUpload} disabled={!uploadFile || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
