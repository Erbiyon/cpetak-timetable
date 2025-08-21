"use client"

import { useState, useEffect } from "react"
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

type Teacher = {
    id: number
    tName: string
    tLastName: string
    teacherType: string
}

export function AddTeacherSubjectOutCustom({
    subjectId,
    teacherName,
    onUpdate
}: {
    subjectId: number
    teacherName?: string
    onUpdate?: () => void
}) {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

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
            }
        } catch (error) {
            console.error("Error updating teacher:", error)
        } finally {
            setLoading(false)
        }
    }

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
                        เลือกอาจารย์ภายนอกสาขาที่จะสอนวิชานี้
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