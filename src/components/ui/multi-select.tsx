import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface MultiSelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  required?: boolean;
  error?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  required,
  error,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label required={required}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full min-h-9 h-auto justify-between items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
              value.length === 0 && "text-muted-foreground",
              error && "border-red-500",
              className
            )}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {value.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1">
                    {options
                      .filter((option) =>
                        value.slice(0, 2).includes(option.value),
                      )
                      .map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="mr-1 mb-1"
                        >
                          {option.label}
                          <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUnselect(option.value);
                              }
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUnselect(option.value);
                            }}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Badge>
                      ))}
                    {value.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="mb-1"
                      >
                        +{value.length - 2} more
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          onChange(value.filter((v) => v !== option.value));
                        } else {
                          onChange([...value, option.value]);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
