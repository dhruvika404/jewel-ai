import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import TablePagination from "@/components/ui/table-pagination";

export interface Column<T> {
  header: string | React.ReactNode;
  className?: string;
  cellClassName?: string;
  render: (item: T) => React.ReactNode;
}

interface StandardTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  headerChildren?: React.ReactNode;
  rowKey: (item: T) => string | number;
  className?: string;
}

export function StandardTable<T>({
  columns,
  data,
  loading = false,
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  setPageSize,
  emptyMessage = "No records found",
  emptyIcon,
  headerChildren,
  rowKey,
  className = "",
}: StandardTableProps<T>) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {headerChildren && (
        <div className="p-4 border-b bg-white">
          {headerChildren}
        </div>
      )}
      <div className="overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column, index) => (
                <TableHead key={index} className={`font-medium text-gray-700 ${column.header === 'Action' || column.header === 'Actions' ? 'text-center' : ''} ${column.className || ""}`}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={rowKey(item)} className="hover:bg-gray-50">
                  {columns.map((column, index) => (
                    <TableCell key={index} className={`align-center ${column.cellClassName || ""}`}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && setPageSize && (
        <div className="p-4 border-t bg-white flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total : <span className="font-semibold text-gray-900">{loading ? "..." : totalItems}</span>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </div>
      )}
    </Card>
  );
}
