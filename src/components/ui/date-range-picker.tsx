import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [month, setMonth] = React.useState<Date | undefined>(date?.from);

  React.useEffect(() => {
    setTempDate(date);
    if (date?.from) {
      setMonth(date.from);
    }
  }, [date]);

  const handleApply = () => {
    setDate(tempDate);
    setOpen(false);
  };

  const handleClear = () => {
    setTempDate(undefined);
    setMonth(new Date());
  };

  const handleToday = () => {
    const today = new Date();
    // Normalize to midnight local time
    today.setHours(0, 0, 0, 0);
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setTempDate({
      from: normalizedToday,
      to: normalizedToday,
    });
    setMonth(normalizedToday);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempDate?.from}
            selected={tempDate}
            onSelect={setTempDate}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={1}
            classNames={{
              selected:
                "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
              today: "bg-accent text-accent-foreground",
              outside: "text-muted-foreground opacity-50",
              range_middle:
                "aria-selected:bg-primary/20 aria-selected:text-primary",
              range_start:
                "bg-primary text-primary-foreground rounded-l-md hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground",
              range_end:
                "bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground",
            }}
          />
          <div className="flex items-center justify-between p-3 border-t bg-gray-50 rounded-b-md gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleApply}
            >
              Submit
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
