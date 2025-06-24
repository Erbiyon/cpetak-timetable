"use client"

import CalendarCustom from "@/components/calendar/calendar-custom"
import DisplayCalendarCustom from "@/components/calendar/display-calendar-custom"
import { Label } from "@radix-ui/react-label"
import React from "react"

export default function AcademicCalendar() {
    const [term1, setTerm1] = React.useState<{ start?: Date; end?: Date }>({})
    const [term2, setTerm2] = React.useState<{ start?: Date; end?: Date }>({})
    const [term3, setTerm3] = React.useState<{ start?: Date; end?: Date }>({})
    const [savedTerm, setSavedTerm] = React.useState<any>(null)

    const terms = [
        { name: "เทอม 1", start: term1.start, end: term1.end },
        { name: "เทอม 2", start: term2.start, end: term2.end },
        { name: "เทอม 3", start: term3.start, end: term3.end },
    ]

    async function saveTerm(name: string, start?: Date, end?: Date) {
        if (start && end) {
            const res = await fetch("/api/term", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    start,
                    end,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setSavedTerm(data)
            }
        }
    }

    function getCurrentTerm() {
        const now = new Date()
        if (term1.start && term1.end && now >= term1.start && now <= term1.end) {
            return { termNumber: 1, start: term1.start, end: term1.end }
        }
        if (term2.start && term2.end && now >= term2.start && now <= term2.end) {
            return { termNumber: 2, start: term2.start, end: term2.end }
        }
        if (term3.start && term3.end && now >= term3.start && now <= term3.end) {
            return { termNumber: 3, start: term3.start, end: term3.end }
        }
        return null
    }

    React.useEffect(() => {
        if (term1.start && term1.end) saveTerm("เทอม 1", term1.start, term1.end)
    }, [term1.start, term1.end])

    React.useEffect(() => {
        if (term2.start && term2.end) saveTerm("เทอม 2", term2.start, term2.end)
    }, [term2.start, term2.end])

    React.useEffect(() => {
        if (term3.start && term3.end) saveTerm("เทอม 3", term3.start, term3.end)
    }, [term3.start, term3.end])

    const currentTerm = getCurrentTerm()

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
            {savedTerm && (
                <div className="text-green-600 font-semibold text-center mt-4">
                    บันทึกแล้ว: {savedTerm.name} ({new Date(savedTerm.start).toLocaleDateString()} ถึง {new Date(savedTerm.end).toLocaleDateString()})
                </div>
            )}
            {currentTerm && (
                <DisplayCalendarCustom
                    termNumber={currentTerm.termNumber}
                    start={currentTerm.start}
                    end={currentTerm.end}
                />
            )}
        </div>
    )
}