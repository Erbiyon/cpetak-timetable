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

function getTermName(date?: Date, terms?: TermRange[]) {
    if (!date || !terms) return undefined
    for (const term of terms) {
        if (term.start && term.end && date >= term.start && date <= term.end) {
            return term.name
        }
    }
    return undefined
}

export default function CalendarCustom({
    selectDate,
    date,
    onChange,
    terms
}: CalendarCustomProps) {
    const [open, setOpen] = React.useState(false)
    const termName = getTermName(date, terms)

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal"
                    >
                        {date ? date.toLocaleDateString() : `${selectDate}`}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        startMonth={new Date(2025, 0)}
                        endMonth={new Date(2075, 12)}
                        onSelect={(selectedDate) => {
                            onChange?.(selectedDate)
                            setOpen(false)
                        }}
                    />
                </PopoverContent>
            </Popover>
            {/* <div className="mt-2 text-sm text-gray-700">
                {date ? `วันที่ที่เลือก: ${date.toLocaleDateString()}` : "ยังไม่ได้เลือกวันที่"}
                {termName && (
                    <div className="text-green-700">อยู่ใน {termName}</div>
                )}
            </div> */}
        </div>
    )
}