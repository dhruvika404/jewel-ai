import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Plus, Package, ShoppingCart, Box } from 'lucide-react'
import { useState } from 'react'
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

const followups = [
  { 
    id: 1, 
    client: 'Acme Corp (CJ001)', 
    type: 'New Order', 
    followupType: 'Call',
    dueDate: '2025-12-18', 
    dueTime: '10:00 AM',
    status: 'Pending',
    salesExecutive: 'SE001',
    contactNo: '+1-555-0123',
    notes: 'Discuss new product catalog and pricing'
  },
  { 
    id: 2, 
    client: 'Tech Solutions (CD002)', 
    type: 'Pending Order', 
    followupType: 'Email',
    dueDate: '2025-12-17', 
    dueTime: '2:00 PM',
    status: 'Overdue',
    salesExecutive: 'SE002',
    contactNo: '+1-555-0124',
    notes: 'Follow up on order confirmation and delivery timeline'
  },
  { 
    id: 3, 
    client: 'Global Inc (CR003)', 
    type: 'Pending Material', 
    followupType: 'Meeting',
    dueDate: '2025-12-20', 
    dueTime: '11:00 AM',
    status: 'Pending',
    salesExecutive: 'SE001',
    contactNo: '+1-555-0125',
    notes: 'Check material availability and alternative options'
  },
  { 
    id: 4, 
    client: 'Innovation Labs (CS004)', 
    type: 'New Order', 
    followupType: 'Call',
    dueDate: '2025-12-16', 
    dueTime: '3:00 PM',
    status: 'Completed',
    salesExecutive: 'SE003',
    contactNo: '+1-555-0126',
    notes: 'Proposal discussion completed, awaiting client response'
  },
  { 
    id: 5, 
    client: 'Future Systems (CF005)', 
    type: 'Pending Order', 
    followupType: 'Visit',
    dueDate: '2025-12-19', 
    dueTime: '9:00 AM',
    status: 'Pending',
    salesExecutive: 'SE002',
    contactNo: '+1-555-0127',
    notes: 'Site visit to discuss installation requirements'
  },
]

export default function SalesFollowups() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Overdue' | 'Completed'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'New Order' | 'Pending Order' | 'Pending Material'>('all')
  const [isCreateFollowupOpen, setIsCreateFollowupOpen] = useState(false)
  const [newFollowup, setNewFollowup] = useState({
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

  const filteredFollowups = followups.filter((followup) => {
    const statusMatch = statusFilter === 'all' || followup.status === statusFilter
    const typeMatch = typeFilter === 'all' || followup.type === typeFilter
    return statusMatch && typeMatch
  })

  const handleCreateFollowup = () => {
    console.log('Creating new followup:', newFollowup)
    setIsCreateFollowupOpen(false)
    setNewFollowup({
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

  const getTypeIcon = (type: string) => {
    if (type === 'New Order') return Package
    if (type === 'Pending Order') return ShoppingCart
    if (type === 'Pending Material') return Box
    return Clock
  }

  const getTypeColor = (type: string) => {
    if (type === 'New Order') return 'text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10'
    if (type === 'Pending Order') return 'text-orange-500 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10'
    if (type === 'Pending Material') return 'text-purple-500 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10'
    return 'text-gray-500 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-400/10'
  }

  return (
    <>
      <header className="bg-card border-b border-border px-3 lg:px-4 py-2.5 sticky top-0 z-10 min-h-14 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Follow-ups Management</h1>
        <Dialog open={isCreateFollowupOpen} onOpenChange={setIsCreateFollowupOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Token & Pending Follow-up</DialogTitle>
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
                    value={newFollowup.customerCode}
                    onChange={(e) => setNewFollowup({...newFollowup, customerCode: e.target.value})}
                    placeholder="e.g., CJ001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={newFollowup.customerName}
                    onChange={(e) => setNewFollowup({...newFollowup, customerName: e.target.value})}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={newFollowup.taskType} onValueChange={(value) => setNewFollowup({...newFollowup, taskType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Order">New Order</SelectItem>
                      <SelectItem value="Pending Order">Pending Order</SelectItem>
                      <SelectItem value="Pending Material">Pending Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesExecutiveCode">Sales Executive Code</Label>
                  <Input
                    id="salesExecutiveCode"
                    value={newFollowup.salesExecutiveCode}
                    onChange={(e) => setNewFollowup({...newFollowup, salesExecutiveCode: e.target.value})}
                    placeholder="e.g., SE001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNo">Contact Number</Label>
                  <Input
                    id="contactNo"
                    value={newFollowup.contactNo}
                    onChange={(e) => setNewFollowup({...newFollowup, contactNo: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followupType">Follow-up Type</Label>
                  <Select value={newFollowup.followupType} onValueChange={(value) => setNewFollowup({...newFollowup, followupType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Phone Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Visit">Site Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes/Details</Label>
                <Textarea
                  id="notes"
                  value={newFollowup.notes}
                  onChange={(e) => setNewFollowup({...newFollowup, notes: e.target.value})}
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
                    value={newFollowup.dueDate}
                    onChange={(e) => setNewFollowup({...newFollowup, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={newFollowup.dueTime}
                    onChange={(e) => setNewFollowup({...newFollowup, dueTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFollowupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFollowup}>
                Create Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-3 lg:p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-7 h-7 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-7 h-7 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">All Followups</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-[130px] text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                <SelectTrigger className="w-[150px] text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="New Order">New Order</SelectItem>
                  <SelectItem value="Pending Order">Pending Order</SelectItem>
                  <SelectItem value="Pending Material">Pending Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFollowups.length > 0 ? (
              filteredFollowups.map((followup) => {
                const TypeIcon = getTypeIcon(followup.type)
                return (
                  <div
                    key={followup.id}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-lg ${getTypeColor(followup.type)}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-2">{followup.client}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            <span className={`px-2.5 py-1 rounded text-sm font-medium ${getTypeColor(followup.type)}`}>
                              {followup.type}
                            </span>
                            <span className={`px-2.5 py-1 rounded text-sm font-medium ${
                              followup.status === 'Completed'
                                ? 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10'
                                : followup.status === 'Overdue'
                                ? 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10'
                                : 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10'
                            }`}>
                              {followup.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><span className="font-medium">Follow-up:</span> {followup.followupType}</p>
                            <p><span className="font-medium">Executive:</span> {followup.salesExecutive}</p>
                            <p><span className="font-medium">Contact:</span> {followup.contactNo}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{followup.dueTime}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{followup.dueDate}</p>
                      </div>
                    </div>

                    {followup.notes && (
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Notes: </span>
                          {followup.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="col-span-full">
                <p className="text-center text-muted-foreground py-8">No follow-ups found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
