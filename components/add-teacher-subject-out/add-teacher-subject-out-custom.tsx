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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserRoundPlus } from "lucide-react"
import React, { useEffect, useState } from "react"

export function AddTeacherSubjectOutCustom({
    subjectId,
    teacherName,
    subjectCode, // เพิ่ม prop สำหรับรับรหัสวิชา
    onUpdate
}: {
    subjectId: number
    teacherName: string
    subjectCode?: string // รับรหัสวิชา (optional)
    onUpdate?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [error, setError] = useState<string | null>(null)

    // เมื่อเปิด Dialog ให้เซ็ตค่าอาจารย์ที่เลือกไว้ (ถ้ามี)
    useEffect(() => {
        if (open) {
            if (teacherName && teacherName.trim() !== "") {
                const nameParts = teacherName.trim().split(" ")
                if (nameParts.length >= 2) {
                    setFirstName(nameParts[0])
                    setLastName(nameParts.slice(1).join(" "))
                } else {
                    setFirstName(teacherName.trim())
                    setLastName("")
                }
            } else {
                setFirstName("")
                setLastName("")
            }
            setError(null)
        }
    }, [open, teacherName])

    const handleSubmit = async () => {
        try {
            setLoading(true)
            setError(null)

            // ถ้าไม่กรอกชื่อหรือนามสกุล จะส่ง null
            const firstNameValue = firstName.trim()
            const lastNameValue = lastName.trim()

            if (!firstNameValue && !lastNameValue) {
                // ถ้าไม่มีทั้งชื่อและนามสกุล ให้ลบอาจารย์ออกจากวิชา
                const updateRes = await fetch(`/api/subject/teacher`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        subjectId: subjectId,
                        teacherId: null
                    }),
                })

                if (updateRes.ok) {
                    setOpen(false)
                    if (onUpdate) onUpdate()
                } else {
                    const data = await updateRes.json()
                    setError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
                }
                return
            }

            // ตรวจสอบว่าชื่อ-นามสกุลถูกกรอกครบถ้วน
            if (!firstNameValue || !lastNameValue) {
                setError("กรุณากรอกทั้งชื่อและนามสกุล")
                return
            }

            // ค้นหาอาจารย์จากชื่อ-นามสกุล
            const res = await fetch(`/api/teacher/name?firstName=${encodeURIComponent(firstNameValue)}&lastName=${encodeURIComponent(lastNameValue)}`)

            let teacherId = null

            if (res.ok) {
                const teacher = await res.json()

                if (teacher && teacher.id) {
                    teacherId = teacher.id
                } else {
                    // ถ้าไม่พบอาจารย์ ให้สร้างอาจารย์ใหม่
                    // ไม่ต้องกำหนด tId เอง ปล่อยให้ API สร้างรหัส TOUT ตามลำดับ
                    const createRes = await fetch("/api/teacher", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            // ไม่ต้องกำหนด tId ที่นี่ ให้ API สร้างให้
                            tName: firstNameValue,
                            tLastName: lastNameValue,
                            teacherType: "อาจารย์ภายนอกสาขา"
                        }),
                    })

                    if (createRes.ok) {
                        const newTeacher = await createRes.json()
                        teacherId = newTeacher.id
                    } else {
                        const errorData = await createRes.json();
                        throw new Error(errorData.error || "ไม่สามารถสร้างข้อมูลอาจารย์ใหม่ได้")
                    }
                }
            } else {
                throw new Error("ไม่สามารถตรวจสอบข้อมูลอาจารย์ได้")
            }

            // อัปเดตข้อมูลอาจารย์ให้กับวิชา
            const updateRes = await fetch(`/api/subject/teacher`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectId: subjectId,
                    teacherId: teacherId
                }),
            })

            if (updateRes.ok) {
                setOpen(false)
                if (onUpdate) onUpdate()
            } else {
                const data = await updateRes.json()
                setError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
            }
        } catch (error: any) {
            console.error("Error updating teacher:", error)
            setError(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="px-2 h-8">
                    <UserRoundPlus color="#00ff00" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>กำหนดอาจารย์นอกสาขา</DialogTitle>
                    <DialogDescription>
                        กรอกชื่อ-นามสกุลอาจารย์สำหรับวิชานอกสาขานี้
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                            ชื่อ
                        </Label>
                        <Input
                            id="firstName"
                            className="col-span-3"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="กรอกชื่ออาจารย์"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                            นามสกุล
                        </Label>
                        <Input
                            id="lastName"
                            className="col-span-3"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="กรอกนามสกุลอาจารย์"
                        />
                    </div>

                    {/* แสดงข้อความว่าจะถูกบันทึกเป็นอาจารย์ภายนอกสาขา */}
                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        หมายเหตุ: ข้อมูลจะถูกบันทึกเป็นอาจารย์ภายนอกสาขา
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" type="button">
                            ยกเลิก
                        </Button>
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