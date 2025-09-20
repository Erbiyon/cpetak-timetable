import DelectRoomButtonCustom from "../delect-room-button/delect-room-button-custom";
import AddRoomCustom from "../add-room/add-room-custom";
import EditRoomCustom from "../edit-room/edit-room-custom";
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

interface Room {
    id: number;
    roomCode: string;
    roomType: string;
    roomCate?: string;
}

export default function IndepartmentRoom() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDeleted = () => {
        fetchRooms();
    };

    const handleRoomAdded = () => {
        fetchRooms();
    };

    const handleRoomUpdated = () => {
        fetchRooms();
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mt-2 shadow-sm mx-auto">
            <div className="mx-4">
                <div className="flex justify-between items-center py-3">
                    <h1 className="text-xl font-bold">อาคารสาขาวิศวกรรมคอมพิวเตอร์</h1>
                    <AddRoomCustom
                        onRoomAdded={handleRoomAdded}
                        title="อาคารสาขาวิศวกรรมคอมพิวเตอร์"
                    />
                </div>

                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm max-h-[72vh] overflow-y-auto">
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
                                    <TableHead className="text-center">ประเภทห้อง</TableHead>
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
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(room.roomCate === "บรรยาย")
                                                            ? "bg-blue-100 text-blue-800"
                                                            : (room.roomCate === "ปฏิบัติ")
                                                                ? "bg-green-100 text-green-800"
                                                                : (room.roomCate === "ไม่ระบุ")
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-orange-100 text-orange-800"
                                                            }`}
                                                    >
                                                        {room.roomCate || "ไม่ระบุ"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <EditRoomCustom
                                                            roomId={room.id.toString()}
                                                            roomCode={room.roomCode}
                                                            roomType={room.roomType}
                                                            roomCate={room.roomCate}
                                                            onRoomUpdated={handleRoomUpdated}
                                                        />
                                                        <DelectRoomButtonCustom
                                                            roomId={room.id.toString()}
                                                            roomName={room.roomCode}
                                                            onDeleted={handleDeleted}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
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