import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}
const pageSizeOptions = [10, 25, 50, 100, 300, 500];
const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = pageSizeOptions[0],
  setPageSize,
}) => {
  const renderPageLinks = () => {
    const pages = [];

    if (totalPages < 1) return null;

    pages.push(
      <PaginationItem key={1}>
        <PaginationLink
          className="cursor-pointer"
          isActive={currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (currentPage > 3) {
      pages.push(
        <PaginationItem className="cursor-pointer" key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (i !== 1 && i !== totalPages) {
        pages.push(
          <PaginationItem className="cursor-pointer" key={i}>
            <PaginationLink
              isActive={i === currentPage}
              onClick={() => onPageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem className="cursor-pointer" key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <PaginationItem className="cursor-pointer" key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div className="flex sm:flex-row flex-col items-center justify-end gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-500">Rows per page:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => setPageSize(Number(val))}
        >
          <SelectTrigger className="h-8 w-[70px] bg-gray-50 border-none shadow-none focus:ring-0">
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

      <div className="flex items-center gap-1">
        <Pagination className="flex items-center w-auto mx-0">
          <PaginationContent className="gap-1">
            <PaginationItem className="cursor-pointer">
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className="hover:bg-transparent px-2"
              />
            </PaginationItem>

            {renderPageLinks()}

            <PaginationItem className="cursor-pointer">
              <PaginationNext
                onClick={() =>
                  currentPage < totalPages && onPageChange(currentPage + 1)
                }
                className="hover:bg-transparent px-2"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default TablePagination;
