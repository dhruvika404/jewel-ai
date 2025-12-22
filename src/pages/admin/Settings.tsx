import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon } from 'lucide-react'

export default function AdminSettings() {
  return (
    <>
      <header className="bg-card border-b border-border px-4 lg:px-6 py-3 sticky top-0 z-10 min-h-16 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Settings</h1>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Update your system preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" placeholder="Jewel AI" defaultValue="Jewel AI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" type="email" placeholder="admin@jewel.com" defaultValue="admin@jewel.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" placeholder="UTC" defaultValue="UTC" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage team members and roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div>
                        <p className="font-semibold">Team Member {i}</p>
                        <p className="text-sm text-muted-foreground">member{i}@jewel.com</p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Alerts</span>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark Mode</span>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
              <CardHeader>
                <CardTitle>System Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-semibold">1.0.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">Dec 17, 2025</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-500 dark:text-green-400">Active</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Followups Section */}
        <div className="mt-8">
          <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
            <CardHeader>
              <CardTitle>All Followups</CardTitle>
              <CardDescription>Track and manage all followup tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'John Smith', type: 'Email', date: '2025-12-18', status: 'Pending', statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                  { name: 'Sarah Johnson', type: 'Call', date: '2025-12-17', status: 'Overdue', statusColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
                  { name: 'Mike Davis', type: 'Meeting', date: '2025-12-20', status: 'Pending', statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                  { name: 'Emma Wilson', type: 'Email', date: '2025-12-16', status: 'Completed', statusColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                  { name: 'Alex Brown', type: 'Call', date: '2025-12-19', status: 'Pending', statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                ].map((followup, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{followup.name}</p>
                      <p className="text-sm text-muted-foreground">{followup.type} • {followup.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
