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

export function SelectCustom() {
    return (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกแผนการเรียน" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>เลือกแผนการเรียน</SelectLabel>
                    <SelectItem value="apple">Apple</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
