import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const overdueFollowups = [
  {
    id: 1,
    client: 'Acme Corp (CJ001)',
    clientType: 'CJ',
    salesperson: 'SE001 - John Doe',
    division: 'Joy',
    type: 'New order',
    date: '2025-12-15',
    time: '10:00 AM',
    status: 'Open',
    daysOverdue: 3,
  },
  {
    id: 2,
    client: 'Tech Solutions (CD002)',
    clientType: 'CD',
    salesperson: 'SE002 - Jane Smith',
    division: 'OD',
    type: 'Pending order',
    date: '2025-12-14',
    time: '2:00 PM',
    status: 'Open',
    daysOverdue: 4,
  },
  {
    id: 3,
    client: 'Global Inc (CR003)',
    clientType: 'CR',
    salesperson: 'SE003 - Mike Johnson',
    division: 'Retail',
    type: 'Pending material',
    date: '2025-12-13',
    time: '11:30 AM',
    status: 'Open',
    daysOverdue: 5,
  },
]

const noFollowupAlerts = [
  {
    id: 1,
    client: 'Innovation Labs (CS004)',
    clientType: 'CS',
    salesperson: 'SE004 - Sarah Williams',
    division: 'HC (South)',
    lastFollowupDate: '2025-12-09',
    daysWithoutFollowup: 7,
  },
  {
    id: 2,
    client: 'Future Systems (CJ005)',
    clientType: 'CJ',
    salesperson: 'SE001 - John Doe',
    division: 'Joy',
    lastFollowupDate: '2025-12-08',
    daysWithoutFollowup: 8,
  },
]

type ViewFilter = 'all' | 'client' | 'salesperson' | 'division'

export default function AdminHome() {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')

  const filteredOverdue = overdueFollowups.filter((followup) => {
    if (viewFilter === 'all') return true
    if (viewFilter === 'client') return followup.clientType
    if (viewFilter === 'salesperson') return followup.salesperson
    if (viewFilter === 'division') return followup.division
    return true
  })

  const filteredAlerts = noFollowupAlerts.filter((alert) => {
    if (viewFilter === 'all') return true
    if (viewFilter === 'client') return alert.clientType
    if (viewFilter === 'salesperson') return alert.salesperson
    if (viewFilter === 'division') return alert.division
    return true
  })

  const overdueCount = filteredOverdue.length
  const alertsCount = filteredAlerts.length

  return (
    <>
      <header className="bg-card border-b border-border px-3 lg:px-4 py-2.5 sticky top-0 z-10 min-h-14 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Dashboard</h1>
        <Select value={viewFilter} onValueChange={(value) => setViewFilter(value as ViewFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="salesperson">Salesperson</SelectItem>
            <SelectItem value="division">Division</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="p-3 lg:p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-7 h-7 text-orange-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Follow-ups</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-7 h-7 text-yellow-400" />
                <div>
                  <p className="text-sm text-muted-foreground">No Follow-up Alerts</p>
                  <p className="text-2xl font-bold">{alertsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardHeader>
              <CardTitle>Overdue Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOverdue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No overdue follow-ups</p>
                ) : (
                  filteredOverdue.map((followup) => (
                    <div
                      key={followup.id}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-2">{followup.client}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10">
                              {followup.daysOverdue} days overdue
                            </span>
                            <span className="px-2.5 py-1 rounded text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10">
                              {followup.status}
                            </span>
                            <span className={`px-2.5 py-1 rounded text-sm font-medium ${
                              followup.type === 'New order' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10' :
                              followup.type === 'Pending order' ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10' :
                              followup.type === 'Pending material' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10' :
                              'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-400/10'
                            }`}>
                              {followup.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{followup.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Salesperson: </span>
                          {followup.salesperson}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Division: </span>
                          {followup.division}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Due: </span>
                          {followup.date} at {followup.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardHeader>
              <CardTitle>Alerts: No Follow-up in 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No alerts</p>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-2">{alert.client}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded text-sm font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10">
                              {alert.daysWithoutFollowup} days without follow-up
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50 space-y-1.5">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Salesperson: </span>
                          {alert.salesperson}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Division: </span>
                          {alert.division}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Last Follow-up: </span>
                          {alert.lastFollowupDate}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
