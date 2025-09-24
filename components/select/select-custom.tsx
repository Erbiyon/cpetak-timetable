import * as React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface SelectCustomProps {
    currentYear: string
    onYearChange: (year: string) => void
    planType?: "TRANSFER" | "FOUR_YEAR" | "DVE-MSIX" | "DVE-LVC"
}

export function SelectCustom({ currentYear, onYearChange, planType = "TRANSFER" }: SelectCustomProps) {

    const generateYearOptions = () => {
        const currentBuddhistYear = new Date().getFullYear() + 543
        const years = []


        let yearsToShow = 3

        switch (planType) {
            case "FOUR_YEAR":
                yearsToShow = 4
                break
            case "DVE-MSIX":
            case "DVE-LVC":
                yearsToShow = 2
                break
            default:
                yearsToShow = 3
        }

        for (let i = 2; i >= -yearsToShow; i--) {
            const year = currentBuddhistYear + i
            years.push({
                value: year.toString(),
                label: `${year}`
            })
        }

        return years
    }

    const yearOptions = generateYearOptions()

    return (
        <div className="py-4 sm:mx-4 md:mx-8 lg:mx-16 xl:px-32">
            <h2 className="font-semibold mb-4">
                เลือกปีการศึกษา
            </h2>
            <Select value={currentYear} onValueChange={onYearChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="เลือกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>เลือกปีการศึกษา</SelectLabel>
                        {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
