"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, Edit } from "lucide-react"
import { Checkbox } from "../ui/checkbox"
import { useState, useEffect } from "react"

type Teacher = {
    id: number
    tName: string
    tLastName: string
    teacherType: string
    planType?: string
}

export function AddTeacherSubjectInCustom({
    subjectId,
    teacherName,
    onUpdate,
    subjectCode,
    subjectName,
    planType,
    termYear,
    yearLevel
}: {
    subjectId: number
    teacherName?: string
    onUpdate?: () => void
    subjectCode?: string
    subjectName?: string
    planType?: string
    termYear?: string
    yearLevel?: string
}) {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [showDuplicate, setShowDuplicate] = useState(false)
    const [otherPlan, setOtherPlan] = useState<any | null>(null)
    const [coTeaching, setCoTeaching] = useState(false)

    // โหลดรายชื่ออาจารย์ภายในสาขา
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await fetch("/api/teacher?inDepartment=true")
                if (res.ok) {
                    const data = await res.json()
                    // กรองเฉพาะอาจารย์ภายในสาขา
                    const filteredTeachers = data.filter((teacher: Teacher) =>
                        teacher.teacherType === "อาจารย์ภายในสาขา"
                    )
                    setTeachers(filteredTeachers)
                }
            } catch (error) {
                console.error("Error fetching teachers:", error)
            }
        }

        if (open) {
            fetchTeachers()
        }
    }, [open])

    useEffect(() => {
        const checkDuplicateSubject = async () => {
            if (!subjectCode || !planType || !termYear) return
            try {
                const res = await fetch("/api/subject")
                if (res.ok) {
                    const plans = await res.json()
                    // หาเฉพาะแผน 4 ปี กับ เทียบโอน ที่มี subjectCode ตรงกัน และอยู่ในปีการศึกษาปัจจุบัน
                    const filtered = plans.filter(
                        (p: any) =>
                            p.subjectCode === subjectCode &&
                            (p.planType === "FOUR_YEAR" || p.planType === "TRANSFER") &&
                            p.termYear === `ภาคเรียนที่ ${termYear}`
                    )
                    setShowDuplicate(filtered.length > 1)
                    // หาอีกแผนที่ไม่ใช่แผนปัจจุบัน
                    const other = filtered.find((p: any) => p.planType !== planType)
                    setOtherPlan(other || null)
                }
            } catch (e) {
                setShowDuplicate(false)
                setOtherPlan(null)
            }
        }
        if (open && subjectCode && planType && termYear) {
            checkDuplicateSubject()
        }
    }, [open, subjectCode, planType, termYear])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/subject/${subjectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId: selectedTeacherId === "none" || selectedTeacherId === "" ? null : parseInt(selectedTeacherId)
                })
            })

            if (res.ok) {
                setOpen(false)
                setSelectedTeacherId("")
                if (onUpdate) onUpdate()
                alert(coTeaching ? "เปิดใช้งานการสอนร่วม" : "ปิดใช้งานการสอนร่วม")
            }

        } catch (error) {
            console.error("Error updating teacher:", error)
        } finally {
            setLoading(false)
        }
    }

    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    useEffect(() => {
        if (open && teacherName && teachers.length > 0) {
            const current = teachers.find(
                t => `${t.tName} ${t.tLastName}` === teacherName
            )
            if (current) {
                setSelectedTeacherId(current.id.toString())
            }
        } else if (open && !teacherName) {
            setSelectedTeacherId("")
        }
    }, [open, teacherName, teachers])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={teacherName ? "outline" : "default"}
                    size="sm"
                    className="h-8"
                >
                    {teacherName ? (
                        <>
                            <Edit className="h-4 w-4 mr-1" />
                            แก้ไข
                        </>
                    ) : (
                        <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            เพิ่ม
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {teacherName ? "แก้ไขอาจารย์ผู้สอน" : "เพิ่มอาจารย์ผู้สอน"}
                    </DialogTitle>
                    <DialogDescription>
                        เลือกอาจารย์ภายในสาขาที่จะสอนวิชานี้  {termYear} <br />
                        รหัสวิชา: {subjectCode} {getPlanTypeText(planType || "")} {yearLevel} <br />
                        วิชา: {subjectName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="teacher-select">เลือกอาจารย์</Label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกอาจารย์ภายในสาขา" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">ไม่ระบุ</SelectItem>
                                {teachers.map((teacher) => (
                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.tName} {teacher.tLastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showDuplicate && otherPlan && (
                        <div>
                            มีวิชาที่มีรหัสเหมือนกัน {subjectCode} <br />
                            ในแผนการเรียน {getPlanTypeText(otherPlan.planType)} {otherPlan.yearLevel}
                            <div className="flex items-center gap-3 mt-3">
                                <Checkbox
                                    id="coTeaching"
                                    checked={coTeaching}
                                    onCheckedChange={checked => setCoTeaching(checked === true)}
                                />
                                <Label htmlFor="coTeaching">สอนร่วม</Label>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">ยกเลิก</Button>
                    </DialogClose>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}