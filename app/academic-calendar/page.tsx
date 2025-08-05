"use client"

import CalendarCustom from "@/components/calendar/calendar-custom"
import DisplayCalendarCustom from "@/components/calendar/display-calendar-custom"
import { Label } from "@radix-ui/react-label"
import { Loader2 } from "lucide-react"
import React from "react"

export default function AcademicCalendar() {
    const [term1, setTerm1] = React.useState<{ start?: Date; end?: Date }>({})
    const [term2, setTerm2] = React.useState<{ start?: Date; end?: Date }>({})
    const [term3, setTerm3] = React.useState<{ start?: Date; end?: Date }>({})
    const [savedTerm, setSavedTerm] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    const terms = [
        { name: "ภาคเรียนที่ 1", start: term1.start, end: term1.end },
        { name: "ภาคเรียนที่ 2", start: term2.start, end: term2.end },
        { name: "ภาคเรียนที่ 3", start: term3.start, end: term3.end },
    ]

    async function saveTerm(name: string, start?: Date, end?: Date) {
        if (start && end) {
            try {
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
            } catch (error) {
                console.error("Error saving term:", error)
            }
        }
    }

    React.useEffect(() => {
        async function fetchTerms() {
            try {
                setLoading(true) // เริ่ม loading
                const res = await fetch("/api/term")
                if (res.ok) {
                    const data = await res.json()
                    data.forEach((term: any) => {
                        if (term.name === "ภาคเรียนที่ 1") setTerm1({ start: new Date(term.start), end: new Date(term.end) })
                        if (term.name === "ภาคเรียนที่ 2") setTerm2({ start: new Date(term.start), end: new Date(term.end) })
                        if (term.name === "ภาคเรียนที่ 3") setTerm3({ start: new Date(term.start), end: new Date(term.end) })
                    })
                }
            } catch (error) {
                console.error("Error fetching terms:", error)
            } finally {
                setLoading(false) // หยุด loading
            }
        }
        fetchTerms()
    }, [])

    function getCurrentTerm() {
        const today = new Date()
        for (let i = 0; i < terms.length; i++) {
            const t = terms[i]
            if (t.start && t.end && today >= t.start && today <= t.end) {
                return {
                    termNumber: i + 1,
                    start: t.start,
                    end: t.end
                }
            }
        }
        return null
    }

    const currentTerm = getCurrentTerm()

    React.useEffect(() => {
        if (term1.start && term1.end) saveTerm("ภาคเรียนที่ 1", term1.start, term1.end)
    }, [term1.start, term1.end])

    React.useEffect(() => {
        if (term2.start && term2.end) saveTerm("ภาคเรียนที่ 2", term2.start, term2.end)
    }, [term2.start, term2.end])

    React.useEffect(() => {
        if (term3.start && term3.end) saveTerm("ภาคเรียนที่ 3", term3.start, term3.end)
    }, [term3.start, term3.end])

    // เพิ่มฟังก์ชันตรวจสอบวันซ้ำ
    function isDateOverlap(date: Date | undefined, otherTerms: { start?: Date; end?: Date }[]) {
        if (!date) return false
        return otherTerms.some(term =>
            (term.start && date.getTime() === term.start.getTime()) ||
            (term.end && date.getTime() === term.end.getTime())
        )
    }

    // ฟังก์ชันตรวจสอบช่วงเวลาซ้อนกัน
    function isRangeOverlap(
        start: Date | undefined, end: Date | undefined,
        otherTerms: { start?: Date; end?: Date }[]
    ) {
        if (!start || !end) return false
        return otherTerms.some(term => {
            if (!term.start || !term.end) return false
            // ถ้าช่วงเวลาใดๆ ซ้อนกัน
            return (
                (start <= term.end && end >= term.start)
            )
        })
    }

    // ฟังก์ชันตรวจสอบช่วงเวลาซ้อนกันและคืนชื่อเทอมที่ซ้ำ
    function getOverlapTermName(
        start: Date | undefined, end: Date | undefined,
        otherTerms: { name: string; start?: Date; end?: Date }[]
    ): string | null {
        if (!start || !end) return null
        const found = otherTerms.find(term => {
            if (!term.start || !term.end) return false
            return (start <= term.end && end >= term.start)
        })
        return found ? found.name : null
    }

    function getAllOverlapTermNames(
        start: Date | undefined, end: Date | undefined,
        otherTerms: { name: string; start?: Date; end?: Date }[]
    ): string[] {
        if (!start || !end) return []
        return otherTerms
            .filter(term => term.start && term.end && (start <= term.end && end >= term.start))
            .map(term => term.name)
    }

    // แสดง loading หากยังโหลดข้อมูลอยู่
    if (loading) {
        return (
            <div className="flex justify-center w-full">
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl m-4 lg:m-10 shadow-sm max-w-3xl w-full">
                    <div className="text-center text-xl lg:text-2xl font-bold my-4 lg:my-5 px-4">
                        ปฏิทินการศึกษา
                    </div>
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-sm lg:text-base">กำลังโหลดข้อมูล...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-center w-full">
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl m-4 lg:m-10 shadow-sm max-w-3xl w-full">
                <div className="text-center text-xl lg:text-2xl font-bold my-4 lg:my-5 px-4">
                    ปฏิทินการศึกษา
                </div>
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-4 lg:mb-5 p-4 lg:p-5 shadow-sm mx-4">
                    <div className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                            {/* ภาคเรียนที่ 1 */}
                            <div className="flex flex-col space-y-3">
                                <Label htmlFor="term1" className="px-1 text-sm lg:text-base font-medium">
                                    ภาคเรียนที่ 1
                                </Label>
                                <div className="space-y-2">
                                    <CalendarCustom
                                        date={term1.start}
                                        onChange={date => {
                                            const newStart = date
                                            const newEnd = term1.end
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 2", ...term2 },
                                                { name: "ภาคเรียนที่ 3", ...term3 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newEnd && newStart && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm1(t => ({ ...t, start: date }))
                                        }}
                                        terms={terms}
                                        selectDate="เริ่มภาคเรียนที่ 1"
                                    />
                                    <CalendarCustom
                                        date={term1.end}
                                        onChange={date => {
                                            const newStart = term1.start
                                            const newEnd = date
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 2", ...term2 },
                                                { name: "ภาคเรียนที่ 3", ...term3 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newStart && newEnd && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm1(t => ({ ...t, end: date }))
                                        }}
                                        terms={terms}
                                        selectDate="สิ้นสุดภาคเรียนที่ 1"
                                    />
                                </div>
                            </div>

                            {/* ภาคเรียนที่ 2 */}
                            <div className="flex flex-col space-y-3">
                                <Label htmlFor="term2" className="px-1 text-sm lg:text-base font-medium">
                                    ภาคเรียนที่ 2
                                </Label>
                                <div className="space-y-2">
                                    <CalendarCustom
                                        date={term2.start}
                                        onChange={date => {
                                            const newStart = date
                                            const newEnd = term2.end
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 1", ...term1 },
                                                { name: "ภาคเรียนที่ 3", ...term3 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newEnd && newStart && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm2(t => ({ ...t, start: date }))
                                        }}
                                        terms={terms}
                                        selectDate="เริ่มภาคเรียนที่ 2"
                                    />
                                    <CalendarCustom
                                        date={term2.end}
                                        onChange={date => {
                                            const newStart = term2.start
                                            const newEnd = date
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 1", ...term1 },
                                                { name: "ภาคเรียนที่ 3", ...term3 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newStart && newEnd && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm2(t => ({ ...t, end: date }))
                                        }}
                                        terms={terms}
                                        selectDate="สิ้นสุดภาคเรียนที่ 2"
                                    />
                                </div>
                            </div>

                            {/* ภาคเรียนที่ 3 */}
                            <div className="flex flex-col space-y-3">
                                <Label htmlFor="term3" className="px-1 text-sm lg:text-base font-medium">
                                    ภาคเรียนที่ 3
                                </Label>
                                <div className="space-y-2">
                                    <CalendarCustom
                                        date={term3.start}
                                        onChange={date => {
                                            const newStart = date
                                            const newEnd = term3.end
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 1", ...term1 },
                                                { name: "ภาคเรียนที่ 2", ...term2 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newEnd && newStart && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm3(t => ({ ...t, start: date }))
                                        }}
                                        terms={terms}
                                        selectDate="เริ่มภาคเรียนที่ 3"
                                    />
                                    <CalendarCustom
                                        date={term3.end}
                                        onChange={date => {
                                            const newStart = term3.start
                                            const newEnd = date
                                            const overlaps = getAllOverlapTermNames(newStart, newEnd, [
                                                { name: "ภาคเรียนที่ 1", ...term1 },
                                                { name: "ภาคเรียนที่ 2", ...term2 }
                                            ])
                                            if (newStart && newEnd && overlaps.length > 0) {
                                                alert(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`)
                                                return
                                            }
                                            if (newStart && newEnd && newEnd < newStart) {
                                                alert("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น")
                                                return
                                            }
                                            setTerm3(t => ({ ...t, end: date }))
                                        }}
                                        terms={terms}
                                        selectDate="สิ้นสุดภาคเรียนที่ 3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {currentTerm && (
                    <DisplayCalendarCustom
                        termNumber={currentTerm.termNumber}
                        start={currentTerm.start}
                        end={currentTerm.end}
                    />
                )}
            </div>
        </div>
    )
}