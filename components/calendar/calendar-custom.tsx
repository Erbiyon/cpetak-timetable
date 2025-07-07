"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type TermRange = {
    name: string;
    start?: Date;
    end?: Date
}

type CalendarCustomProps = {
    date?: Date
    onChange?: (date: Date | undefined) => void
    terms?: TermRange[]
    selectDate?: string
}

const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

function formatThaiDate(date: Date) {
    return `${date.getDate()}/${thaiMonths[date.getMonth()]}/${date.getFullYear() + 543}`
}

export default function CalendarCustom({
    selectDate,
    date,
    onChange,
    terms
}: CalendarCustomProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal"
                    >
                        {date
                            ? formatThaiDate(date)
                            : `${selectDate}`
                        }
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        startMonth={new Date(2025, 0)}
                        endMonth={new Date(2075, 11)}
                        onSelect={(selectedDate) => {
                            onChange?.(selectedDate)
                            setOpen(false)
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}