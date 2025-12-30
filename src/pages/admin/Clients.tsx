
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TablePagination from '@/components/ui/table-pagination'
import { Upload, Loader2, Eye, CheckCircle, XCircle, AlertTriangle, MessageSquare, Plus, Pencil, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { clientAPI, dashboardAPI, pendingOrderAPI, pendingMaterialAPI, newOrderAPI } from '@/services/api'
import { ClientModal } from '@/components/modals/ClientModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Client interface
interface Client {
  uuid: string
  userCode: string
  name: string
  city?: string
  role: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  pendingMaterial?: FollowUpSummary
  pendingOrder?: FollowUpSummary
  newOrder?: FollowUpSummary
}

interface FollowUpSummary {
    uuid: string
    clientCode: string
    status: string
    nextFollowUpDate: string
    lastFollowUpDate: string
    lastFollowUpMsg: string
}

interface ImportResult {
  success: boolean
  message: string
  data?: {
    successCount: number
    failureCount: number
    failedRecords: Array<{
      rowNo: number
      reason: string
    }>
  }
}

import { usePageHeader } from '@/contexts/PageHeaderProvider'

export default function Clients() {
  const { setHeader } = usePageHeader()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [importType, setImportType] = useState('clients')
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  // Set header
  useEffect(() => {
    setHeader({
      title: 'Clients',
      search: {
        placeholder: 'Search clients...',
        value: searchQuery,
        onChange: (val) => setSearchQuery(val)
      },
      children: (
        <>
          <Button 
            variant="outline"
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </>
      )
    })
  }, [searchQuery])

  // Load clients data and stats
  const loadData = async () => {
    setLoading(true)
    let currentTotalItems = 0
    try {
      // Load Clients List
      const response = await clientAPI.getAll({
        page: currentPage,
        size: pageSize,
        search: searchQuery,
        role: 'client'
      })
      
      if (response.success !== false) {
        // Handle both possible structures: response.data.data or response.data
        if (response.data?.data) {
          setClients(response.data.data)
          currentTotalItems = response.data.totalItems || 0
          setTotalItems(currentTotalItems)
        } else {
          setClients(response.data || [])
          currentTotalItems = response.data?.length || 0
          setTotalItems(currentTotalItems)
        }
      } else {
        toast.error('Failed to load clients')
      }

      // Load Stats
      const statsResponse = await dashboardAPI.getOverview()
      if (statsResponse.success !== false && statsResponse.data) {
          setStats({
              total: statsResponse.data.totalClients || 0,
              active: statsResponse.data.activeClients || 0,
              inactive: statsResponse.data.inactiveClients || 0
          })
      }

    } catch (error: any) {
      toast.error('Error loading data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 500)
    return () => clearTimeout(timer)
  }, [currentPage, pageSize, searchQuery])

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])


  const handleUpload = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    setImportResult(null)
    try {
      let result
      switch (importType) {
        case 'pending-order':
          result = await pendingOrderAPI.import(uploadFile)
          break
        case 'pending-material':
          result = await pendingMaterialAPI.import(uploadFile)
          break
        case 'new-order':
          result = await newOrderAPI.import(uploadFile)
          break
        default:
          result = await clientAPI.import(uploadFile)
      }
      
      setImportResult(result)
      if (result.success) {
          toast.success(result.message || 'Import processed')
          loadData() // Refresh list in background
          resetUpload() // Close modal on success
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }
  
  const resetUpload = () => {
      setShowUploadDialog(false)
      setUploadFile(null)
      setImportResult(null)
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  // Render Helper for FollowUp Summary Cell
  const FollowUpCell = ({ data }: { data?: FollowUpSummary }) => {
      if (!data) return <span className="text-gray-400 text-xs">-</span>
      return (
          <div className="flex flex-col gap-1 min-w-[200px]">
              <div className="flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 line-clamp-2" title={data.lastFollowUpMsg}>
                      {data.lastFollowUpMsg}
                  </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 ml-4">
                   {data.lastFollowUpDate && (
                       <span className="whitespace-nowrap">Last Follow up: {new Date(data.lastFollowUpDate).toLocaleDateString()}</span>
                   )}
                   {data.nextFollowUpDate && (
                       <span className="whitespace-nowrap font-medium text-blue-600">Next Follow up: {new Date(data.nextFollowUpDate).toLocaleDateString()}</span>
                   )}
              </div>
          </div>
      )
  }

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Clients</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Active Clients</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '...' : stats.active}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Inactive Clients</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '...' : stats.inactive}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Clients Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700 w-[250px]">Client Name</TableHead>
                    <TableHead className="font-medium text-gray-700 w-[100px]">Code</TableHead>
                    <TableHead className="font-medium text-gray-700 w-[250px]">Pending Material</TableHead>
                    <TableHead className="font-medium text-gray-700 w-[250px]">Pending Orders</TableHead>
                    <TableHead className="font-medium text-gray-700 w-[250px]">New Orders</TableHead>
                    <TableHead className="font-medium text-gray-700 text-center w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.uuid} className="hover:bg-gray-50">
                      <TableCell className="align-top py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                            {client.name?.charAt(0) || client.userCode?.charAt(0) || 'C'}
                          </div>
                          <div>
                              <div className="font-medium text-gray-900">{client.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{client.city}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 align-top py-4">{client.userCode}</TableCell>
                      
                      <TableCell className="align-top py-4">
                          <FollowUpCell data={client.pendingMaterial} />
                      </TableCell>
                      <TableCell className="align-top py-4">
                          <FollowUpCell data={client.pendingOrder} />
                      </TableCell>
                      <TableCell className="align-top py-4">
                          <FollowUpCell data={client.newOrder} />
                      </TableCell>

                      <TableCell className="align-top py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/admin/clients/${client.uuid}`} state={{ client }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                            title="Edit Client"
                            onClick={() => {
                              setEditingClient(client)
                              setShowEditModal(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No clients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="p-4 border-t bg-white flex justify-end">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </div>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
          if (!open) resetUpload()
          else setShowUploadDialog(true)
      }}>
        <DialogContent className={`${importResult ? 'max-w-4xl' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle>
                {importResult ? 'Import Processing Result' : 
                 importType === 'clients' ? 'Import Clients' :
                 importType === 'pending-order' ? 'Import Pending Orders' :
                 importType === 'pending-material' ? 'Import Pending Material' :
                 'Import New Orders'}
            </DialogTitle>
            <DialogDescription>
              {importResult ? 'Import Processing Result' : 'Upload an Excel file to import data'}
            </DialogDescription>
          </DialogHeader>
          
          {!importResult ? (
              // Original Upload Form
              <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Import Type</Label>
                      <Select value={importType} onValueChange={setImportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select import type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clients">Clients</SelectItem>
                          <SelectItem value="pending-order">Pending Order Task Sheet</SelectItem>
                          <SelectItem value="pending-material">Pending Material Task Sheet</SelectItem>
                          <SelectItem value="new-order">New Order Task Sheet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm">
                        Excel File
                      </Label>
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                      {uploadFile && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                      {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                            Processing...
                        </>
                      ) : 'Upload'}
                    </Button>
                  </DialogFooter>
              </>
          ) : (
              // Enhanced Result View
              <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-full text-green-600">
                              <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                              <p className="text-sm font-medium text-green-900">Success Count</p>
                              <p className="text-2xl font-bold text-green-700">{importResult.data?.successCount || 0}</p>
                          </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
                          <div className="p-3 bg-red-100 rounded-full text-red-600">
                              <XCircle className="w-6 h-6" />
                          </div>
                          <div>
                              <p className="text-sm font-medium text-red-900">Failure Count</p>
                              <p className="text-2xl font-bold text-red-700">{importResult.data?.failureCount || 0}</p>
                          </div>
                      </div>
                  </div>

                  {/* Failed Records Table */}
                  {importResult.data?.failedRecords && importResult.data?.failedRecords.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <h3 className="font-medium text-sm text-gray-700">Failed Records Details</h3>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead className="w-[100px]">Row No</TableHead>
                                          <TableHead>Reason</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {importResult.data.failedRecords.map((record, idx) => (
                                          <TableRow key={idx} className="hover:bg-gray-50">
                                              <TableCell className="font-medium">{record.rowNo}</TableCell>
                                              <TableCell className="text-red-600 text-sm">{record.reason}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      </div>
                  )}

                  <DialogFooter>
                      <Button onClick={resetUpload}>Close</Button>
                  </DialogFooter>
              </div>
          )}
        </DialogContent>
      </Dialog>

      <ClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      <ClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingClient(null)
        }}
        onSuccess={loadData}
        client={editingClient}
      />
    </div>
  )
}
