import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, TrendingUp, CheckCircle, Database, Loader2, FileSpreadsheet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { dashboardAPI, newOrderAPI, pendingOrderAPI, pendingMaterialAPI } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { usePageHeader } from '@/contexts/PageHeaderProvider'

interface SystemStats {
  todaysTotalPendingFollowUps: number
  todaysTotalTakenFollowUps: number
  last7daysTotalPendingFollowUps: number
  todaysTotalPendingFollowUpsOfPendingOrder: number
  todaysTotalTakenFollowUpsOfPendingOrder: number
  last7DayPendingFollowUpsOfPendingOrder: number
  todaysTotalPendingFollowUpsOfPendingMaterial: number
  todaysTotalTakenFollowUpsOfPendingMaterial: number
  last7DayPendingFollowUpsOfPendingMaterial: number
  todaysTotalPendingFollowUpsOfNewOrder: number
  todaysTotalTakenFollowUpsOfNewOrder: number
  last7DayPendingFollowUpsOfNewOrder: number
}

interface FollowUpItem {
  id: string
  clientName: string
  clientCode: string
  salesperson?: string
  type: string
  daysOverdue?: number
  nextFollowUpDate: string
}

export default function AdminHome() {
  const { setHeader } = usePageHeader()
  const [systemStats, setSystemStats] = useState<SystemStats>({
    todaysTotalPendingFollowUps: 0,
    todaysTotalTakenFollowUps: 0,
    last7daysTotalPendingFollowUps: 0,
    todaysTotalPendingFollowUpsOfPendingOrder: 0,
    todaysTotalTakenFollowUpsOfPendingOrder: 0,
    last7DayPendingFollowUpsOfPendingOrder: 0,
    todaysTotalPendingFollowUpsOfPendingMaterial: 0,
    todaysTotalTakenFollowUpsOfPendingMaterial: 0,
    last7DayPendingFollowUpsOfPendingMaterial: 0,
    todaysTotalPendingFollowUpsOfNewOrder: 0,
    todaysTotalTakenFollowUpsOfNewOrder: 0,
    last7DayPendingFollowUpsOfNewOrder: 0
  })

  // Set header
  useEffect(() => {
    setHeader({ title: 'Dashboard' })
  }, [])

  const [overdueFollowups, setOverdueFollowups] = useState<FollowUpItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, newOrderRes, pendingOrderRes, pendingMaterialRes] = await Promise.all([
        dashboardAPI.getOverview(),
        newOrderAPI.getFollowUpsByClientCode({ page: 1, size: 500 }),
        pendingOrderAPI.getFollowUpsByClientCode({ page: 1, size: 500, clientCode: '' }),
        pendingMaterialAPI.getFollowUpsByClientCode({ page: 1, size: 500, clientCode: '' })
      ])

      if (statsRes.success !== false && statsRes.data) {
        setSystemStats(statsRes.data)
      }

      const allFollowUps: FollowUpItem[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const processApiResponse = (res: any, type: string) => {
        if (res.data) {
          res.data.forEach((item: any) => {
            if (item.followUps) {
              item.followUps.forEach((fu: any) => {
                const fuDate = new Date(fu.nextFollowUpDate)
                fuDate.setHours(0, 0, 0, 0)
                
                if (fuDate < today && fu.followUpStatus?.toLowerCase() !== 'completed') {
                  const diffTime = Math.abs(today.getTime() - fuDate.getTime())
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  
                  allFollowUps.push({
                    id: fu._id || fu.id || Math.random().toString(),
                    clientName: item.designName || item.orderId || item.materialName || item.clientCode,
                    clientCode: item.clientCode,
                    type: type,
                    daysOverdue: diffDays,
                    nextFollowUpDate: fu.nextFollowUpDate
                  })
                }
              })
            }
          })
        }
      }

      processApiResponse(newOrderRes, 'New Order')
      processApiResponse(pendingOrderRes, 'Pending Order')
      processApiResponse(pendingMaterialRes, 'Pending Material')

      // Sort by most overdue and limited to top 6
      setOverdueFollowups(allFollowUps.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0)).slice(0, 6))

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load real-time dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            label="Today's Pending" 
            value={systemStats.todaysTotalPendingFollowUps} 
            icon={Clock} 
            color="blue"
            loading={loading}
          />
          <StatCard 
            label="Today's Taken" 
            value={systemStats.todaysTotalTakenFollowUps} 
            icon={CheckCircle} 
            color="emerald"
            loading={loading}
          />
          <StatCard 
            label="7-Day Pending" 
            value={systemStats.last7daysTotalPendingFollowUps} 
            icon={AlertCircle} 
            color="orange"
            loading={loading}
          />
          <StatCard 
            label="Total Activity" 
            value={systemStats.todaysTotalPendingFollowUps + systemStats.todaysTotalTakenFollowUps} 
            icon={TrendingUp} 
            color="purple"
            loading={loading}
          />
        </div>

        {/* Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BreakdownSection 
            title="New Orders" 
            icon={FileSpreadsheet}
            color="emerald"
            pending={systemStats.todaysTotalPendingFollowUpsOfNewOrder}
            taken={systemStats.todaysTotalTakenFollowUpsOfNewOrder}
            last7={systemStats.last7DayPendingFollowUpsOfNewOrder}
          />
          <BreakdownSection 
            title="Pending Orders" 
            icon={FileSpreadsheet}
            color="orange"
            pending={systemStats.todaysTotalPendingFollowUpsOfPendingOrder}
            taken={systemStats.todaysTotalTakenFollowUpsOfPendingOrder}
            last7={systemStats.last7DayPendingFollowUpsOfPendingOrder}
          />
          <BreakdownSection 
            title="Pending Materials" 
            icon={Database}
            color="purple"
            pending={systemStats.todaysTotalPendingFollowUpsOfPendingMaterial}
            taken={systemStats.todaysTotalTakenFollowUpsOfPendingMaterial}
            last7={systemStats.last7DayPendingFollowUpsOfPendingMaterial}
          />
        </div>

        {/* Overdue Follow-ups List */}
        <div className="grid grid-cols-1 gap-6">
            <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Real-time Overdue follow-ups
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span>Calculating overdue follow-ups...</span>
                            </div>
                        ) : overdueFollowups.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic">No overdue follow-ups at the moment.</div>
                        ) : overdueFollowups.map((item, idx) => (
                            <div key={item.id + idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-medium text-sm text-gray-900">{item.clientName} ({item.clientCode})</div>
                                    <div className="text-xs text-gray-500 mt-1">{item.type} • Due {new Date(item.nextFollowUpDate).toLocaleDateString()}</div>
                                </div>
                                <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 shadow-none">
                                    {item.daysOverdue}d overdue
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colors[color]} rounded-full flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{loading ? '...' : value}</p>
        </div>
      </div>
    </Card>
  )
}

function BreakdownSection({ title, icon: Icon, color, pending, taken, last7 }: any) {
    const colors: any = {
        emerald: 'text-emerald-500',
        orange: 'text-orange-500',
        purple: 'text-purple-500'
    }

    return (
        <Card className="border shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colors[color]}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Pending</div>
                        <div className="text-xl font-bold text-gray-900">{pending}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Taken</div>
                        <div className="text-xl font-bold text-gray-900">{taken}</div>
                    </div>
                </div>
                <div className="pt-3 border-t flex items-center justify-between text-xs">
                    <span className="text-gray-500 italic">Last 7 days pending</span>
                    <span className="font-bold text-gray-900">{last7}</span>
                </div>
            </CardContent>
        </Card>
    )
}
