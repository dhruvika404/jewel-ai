import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, Package, ShoppingCart, Box, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { newOrderAPI, pendingOrderAPI, pendingMaterialAPI } from '@/services/api'
import { toast } from 'sonner'
import { usePageHeader } from '@/contexts/PageHeaderProvider'

interface FollowUp {
  id: string
  followUpMsg: string
  nextFollowUpDate: string
  followUpStatus: string
  createdAt: string
  clientCode?: string
  clientName?: string
  type?: string
}

const getTypeIcon = (type: string) => {
  if (type === 'New Order' || type === 'new-order') return Package
  if (type === 'Pending Order' || type === 'pending-order') return ShoppingCart
  if (type === 'Pending Material' || type === 'pending-material') return Box
  return Clock
}

const getTypeColor = (type: string) => {
  if (type === 'New Order' || type === 'new-order') return 'text-blue-500 dark:text-blue-400'
  if (type === 'Pending Order' || type === 'pending-order') return 'text-orange-500 dark:text-orange-400'
  if (type === 'Pending Material' || type === 'pending-material') return 'text-purple-500 dark:text-purple-400'
  return 'text-gray-500 dark:text-gray-400'
}

export default function SalesHome() {
  const { setHeader } = usePageHeader()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [loading, setLoading] = useState(false)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)

  // Set header
  useEffect(() => {
    setHeader({ title: 'Dashboard' })
  }, [])

  // Load all follow-ups
  const loadFollowUps = async () => {
    setLoading(true)
    try {
      const [newOrderRes, pendingOrderRes, pendingMaterialRes] = await Promise.all([
        newOrderAPI.getFollowUpsByClientCode({ page: 1, size: 1000 }),
        pendingOrderAPI.getFollowUpsByClientCode({ page: 1, size: 1000, clientCode: '' }),
        pendingMaterialAPI.getFollowUpsByClientCode({ page: 1, size: 1000, clientCode: '' })
      ])

      const allFollowUps: FollowUp[] = []
      
      // Process new orders
      if (newOrderRes.data) {
        newOrderRes.data.forEach((item: any) => {
          if (item.followUps && item.followUps.length > 0) {
            item.followUps.forEach((fu: any) => {
              allFollowUps.push({
                ...fu,
                clientCode: item.clientCode,
                clientName: item.designName || item.clientCode,
                type: 'New Order'
              })
            })
          }
        })
      }

      // Process pending orders
      if (pendingOrderRes.data) {
        pendingOrderRes.data.forEach((item: any) => {
          if (item.followUps && item.followUps.length > 0) {
            item.followUps.forEach((fu: any) => {
              allFollowUps.push({
                ...fu,
                clientCode: item.clientCode,
                clientName: item.orderId || item.clientCode,
                type: 'Pending Order'
              })
            })
          }
        })
      }

      // Process pending materials
      if (pendingMaterialRes.data) {
        pendingMaterialRes.data.forEach((item: any) => {
          if (item.followUps && item.followUps.length > 0) {
            item.followUps.forEach((fu: any) => {
              allFollowUps.push({
                ...fu,
                clientCode: item.clientCode,
                clientName: item.materialName || item.clientCode,
                type: 'Pending Material'
              })
            })
          }
        })
      }

      setFollowUps(allFollowUps)
      calculateCounts(allFollowUps)
    } catch (error: any) {
      console.error('Error loading follow-ups:', error)
      toast.error('Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  const calculateCounts = (followUpsList: FollowUp[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let todayC = 0
    let pendingC = 0
    let overdueC = 0

    followUpsList.forEach(fu => {
      const followUpDate = new Date(fu.nextFollowUpDate)
      followUpDate.setHours(0, 0, 0, 0)

      const isCompleted = fu.followUpStatus?.toLowerCase() === 'completed'

      if (followUpDate.getTime() === today.getTime()) {
        todayC++
      }
      
      if (!isCompleted && followUpDate >= today) {
        pendingC++
      }
      
      if (!isCompleted && followUpDate < today) {
        overdueC++
      }
    })

    setTodayCount(todayC)
    setPendingCount(pendingC)
    setOverdueCount(overdueC)
  }

  useEffect(() => {
    loadFollowUps()
  }, [])

  const filteredFollowups = followUps.filter((followup) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'completed') return followup.followUpStatus?.toLowerCase() === 'completed'
    if (statusFilter === 'pending') return followup.followUpStatus?.toLowerCase() !== 'completed'
    return true
  })

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="blur-bg border-blue-200/50 dark:border-blue-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-7 h-7 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Follow-ups</p>
                  <p className="text-2xl font-bold">{loading ? '...' : todayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="blur-bg border-yellow-200/50 dark:border-yellow-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <Package className="w-7 h-7 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Follow-ups</p>
                  <p className="text-2xl font-bold">{loading ? '...' : pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="blur-bg border-red-200/50 dark:border-red-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-7 h-7 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Follow-ups</p>
                  <p className="text-2xl font-bold">{loading ? '...' : overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-ups List */}
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Follow-ups</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'completed')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFollowups.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                     <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                     <p className="text-muted-foreground">No follow-ups found</p>
                  </div>
                ) : (
                  filteredFollowups.map((followup, index) => {
                    const TypeIcon = getTypeIcon(followup.type || '')
                    const followUpDate = new Date(followup.nextFollowUpDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    followUpDate.setHours(0, 0, 0, 0)
                    
                    const isOverdue = followUpDate < today && followup.followUpStatus?.toLowerCase() !== 'completed'
                    const isToday = followUpDate.getTime() === today.getTime()

                    return (
                      <div
                        key={`${followup.id}-${index}`}
                        className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2.5 rounded-lg ${
                              followup.type === 'New Order' ? 'bg-blue-500/10 dark:bg-blue-400/10' :
                              followup.type === 'Pending Order' ? 'bg-orange-500/10 dark:bg-orange-400/10' :
                              followup.type === 'Pending Material' ? 'bg-purple-500/10 dark:bg-purple-400/10' :
                              'bg-gray-500/10 dark:bg-gray-400/10'
                            }`}>
                              <TypeIcon className={`w-5 h-5 ${getTypeColor(followup.type || '')}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base mb-2">
                                {followup.clientName} ({followup.clientCode})
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                                  followup.type === 'New Order' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10' :
                                  followup.type === 'Pending Order' ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10' :
                                  followup.type === 'Pending Material' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10' :
                                  'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-400/10'
                                }`}>
                                  {followup.type}
                                </span>
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                                  followup.followUpStatus?.toLowerCase() === 'completed'
                                    ? 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10'
                                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10'
                                }`}>
                                  {followup.followUpStatus}
                                </span>
                                {isOverdue && (
                                  <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10">
                                    Overdue
                                  </span>
                                )}
                                {isToday && (
                                  <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10">
                                    Today
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {followup.followUpMsg && (
                          <div className="mb-3 pt-3 border-t border-border/50">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Message: </span>
                              {followup.followUpMsg}
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                            <span className="text-foreground">Next: </span>
                            {new Date(followup.nextFollowUpDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
