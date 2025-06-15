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
        <div className="py-5 mx-48">
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="เลือกแผนการเรียน" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>เลือกแผนการเรียน</SelectLabel>
                        <SelectItem value="apple">1/xxxx</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
