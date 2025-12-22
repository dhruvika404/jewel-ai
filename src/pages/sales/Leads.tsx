import { Card, CardContent,CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Phone, User, Building, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { clientAPI } from '@/services/api'

export default function SalesLeads() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Contacted' | 'Qualified' | 'Proposal'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load clients from API
  useEffect(() => {
    loadClients()
  }, [currentPage, searchTerm])

  const loadClients = async () => {
    setLoading(true)
    try {
      const response = await clientAPI.getAll({
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        role: 'client'
      })
      
      setClients(response.data || [])
      setTotalPages(Math.ceil((response.total || 0) / 10))
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  // Convert API client data to lead format
  const convertClientToLead = (client: any) => ({
    id: client.id,
    name: client.name || 'N/A',
    company: client.company || 'N/A',
    customerCode: client.customerCode || client.code || 'N/A',
    status: client.status || 'New',
    value: client.value || '$0',
    date: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    contactNo: client.phone || client.contactNo || 'N/A',
    salesExecutive: client.salesExecutive || client.assignedTo || 'N/A',
    leadType: client.leadType || 'New Order',
    notes: client.notes || client.description || ''
  })

  const filteredLeads = clients
    .map(convertClientToLead)
    .filter((lead) => {
      return statusFilter === 'all' || lead.status === statusFilter
    })

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  return (
    <>
      <header className="bg-card border-b border-border px-4 lg:px-6 py-3 sticky top-0 z-10 min-h-16 flex items-center justify-between">
        <h1 className="text-base lg:text-lg font-semibold text-foreground">My Leads</h1>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <Card className="blur-bg border-purple-200/50 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads..." 
                className="border-0 bg-transparent" 
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> 
                <span>Loading clients...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No clients found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
                            <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1">{lead.name}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                              <Building className="w-4 h-4" />
                              <span>{lead.company} ({lead.customerCode})</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                              <span className={`px-2.5 py-1 rounded text-sm font-medium ${
                                lead.status === 'New'
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10'
                                  : lead.status === 'Contacted'
                                  ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-400/10'
                                  : lead.status === 'Qualified'
                                  ? 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10'
                                  : 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10'
                              }`}>
                                {lead.status}
                              </span>
                              <span className="px-2.5 py-1 rounded text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/10">
                                {lead.leadType}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                <span>{lead.contactNo}</span>
                              </div>
                              <p><span className="font-medium">Executive:</span> {lead.salesExecutive}</p>
                              <p><span className="font-medium">Date:</span> {lead.date}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">{lead.value}</p>
                          <Button variant="ghost" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {lead.notes && (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Notes: </span>
                            {lead.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
