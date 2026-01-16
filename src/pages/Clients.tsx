import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImportModal } from "@/components/modals/ImportModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Eye, Plus, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { clientAPI } from "@/services/api";
import { ClientModal } from "@/components/modals/ClientModal";
import { useAuth } from "@/contexts/AuthContext";
import { Combobox } from "@/components/ui/combobox";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { useClients } from "@/hooks/useClients";
import { useSalesPersons } from "@/hooks/useSalesPersons";
import { FollowUpCell } from "@/components/shared/FollowUpCell";
import { StandardTable, Column } from "@/components/shared/StandardTable";

interface Client {
  uuid: string;
  userCode: string;
  salesExecCode?: string;
  name: string;
  city?: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pendingMaterial?: FollowUpSummary;
  pendingOrder?: FollowUpSummary;
  newOrder?: FollowUpSummary;
  status?: string;
}

interface FollowUpSummary {
  uuid: string;
  clientCode: string;
  status: string;
  nextFollowUpDate: string;
  lastFollowUpDate: string;
  lastFollowUpMsg: string;
}

export default function Clients() {
  const { setHeader } = usePageHeader();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");

  const {
    clients,
    loading,
    totalItems,
    totalPages,
    refetch: refetchClients,
  } = useClients({
    page: currentPage,
    size: pageSize,
    search: searchQuery,
    role: "client",
    salesExecCode:
      user?.role === "sales_executive"
        ? user.userCode
        : selectedSalesPerson !== "all"
        ? selectedSalesPerson
        : undefined,
  });

  const { salesPersons } = useSalesPersons({
    role: "sales_executive",
    enabled: user?.role !== "sales_executive",
  });

  useEffect(() => {
    setHeader({
      title: "Clients",
      search: {
        placeholder: "Search clients...",
        value: searchQuery,
        onChange: (val) => setSearchQuery(val),
      },
      children: (
        <>
          {user?.role !== "sales_executive" && (
            <Combobox
              options={[
                { value: "all", label: "Select Sales Person" },
                ...salesPersons.map((sp) => ({
                  value: sp.userCode,
                  label: `${sp.name} (${sp.userCode})`,
                })),
              ]}
              value={selectedSalesPerson}
              onSelect={setSelectedSalesPerson}
              placeholder="Select Sales Person"
              searchPlaceholder="Search salesperson..."
              width="w-[180px]"
            />
          )}
          {user?.role !== "sales_executive" && (
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          )}
          {user?.role !== "sales_executive" && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          )}
        </>
      ),
    });
  }, [searchQuery, selectedSalesPerson, salesPersons, user]);

  const handleImport = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await clientAPI.import(file);
      toast.success(result.message || "Import successful");
      setShowUploadDialog(false);
      refetchClients();
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to import data");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const columns: Column<Client>[] = [
    {
      header: "Client Name",
      className: "w-[200px]",
      render: (client) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {client.name?.charAt(0) || client.userCode?.charAt(0) || "C"}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium text-gray-900 max-w-[150px] truncate cursor-default">
                  {client.name || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{client.name || "N/A"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
    {
      header: "Client Code",
      className: "w-[130px]",
      render: (client) => <span className="font-medium text-gray-900">{client.userCode}</span>,
    },
    {
      header: "Sales Person",
      className: "w-[150px]",
      render: (client) => <span className="font-medium text-gray-900">{client.salesExecCode}</span>,
    },
    {
      header: "Pending Material",
      className: "w-[220px]",
      render: (client) => <FollowUpCell data={client.pendingMaterial} />,
    },
    {
      header: "Pending Orders",
      className: "w-[220px]",
      render: (client) => <FollowUpCell data={client.pendingOrder} />,
    },
    {
      header: "New Orders",
      className: "w-[220px]",
      render: (client) => <FollowUpCell data={client.newOrder} />,
    },
    {
      header: "Action",
      className: "w-[80px]",
      render: (client) => (
        <div className="flex items-center justify-center gap-2">
          <Link
            to={`${user?.role === "admin" ? "/admin" : "/sales"}/clients/${client.uuid}`}
            state={{ client }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {user?.role !== "sales_executive" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
              title="Edit Client"
              onClick={() => {
                setEditingClient(client);
                setShowEditModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <StandardTable
          columns={columns}
          data={clients}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          rowKey={(client) => client.uuid}
          headerChildren={
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">1-2 Days Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-600">3-4 Days Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">5+ Days Overdue</span>
              </div>
            </div>
          }
        />
      </div>

      <ImportModal
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        title="Import Clients"
        description="Upload a file to import clients"
        onImport={handleImport}
        isUploading={isUploading}
        onClose={() => setShowUploadDialog(false)}
      />

      <ClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchClients}
      />

      <ClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        onSuccess={refetchClients}
        client={editingClient}
      />
    </div>
  );
}

