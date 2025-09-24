"use client"

import CalendarCustom from "@/components/calendar/calendar-custom"
import DisplayCalendarCustom from "@/components/calendar/display-calendar-custom"
import { Label } from "@radix-ui/react-label"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import React from "react"

export default function AcademicCalendar() {
    const [term1, setTerm1] = React.useState<{ start?: Date; end?: Date }>({})
    const [term2, setTerm2] = React.useState<{ start?: Date; end?: Date }>({})
    const [term3, setTerm3] = React.useState<{ start?: Date; end?: Date }>({})
    const [_savedTerm, setSavedTerm] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [selectedCurrentTerm, setSelectedCurrentTerm] = React.useState<number | null>(null)
    const [showClearDialog, setShowClearDialog] = React.useState(false)

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
                console.error("ผิดพลาดในการบันทึกเทอม:", error)
            }
        }
    }

    async function setCurrentTerm(termNumber: number) {
        try {
            const academicYear = term1.start ? term1.start.getFullYear() + 543 : new Date().getFullYear() + 543
            const termYear = `${termNumber}/${academicYear}`

            const res = await fetch("/api/term-year", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ termYear }),
            })

            if (res.ok) {
                setSelectedCurrentTerm(termNumber)
                alert(`กำหนดให้ภาคเรียนที่ ${termNumber}/${academicYear} เป็นภาคเรียนปัจจุบันแล้ว`)
            }
        } catch (error) {
            console.error("ผิดพลาดในการกำหนดภาคเรียนปัจจุบัน:", error)
        }
    }

    async function clearAllTerms() {
        try {
            const deleteResponse = await fetch("/api/term", {
                method: "DELETE",
            })

            if (deleteResponse.ok) {
                await fetch("/api/term-year", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ termYear: "" }),
                })

                setTerm1({})
                setTerm2({})
                setTerm3({})
                setSelectedCurrentTerm(null)
                setShowClearDialog(false)

                alert("ลบข้อมูลปฏิทินการศึกษาทั้งหมดสำเร็จ")
            } else {
                throw new Error("ไม่สามารถลบข้อมูลได้")
            }
        } catch (error) {
            console.error("Error clearing all terms:", error)
            alert("เกิดข้อผิดพลาดในการลบข้อมูล")
        }
    }

    React.useEffect(() => {
        async function fetchTerms() {
            try {
                setLoading(true)
                const res = await fetch("/api/term")
                if (res.ok) {
                    const data = await res.json()
                    data.forEach((term: any) => {
                        if (term.name === "ภาคเรียนที่ 1") setTerm1({ start: new Date(term.start), end: new Date(term.end) })
                        if (term.name === "ภาคเรียนที่ 2") setTerm2({ start: new Date(term.start), end: new Date(term.end) })
                        if (term.name === "ภาคเรียนที่ 3") setTerm3({ start: new Date(term.start), end: new Date(term.end) })
                    })
                }

                const currentTermRes = await fetch("/api/current-term-year")
                if (currentTermRes.ok) {
                    const currentTermData = await currentTermRes.json()
                    const termNumber = parseInt(currentTermData.termYear.split('/')[0])
                    setSelectedCurrentTerm(termNumber)
                }
            } catch (error) {
                console.error("ผิดพลาดในการดึงข้อมูลเทอม:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTerms()
    }, [])

    function getCurrentTerm() {
        const today = new Date()
        for (let i = 0; i < terms.length; i++) {
            const t = terms[i]
            if (t.start && t.end && today >= t.start && today <= t.end) {
                const academicYear = term1.start ? term1.start.getFullYear() + 543 : new Date().getFullYear() + 543

                return {
                    termNumber: i + 1,
                    start: t.start,
                    end: t.end,
                    academicYear: academicYear
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

    function getAllOverlapTermNames(
        start: Date | undefined, end: Date | undefined,
        otherTerms: { name: string; start?: Date; end?: Date }[]
    ): string[] {
        if (!start || !end) return []
        return otherTerms
            .filter(term => term.start && term.end && (start <= term.end && end >= term.start))
            .map(term => term.name)
    }

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
                <div className="flex items-center justify-between my-4 lg:my-5 px-4">
                    <div className="flex-1"></div>
                    <h1 className="text-xl lg:text-2xl font-bold text-center">ปฏิทินการศึกษา</h1>
                    <div className="flex-1 flex justify-end">
                        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    ล้างทั้งหมด
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ต้องการลบข้อมูลปฏิทินการศึกษาทั้งหมดหรือไม่?
                                        การดำเนินการนี้จะลบข้อมูลวันที่ของทั้ง 3 ภาคเรียน และรีเซ็ตการตั้งค่าภาคเรียนปัจจุบัน
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={clearAllTerms}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        ลบข้อมูล
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-4 lg:mb-5 p-4 lg:p-5 shadow-sm mx-4">
                    <div className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
                        academicYear={currentTerm.academicYear}
                    />
                )}

                <Card className="mx-4 mb-4">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">กำหนดภาคเรียนปัจจุบัน</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                เลือกภาคเรียนที่ต้องการให้เป็นภาคเรียนปัจจุบัน (จะส่งผลต่อการแสดงข้อมูลทั้งระบบ)
                            </p>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {[1, 2, 3].map((termNumber) => {
                                        const termData = termNumber === 1 ? term1 : termNumber === 2 ? term2 : term3
                                        const isComplete = termData.start && termData.end
                                        const academicYear = term1.start ? term1.start.getFullYear() + 543 : new Date().getFullYear() + 543

                                        return (
                                            <div key={termNumber} className="flex-1">
                                                <Button
                                                    variant={selectedCurrentTerm === termNumber ? "default" : "outline"}
                                                    className="w-full"
                                                    onClick={() => setCurrentTerm(termNumber)}
                                                    disabled={!isComplete}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span>ภาคเรียนที่ {termNumber}/{academicYear}</span>
                                                        {!isComplete && (
                                                            <span className="text-xs opacity-60">(ยังไม่กำหนดวันที่)</span>
                                                        )}
                                                    </div>
                                                </Button>
                                                {selectedCurrentTerm === termNumber && (
                                                    <Badge variant="secondary" className="mt-2 w-full justify-center">
                                                        ภาคเรียนปัจจุบัน
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}