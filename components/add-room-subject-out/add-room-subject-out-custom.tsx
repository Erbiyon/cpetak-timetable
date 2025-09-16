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
import { CopyPlus } from "lucide-react"
import React, { useEffect, useState } from "react"

export default function AddRoomSubjectOutCustom({
    subjectId,
    roomCode,
    onUpdate,
    subjectCode,
    planType,
    termYear,
    subjectName,
    yearLevel
}: {
    subjectId: number
    roomCode: string
    onUpdate?: () => void
    subjectCode?: string
    planType?: string
    termYear?: string
    subjectName?: string
    yearLevel?: string
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [inputRoomCode, setInputRoomCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [duplicatePlans, setDuplicatePlans] = useState<any[]>([])

    const isDVE = planType === "DVE-MSIX" || planType === "DVE-LVC"


    const getRoomType = (roomCode: string): string => {
        const trimmedCode = roomCode.trim().toUpperCase();

        if (trimmedCode.includes("สนง.คณะวิทย์")) return "สนง.คณะวิทย์";
        if (trimmedCode.startsWith("ENG")) return "ตึกวิศวกรรมศาสตร์";
        if (trimmedCode.startsWith("SC")) return "อาคารปฏิบัติการวิทยาศาสตร์และนวัตกรรม";
        if (/^6\d*$/.test(trimmedCode)) return "อาคารสาขาวิศวกรรมคอมพิวเตอร์";
        if (/^7\d*$/.test(trimmedCode)) return " อาคารเรียน 7";
        if (/^3\d*$/.test(trimmedCode)) return " อาคารเรียน 3";
        if (trimmedCode.includes("โรงฝึก")) return "โรงฝึกงานทางวิศวกรรม"; // แก้ไขที่นี่

        return "ไม่ได้กำหนดประเภทห้อง";
    };


    useEffect(() => {
        if (open) {
            setInputRoomCode(roomCode || "")
            setError(null)
        }
    }, [open, roomCode])

    useEffect(() => {
        const checkDuplicateSubject = async () => {
            if (!subjectCode || !planType || !termYear) return
            try {
                const res = await fetch("/api/subject")
                if (res.ok) {
                    const plans = await res.json()

                    const filtered = plans.filter(
                        (p: any) =>
                            (p.planType === "DVE-MSIX" || p.planType === "DVE-LVC") &&
                            p.subjectCode === subjectCode &&
                            p.termYear === termYear
                    )
                    setDuplicatePlans(filtered)
                }
            } catch (e) {
                setDuplicatePlans([])
            }
        }
        if (open && subjectCode && planType && termYear) {
            checkDuplicateSubject()
        }
    }, [open, subjectCode, planType, termYear])

    const handleSubmit = async () => {
        try {
            setLoading(true)
            setError(null)

            const roomCodeValue = inputRoomCode.trim() || null
            let roomId = null

            if (roomCodeValue) {

                const res = await fetch(`/api/room/code?roomCode=${encodeURIComponent(roomCodeValue)}`)

                if (res.ok) {
                    const room = await res.json()

                    if (room && room.id) {
                        roomId = room.id
                    } else {

                        const roomType = getRoomType(roomCodeValue)

                        const createRes = await fetch("/api/room", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                roomCode: roomCodeValue,
                                roomType: roomType
                            }),
                        })

                        if (createRes.ok) {
                            const newRoom = await createRes.json()
                            roomId = newRoom.id
                        } else {
                            const errorData = await createRes.json()
                            throw new Error(errorData.error || "ไม่สามารถสร้างห้องใหม่ได้")
                        }
                    }
                } else {
                    throw new Error("ไม่สามารถตรวจสอบข้อมูลห้องเรียนได้")
                }
            }

            let patchRequests: Promise<Response>[] = []

            if (isDVE && duplicatePlans.length > 0) {
                patchRequests = duplicatePlans.map((plan) =>
                    fetch(`/api/subject/${plan.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            roomId: roomId
                        }),
                    })
                )
            } else {
                patchRequests.push(
                    fetch(`/api/subject/${subjectId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            roomId: roomId
                        }),
                    })
                )
            }

            const responses = await Promise.all(patchRequests)
            if (responses.every(res => res.ok)) {
                setOpen(false)
                if (onUpdate) onUpdate()
            } else {
                setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
            }
        } catch (error: any) {
            setError(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
        } finally {
            setLoading(false)
        }
    }


    const getDisplayRoomType = (roomCode: string): string => {
        if (!roomCode.trim()) return ""
        return getRoomType(roomCode.trim())
    }

    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ปวส. (ม.6)";
            case "DVE-LVC": return "ปวส. (ปวช.)";
            default: return planType;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <CopyPlus className="h-4 w-4" color="#00ff00" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>กำหนดห้องเรียน</DialogTitle>
                    <DialogDescription>
                        กรอกเลขห้องเรียนสำหรับวิชานอกสาขานี้ {termYear} <br />
                        รหัสวิชา: {subjectCode} {getPlanTypeText(planType || " ")} {yearLevel} <br />
                        วิชา: {subjectName}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roomCode" className="text-right">
                            เลขห้อง
                        </Label>
                        <Input
                            id="roomCode"
                            className="col-span-3"
                            value={inputRoomCode}
                            onChange={(e) => setInputRoomCode(e.target.value)}
                            placeholder="กรอกเลขห้อง (เว้นว่างหากไม่ระบุ)"
                        />
                    </div>


                    {inputRoomCode.trim() && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-sm text-muted-foreground">
                                ประเภทห้อง
                            </Label>
                            <div className="col-span-3">
                                <span className="text-sm font-medium">
                                    {getDisplayRoomType(inputRoomCode)}
                                </span>
                            </div>
                        </div>
                    )}

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