import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

const pageSizeOptions = [10, 25, 50, 100];

const TablePagination: React.FC<TablePaginationProps> = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  pageSize = pageSizeOptions[0], 
  setPageSize 
}) => {
  const renderPageLinks = () => {
    const pages = [];

    if (totalPages < 1) return null;

    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onPageChange(1)}
      >
        1
      </Button>
    );

    // Ellipsis before currentPage-1
    if (currentPage > 3) {
      pages.push(
        <span key="start-ellipsis" className="px-2">
          ...
        </span>
      );
    }

    // Show currentPage -1, currentPage, currentPage +1
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(
          <Button
            key={i}
            variant={i === currentPage ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(i)}
          >
            {i}
          </Button>
        );
      }
    }

    // Ellipsis after currentPage+1
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="end-ellipsis" className="px-2">
          ...
        </span>
      );
    }

    // Last page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex sm:flex-row flex-col items-center justify-end gap-4 text-sm border-t pt-4">
      {/* Page Size Dropdown */}
      <div className="flex items-center sm:justify-center sm:w-fit w-full justify-between gap-2">
        <span className="whitespace-nowrap text-muted-foreground">Rows per page:</span>
        <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
          <SelectTrigger className="h-8 !w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center sm:justify-end justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-1">
          {renderPageLinks()}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;