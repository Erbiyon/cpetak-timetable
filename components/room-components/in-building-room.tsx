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
import React, { useState, useEffect } from "react";

export default function InbuildingRoom() {
    const [roomCode, setRoomCode] = useState("");
    const [rooms, setRooms] = useState<{ id: number; roomCode: string; roomType: string }[]>([]);

    const fetchRooms = async () => {
        const res = await fetch("/api/room");
        const data = await res.json();
        setRooms(data);
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleAddRoom = async () => {
        if (roomCode.trim() === "") return;
        const res = await fetch("/api/room", {
            method: "POST",
            body: JSON.stringify({
                roomCode: roomCode.trim(),
                roomType: "ตึกวิศวกรรมศาสตร์"
            })
        });
        if (res.ok) {
            await fetchRooms();
            setRoomCode("");
        }
    };

    const handleDeleted = () => {
        fetchRooms();
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-3">ตึกวิศวกรรมศาสตร์</h1>
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
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        className="w-1/6"
                        onClick={handleAddRoom}
                    >
                        เพิ่มห้อง
                    </Button>
                </div>

                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm max-h-[71vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                            <TableRow>
                                <TableHead>เลขห้อง</TableHead>
                                <TableHead className="text-center">ปุ่มดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.filter(room => room.roomType === "ตึกวิศวกรรมศาสตร์").length > 0 ? (
                                rooms
                                    .filter(room => room.roomType === "ตึกวิศวกรรมศาสตร์")
                                    .map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell>{room.roomCode}</TableCell>
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
                                    <TableCell colSpan={2} className="text-center">ไม่มีข้อมูล</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}