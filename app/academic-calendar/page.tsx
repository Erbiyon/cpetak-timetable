"use client"

import CalendarCustom from "@/components/calendar/calendar-custom"
import { Label } from "@radix-ui/react-label"
import React from "react"

export default function AcademicCalendar() {
    const [term1, setTerm1] = React.useState<{ start?: Date; end?: Date }>({})
    const [term2, setTerm2] = React.useState<{ start?: Date; end?: Date }>({})
    const [term3, setTerm3] = React.useState<{ start?: Date; end?: Date }>({})

    const terms = [
        { name: "เทอม 1", start: term1.start, end: term1.end },
        { name: "เทอม 2", start: term2.start, end: term2.end },
        { name: "เทอม 3", start: term3.start, end: term3.end },
    ]

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl m-10 shadow-sm mx-98">
            <div className="text-center text-2xl font-bold my-5">
                ปฏิทินการศึกษา
            </div>
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-5 p-5 shadow-sm mx-auto">
                <div className="max-w-7xl mx-auto items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="term1" className="px-1">
                                ภาคเรียนที่ 1
                            </Label>
                            <CalendarCustom
                                date={term1.start}
                                onChange={date => setTerm1(t => ({ ...t, start: date }))}
                                terms={terms}
                                selectDate="เริ่มภาคเรียนที่ 1"
                            />
                            <br />
                            <CalendarCustom
                                date={term1.end}
                                onChange={date => setTerm1(t => ({ ...t, end: date }))}
                                terms={terms}
                                selectDate="สิ้นสุดภาคเรียนที่ 1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="term2" className="px-1">
                                ภาคเรียนที่ 2
                            </Label>
                            <CalendarCustom
                                date={term2.start}
                                onChange={date => setTerm2(t => ({ ...t, start: date }))}
                                terms={terms}
                                selectDate="เริ่มภาคเรียนที่ 2"
                            />
                            <br />
                            <CalendarCustom
                                date={term2.end}
                                onChange={date => setTerm2(t => ({ ...t, end: date }))}
                                terms={terms}
                                selectDate="สิ้นสุดภาคเรียนที่ 2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="term3" className="px-1">
                                ภาคเรียนที่ 3
                            </Label>
                            <CalendarCustom
                                date={term3.start}
                                onChange={date => setTerm3(t => ({ ...t, start: date }))}
                                terms={terms}
                                selectDate="เริ่มภาคเรียนที่ 3"
                            />
                            <br />
                            <CalendarCustom
                                date={term3.end}
                                onChange={date => setTerm3(t => ({ ...t, end: date }))}
                                terms={terms}
                                selectDate="สิ้นสุดภาคเรียนที่ 3"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}