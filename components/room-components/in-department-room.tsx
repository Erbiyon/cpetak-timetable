import DelectRoomButtonCustom from "../delect-room-button/delect-room-button-custom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";

export default function IndepartmentRoom() {
    const [roomCode, setRoomCode] = useState("");
    const [rooms, setRooms] = useState<{ id: number; roomCode: string; roomType: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/room");
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleAddRoom = async () => {
        if (roomCode.trim() === "") return;

        try {
            setAdding(true);
            const res = await fetch("/api/room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomCode: roomCode.trim(),
                    roomType: "อาคารสาขาวิศวกรรมคอมพิวเตอร์"
                })
            });

            if (res.ok) {
                await fetchRooms();
                setRoomCode("");
            }
        } catch (error) {
            console.error("Error adding room:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleted = () => {
        fetchRooms();
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-3 text-xl font-bold">อาคารสาขาวิศวกรรมคอมพิวเตอร์</h1>
                <div className="flex justify-between items-center gap-4 mb-2">
                    <Input
                        type="text"
                        placeholder="กรุณากรองเลขห้อง"
                        className="w-5/6"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleAddRoom();
                        }}
                        disabled={adding}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-1/6"
                        onClick={handleAddRoom}
                        disabled={adding || roomCode.trim() === ""}
                    >
                        {adding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                เพิ่ม...
                            </>
                        ) : (
                            "เพิ่มห้อง"
                        )}
                    </Button>
                </div>

                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm max-h-[64vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">กำลังโหลดข้อมูลห้อง...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                    <TableHead>เลขห้อง</TableHead>
                                    <TableHead className="text-center">ปุ่มดำเนินการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.filter(room => room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์").length > 0 ? (
                                    rooms
                                        .filter(room => room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์")
                                        .map((room) => (
                                            <TableRow key={room.id}>
                                                <TableCell className="font-medium">{room.roomCode}</TableCell>
                                                <TableCell className="text-center">
                                                    <DelectRoomButtonCustom
                                                        roomId={room.id.toString()}
                                                        roomName={room.roomCode}
                                                        onDeleted={handleDeleted}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                            ไม่มีข้อมูลห้อง
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    )
}