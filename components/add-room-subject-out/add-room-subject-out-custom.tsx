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
    onUpdate
}: {
    subjectId: number
    roomCode: string
    onUpdate?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [inputRoomCode, setInputRoomCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    // เมื่อเปิด Dialog ให้เซ็ตค่าห้องที่เลือกไว้ (ถ้ามี)
    useEffect(() => {
        if (open) {
            setInputRoomCode(roomCode || "")
            setError(null)
        }
    }, [open, roomCode])

    const handleSubmit = async () => {
        try {
            setLoading(true)
            setError(null)

            // ถ้าไม่กรอกเลขห้อง จะส่ง null
            const roomCodeValue = inputRoomCode.trim() || null

            // ถ้ามีเลขห้อง ตรวจสอบว่าห้องมีอยู่จริงหรือไม่
            let roomId = null

            if (roomCodeValue) {
                // ค้นหาห้องจากเลขห้อง
                const res = await fetch(`/api/room/code?roomCode=${encodeURIComponent(roomCodeValue)}`)

                if (res.ok) {
                    const room = await res.json()

                    if (room && room.id) {
                        roomId = room.id
                    } else {
                        // ถ้าไม่พบห้อง ให้สร้างห้องใหม่
                        const createRes = await fetch("/api/room", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                roomCode: roomCodeValue,
                                roomType: "ห้องเรียนนอกสาขา"
                            }),
                        })

                        if (createRes.ok) {
                            const newRoom = await createRes.json()
                            roomId = newRoom.id
                        } else {
                            throw new Error("ไม่สามารถสร้างห้องใหม่ได้")
                        }
                    }
                } else {
                    throw new Error("ไม่สามารถตรวจสอบข้อมูลห้องเรียนได้")
                }
            }

            console.log("Updating subject", subjectId, "with roomId", roomId)

            // อัปเดตข้อมูลห้องให้กับวิชา
            const updateRes = await fetch(`/api/subject/room`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectId: subjectId,
                    roomId: roomId
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
            console.error("Error updating room:", error)
            setError(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="px-2 h-8">
                    <CopyPlus color="#00ff00" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>กำหนดห้องเรียน</DialogTitle>
                    <DialogDescription>
                        กรอกเลขห้องเรียนสำหรับวิชานอกสาขานี้
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