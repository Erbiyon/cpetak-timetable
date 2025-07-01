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
import { SquarePlus } from "lucide-react"
import React, { useState } from "react"

type AddRoomSubjectOutCustomProps = {
    subjectId: number
    roomCode?: string
}

export default function AddRoomSubjectOutCustom({
    subjectId,
    roomCode
}: AddRoomSubjectOutCustomProps) {
    const [room, setRoom] = useState(roomCode ?? "")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            let roomId: number | null = null
            const res = await fetch("/api/room")
            const rooms = await res.json()
            const found = rooms.find((r: any) => r.roomCode === room)
            if (found) {
                roomId = found.id
            } else {
                const createRes = await fetch("/api/room", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomCode: room, roomType: "out" }),
                })
                const created = await createRes.json()
                roomId = created.id
            }

            await fetch(`/api/subject/${subjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId }),
            })

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog>
            <form onSubmit={handleSubmit}>
                <DialogTrigger asChild>
                    <Button variant="ghost"><SquarePlus color="#00ff00" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>เพิ่มห้องนอกสาขา</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลให้ครบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                        <div className="flex flex-col gap-3 w-1/4">
                            <Label htmlFor="room-code" className="mb-1 text-left">เลขห้อง</Label>
                            <Input
                                id="room-code"
                                name="room-code"
                                value={room}
                                onChange={e => setRoom(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={loading}>ยกเลิก</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? "กำลังเพิ่ม..." : "เพิ่ม"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}