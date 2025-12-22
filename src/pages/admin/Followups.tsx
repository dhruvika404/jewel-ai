import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const followups = [
  { id: 1, client: 'Acme Corp', type: 'Email', dueDate: '2025-12-18', status: 'Pending', assignee: 'John Doe' },
  { id: 2, client: 'Tech Solutions', type: 'Call', dueDate: '2025-12-17', status: 'Overdue', assignee: 'Jane Smith' },
  { id: 3, client: 'Global Industries', type: 'Meeting', dueDate: '2025-12-20', status: 'Pending', assignee: 'Mike Johnson' },
  { id: 4, client: 'Innovation Labs', type: 'Email', dueDate: '2025-12-16', status: 'Completed', assignee: 'Sarah Williams' },
]

export default function AdminFollowups() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Overdue' | 'Completed'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Email' | 'Call' | 'Meeting'>('all')

  const filteredFollowups = followups.filter((followup) => {
    const statusMatch = statusFilter === 'all' || followup.status === statusFilter
    const typeMatch = typeFilter === 'all' || followup.type === typeFilter
    return statusMatch && typeMatch
  })

  return (
    <>
      <header className="bg-card border-b border-border px-3 lg:px-4 py-2.5 sticky top-0 z-10 min-h-14 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Followups</h1>
      </header>

      <div className="p-3 lg:p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold">5</p>
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
                <p className="text-2xl font-bold">156</p>
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
                <SelectTrigger className="w-[130px] text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/40 dark:bg-slate-700/20">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Assignee</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowups.length > 0 ? (
                  filteredFollowups.map((followup) => (
                    <tr key={followup.id} className="border-b border-border/50 hover:bg-accent/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground text-sm">{followup.client}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                          <span>{followup.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{followup.dueDate}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{followup.assignee}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center ${
                          followup.status === 'Completed'
                            ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15'
                            : followup.status === 'Overdue'
                            ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15'
                        }`}>
                          {followup.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {followup.status === 'Overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {followup.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          {followup.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center text-muted-foreground">
                      <p className="text-sm">No followups found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
