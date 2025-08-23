"use client"

import { Checkbox } from "@/components/ui/checkbox"
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
import { useState, useEffect } from "react"

type Teacher = {
    id: number
    tName: string
    tLastName: string
    teacherType: string
}

export function AddTeacherSubjectOutCustom({
    subjectId,
    teacherName,
    onUpdate,
    subjectCode,
    planType,
    termYear,
    yearLevel,
    subjectName
}: {
    subjectId: number
    teacherName?: string
    onUpdate?: () => void
    subjectCode?: string
    planType?: string
    termYear?: string
    yearLevel?: string
    subjectName?: string
}) {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [coTeaching, setCoTeaching] = useState(false)
    const [otherPlan, setOtherPlan] = useState<any | null>(null)
    const [showDuplicate, setShowDuplicate] = useState(false)
    const [duplicatePlans, setDuplicatePlans] = useState<any[]>([])

    // โหลดรายชื่ออาจารย์ภายนอกสาขา
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await fetch("/api/teacher?inDepartment=false")
                if (res.ok) {
                    const data = await res.json()
                    // กรองเฉพาะอาจารย์ภายนอกสาขา
                    const filteredTeachers = data.filter((teacher: Teacher) =>
                        teacher.teacherType === "อาจารย์ภายนอกสาขา"
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

    // ตรวจสอบวิชาซ้ำข้ามแผน
    useEffect(() => {
        const checkDuplicateSubject = async () => {
            if (!subjectCode || !planType || !termYear) return
            try {
                const res = await fetch("/api/subject")
                if (res.ok) {
                    const plans = await res.json()
                    const filtered = plans.filter(
                        (p: any) =>
                            p.subjectCode === subjectCode &&
                            p.termYear === `${termYear}`
                    )
                    setDuplicatePlans(filtered)
                    setShowDuplicate(filtered.length > 1)
                    const other = filtered.find((p: any) => p.planType !== planType)
                    setOtherPlan(other || null)
                }
            } catch (e) {
                setShowDuplicate(false)
                setOtherPlan(null)
                setDuplicatePlans([])
            }
        }
        if (open && subjectCode && planType && termYear) {
            checkDuplicateSubject()
        }
    }, [open, subjectCode, planType, termYear])

    // เช็คสถานะ co-teaching เมื่อเปิด Dialog
    useEffect(() => {
        const checkCoTeaching = async () => {
            if (!open || !subjectId) return;
            try {
                const res = await fetch(`/api/subject/co-teaching/check?subjectId=${subjectId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.groupKey && data.planIds && data.planIds.length > 1) {
                        setCoTeaching(true);
                    } else {
                        setCoTeaching(false);
                    }
                }
            } catch {
                setCoTeaching(false);
            }
        };
        checkCoTeaching();
    }, [open, subjectId]);

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

    const handleSubmit = async () => {
        setLoading(true)
        try {
            let patchRequests: Promise<Response>[] = []

            // PATCH วิชาหลัก
            patchRequests.push(
                fetch(`/api/subject/${subjectId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        teacherId: selectedTeacherId === "none" || selectedTeacherId === "" ? null : parseInt(selectedTeacherId)
                    })
                })
            )
            // ถ้าเลือกสอนร่วมและมี otherPlan ให้ PATCH อีกแผนด้วย
            if (coTeaching && otherPlan) {
                patchRequests.push(
                    fetch(`/api/subject/${otherPlan.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            teacherId: selectedTeacherId === "none" || selectedTeacherId === "" ? null : parseInt(selectedTeacherId)
                        })
                    })
                )
                // === เพิ่มส่วนนี้ ===
                // สร้าง/อัปเดตกลุ่มสอนร่วมใน CoTeaching_tb
                const groupKey = `${subjectCode}-${termYear}`
                await fetch("/api/subject/co-teaching/merge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        groupKey,
                        planIds: [subjectId, otherPlan.id]
                    })
                })
            }

            if (!coTeaching && otherPlan) {
                // ยกเลิกกลุ่มสอนร่วม
                const groupKey = `${subjectCode}-${termYear}`;
                await fetch("/api/subject/co-teaching/merge", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        groupKey,
                        planIds: [subjectId, otherPlan.id]
                    })
                });
            }

            const responses = await Promise.all(patchRequests)
            if (responses.every(res => res.ok)) {
                setOpen(false)
                setSelectedTeacherId("")
                if (onUpdate) onUpdate()
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
                        เลือกอาจารย์ภายนอกสาขาที่จะสอนวิชานี้ <br />
                        รหัสวิชา: {subjectCode} {getPlanTypeText(planType || " ")} {yearLevel} {termYear} <br />
                        ชื่อวิชา: {subjectName}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="teacher-select">เลือกอาจารย์</Label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกอาจารย์ภายนอกสาขา" />
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