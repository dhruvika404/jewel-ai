import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Label } from "./label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComboboxProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  width?: string;
  error?: string;
  label?: string;
  required?: boolean;
  onEndReached?: () => void;
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  error,
  label,
  required,
  width,
  onEndReached,
  loading,
  onSearchChange,
  searchValue,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const observerTarget = React.useRef(null);

  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label;
  }, [options, value]);

  React.useEffect(() => {
    if (loading || !onEndReached || !open) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onEndReached();
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, onEndReached, open]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", width, className)}>
        {label && <Label required={required}>{label}</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full h-9 justify-between font-normal px-3 py-2",
                !value && "text-muted-foreground",
                error && "border-red-500",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate mr-2">
                    {selectedLabel || placeholder}
                  </span>
                </TooltipTrigger>
                {selectedLabel && selectedLabel !== placeholder && !selectedLabel.toLowerCase().includes("select") && (
                  <TooltipContent className="pointer-events-none">
                    <p>{selectedLabel}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
            <Command shouldFilter={!onSearchChange}>
              <CommandInput
                placeholder={searchPlaceholder}
                onValueChange={onSearchChange}
                value={searchValue}
              />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => {
                        if (option.disabled) return;
                        onSelect(option.value === value ? "" : option.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label !== placeholder && !option.label.toLowerCase().includes("select") ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate flex-1 text-left">
                              {option.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="pointer-events-none">
                            <p>{option.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="truncate flex-1 text-left">
                          {option.label}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                  {onEndReached && (
                    <div ref={observerTarget} className="h-1 w-full" />
                  )}

                  {loading && (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading more...
                      </div>
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-2">
            {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
