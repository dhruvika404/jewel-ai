import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
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
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            classNames={{
              selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
              today: "bg-accent text-accent-foreground",
              outside: "text-muted-foreground opacity-50",
              range_middle: "aria-selected:bg-primary/20 aria-selected:text-primary",
              range_start: "bg-primary text-primary-foreground rounded-l-md hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground",
              range_end: "bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
