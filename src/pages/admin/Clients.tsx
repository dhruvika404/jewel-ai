import { Card, CardContent, CardHeader} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const clients = [
  { id: 1, name: 'Acme Corp', email: 'contact@acme.com', status: 'Active', value: '$50,000' },
  { id: 2, name: 'Tech Solutions', email: 'info@techsol.com', status: 'Active', value: '$35,000' },
  { id: 3, name: 'Global Industries', email: 'sales@global.com', status: 'Pending', value: '$25,000' },
  { id: 4, name: 'Innovation Labs', email: 'hello@innovate.com', status: 'Active', value: '$60,000' },
]

export default function AdminClients() {
  return (
    <>
      <header className="bg-card border-b border-border px-4 lg:px-6 py-3 sticky top-0 z-10 min-h-16 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">Clients</h1>
      </header>

      <div className="p-4 lg:p-6 space-y-6">

      <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="border-0 bg-transparent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Value</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-white/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">{client.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{client.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.status === 'Active'
                          ? 'text-green-500 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10'
                          : 'text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{client.value}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
