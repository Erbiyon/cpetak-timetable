"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

export default function RoomsUse() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [timetables, setTimetables] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("in-department");

    // กลุ่มห้องเรียนตามประเภท (ใช้ roomType จริงๆ จากฐานข้อมูล)
    const roomGroups = useMemo(() => {
        const inDepartment: any[] = [];
        const outDepartment: any[] = [];
        const engineering: any[] = []; // เพิ่มกลุ่มตึกวิศวกรรมศาสตร์

        rooms.forEach(room => {
            // แยกตาม roomType ที่มีในฐานข้อมูล
            if (room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์") {
                inDepartment.push(room);
            } else if (room.roomType === "ห้องเรียนนอกสาขา") {
                outDepartment.push(room);
            } else if (room.roomType === "ตึกวิศวกรรมศาสตร์") { // เพิ่มเงื่อนไขสำหรับตึกวิศวฯ
                engineering.push(room);
            }
        });

        return {
            inDepartment,
            outDepartment,
            engineering // เพิ่มกลุ่มตึกวิศวกรรมศาสตร์
        };
    }, [rooms]);

    // โหลดข้อมูลห้องเรียนทั้งหมดเมื่อเปิดหน้า
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                // ใช้ API จริงที่มี
                const response = await fetch('/api/room');
                if (response.ok) {
                    const data = await response.json();
                    setRooms(data);

                    // ถ้ามีห้องอย่างน้อยหนึ่งห้อง ให้เลือกห้องแรกโดยอัตโนมัติ
                    if (data.length > 0) {
                        setSelectedRoomId(String(data[0].id));
                        // โหลดข้อมูลตารางเรียนของห้องแรกด้วย
                        fetchTimetableByRoom(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching rooms:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    // เมื่อเปลี่ยน tab ให้เลือกห้องแรกของแต่ละกลุ่มโดยอัตโนมัติ
    useEffect(() => {
        if (activeTab === "in-department" && roomGroups.inDepartment.length > 0) {
            const firstRoom = roomGroups.inDepartment[0];
            setSelectedRoomId(String(firstRoom.id));
            fetchTimetableByRoom(firstRoom.id);
        } else if (activeTab === "out-department" && roomGroups.outDepartment.length > 0) {
            const firstRoom = roomGroups.outDepartment[0];
            setSelectedRoomId(String(firstRoom.id));
            fetchTimetableByRoom(firstRoom.id);
        } else if (activeTab === "engineering" && roomGroups.engineering.length > 0) { // เพิ่มเงื่อนไขสำหรับตึกวิศวฯ
            const firstRoom = roomGroups.engineering[0];
            setSelectedRoomId(String(firstRoom.id));
            fetchTimetableByRoom(firstRoom.id);
        }
    }, [activeTab, roomGroups]);

    // โหลดข้อมูลตารางการใช้ห้องตามห้องที่เลือก
    const fetchTimetableByRoom = async (roomId: number) => {
        try {
            setLoading(true);
            console.log("Fetching timetable for room ID:", roomId); // เพิ่มการ log
            const response = await fetch(`/api/timetable?roomId=${roomId}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Timetable data received:", data); // เพิ่มการ log
                setTimetables(data);
            }
        } catch (error) {
            console.error("Error fetching room timetable:", error);
        } finally {
            setLoading(false);
        }
    };

    // เมื่อเลือกห้องให้โหลดข้อมูลตารางการใช้ห้องใหม่
    const handleRoomChange = (value: string) => {
        console.log("Room selected:", value); // เพิ่มการ log
        setSelectedRoomId(value);
        fetchTimetableByRoom(Number(value));
    };

    // สร้างข้อมูลตารางเวลาในรูปแบบที่ต้องการ
    const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
        const cellToSubject: { [cellKey: string]: any } = {};
        const cellColspan: { [cellKey: string]: number } = {};
        const cellSkip: Set<string> = new Set();

        // ตรวจสอบว่ามีข้อมูลตารางหรือไม่
        if (!timetables || timetables.length === 0) {
            console.log("No timetable data available");
            return { cellToSubject, cellColspan, cellSkip };
        }

        console.log(`Total timetable entries: ${timetables.length}, filtering for room ID: ${selectedRoomId}`);

        // กรองเฉพาะข้อมูลตารางของห้องที่เลือก
        const filteredTimetables = timetables.filter(item => String(item.roomId) === selectedRoomId);

        console.log(`Filtered timetable entries: ${filteredTimetables.length}`);

        // แปลงข้อมูลตารางเวลาให้เป็นรูปแบบที่ต้องการ
        filteredTimetables.forEach(item => {
            const { day, startPeriod, endPeriod, plan } = item;

            if (!plan) {
                return;
            }

            const cellKey = `${day}-${startPeriod}`;

            cellToSubject[cellKey] = {
                ...plan,
                room: item.room,
                teacher: item.teacher,
                day,
                startPeriod,
                endPeriod,
                termYear: item.termYear
            };

            const colspan = endPeriod - startPeriod + 1;
            cellColspan[cellKey] = colspan;

            // เพิ่มเซลล์ที่ต้องข้าม
            for (let p = startPeriod + 1; p <= endPeriod; p++) {
                cellSkip.add(`${day}-${p}`);
            }
        });

        return { cellToSubject, cellColspan, cellSkip };
    }, [timetables, selectedRoomId]); // เพิ่ม selectedRoomId เป็น dependency

    // สร้าง UI
    return (
        <div className="container mx-auto py-4">
            <h1 className="text-2xl font-bold mb-4">ตารางการใช้ห้องเรียน</h1>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>เลือกประเภทห้องและห้องเรียน</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="in-department" className="flex-1">
                                        อาคารสาขาวิศวกรรมคอมพิวเตอร์
                                    </TabsTrigger>
                                    <TabsTrigger value="engineering" className="flex-1">
                                        ตึกวิศวกรรมศาสตร์
                                    </TabsTrigger>
                                    <TabsTrigger value="out-department" className="flex-1">
                                        ห้องเรียนนอกสาขา
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="in-department">
                                    <Select key={`in-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนในสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.inDepartment.map(room => (
                                                <SelectItem key={`in-${room.id}`} value={String(room.id)}>
                                                    {room.roomCode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>
                                <TabsContent value="engineering">
                                    <Select key={`eng-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนตึกวิศวกรรมศาสตร์" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.engineering.map(room => (
                                                <SelectItem key={`eng-${room.id}`} value={String(room.id)}>
                                                    {room.roomCode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>
                                <TabsContent value="out-department">
                                    <Select key={`out-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนนอกสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.outDepartment.map(room => (
                                                <SelectItem key={`out-${room.id}`} value={String(room.id)}>
                                                    {room.roomCode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div>
                            {selectedRoomId && rooms.length > 0 && (
                                <div className="p-2 bg-muted rounded-md">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>รหัสห้อง:</div>
                                        <div className="font-medium">
                                            {rooms.find(r => r.id === Number(selectedRoomId))?.roomCode || "-"}
                                        </div>
                                        <div>ประเภทห้อง:</div>
                                        <div className="font-medium">
                                            {rooms.find(r => r.id === Number(selectedRoomId))?.roomType || "-"}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">กำลังโหลดข้อมูล...</span>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            ตารางการใช้ห้อง{" "}
                            {rooms.find(r => r.id === Number(selectedRoomId))?.roomCode || ""}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RoomTimetable
                            key={`timetable-${selectedRoomId}`} // เพิ่ม key เพื่อให้ render ใหม่เมื่อห้องเปลี่ยน
                            cellToSubject={cellToSubject}
                            cellColspan={cellColspan}
                            cellSkip={cellSkip}
                            roomId={selectedRoomId}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// คอมโพเนนต์แสดงตารางการใช้ห้อง
function RoomTimetable({
    cellToSubject,
    cellColspan,
    cellSkip,
    roomId
}: {
    cellToSubject: { [cellKey: string]: any };
    cellColspan: { [cellKey: string]: number };
    cellSkip: Set<string>;
    roomId: string;
}) {
    const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    console.log("Rendering timetable for room ID:", roomId);
    console.log("Available subjects:", Object.keys(cellToSubject).length);
    console.log("Cell keys:", Object.keys(cellToSubject));

    return (
        <div className="w-full overflow-x-auto">
            <table className="table-fixed border-collapse w-full">
                <thead>
                    <tr>
                        <th className="border px-2 py-1 text-xs w-[72px]">วัน/คาบ</th>
                        {Array.from({ length: 25 }, (_, i) => (
                            <th key={i} className="border px-2 py-1 text-xs" style={{ width: `${100 / 25}%` }}>
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day, dayIndex) => (
                        <tr key={dayIndex}>
                            <td className="border text-center text-xs w-[72px]">{day}</td>
                            {Array.from({ length: 25 }, (_, colIdx) => {
                                const period = colIdx;  // ไม่ต้อง +1 เพื่อให้ตรงกับ API

                                // เฉพาะวันพุธ (dayIndex === 2) คาบ 15-18 (14-17 ใน database)
                                if (dayIndex === 2 && period === 14) {
                                    return (
                                        <td
                                            key={`activity-${dayIndex}-${period}`}
                                            colSpan={4}
                                            className="border text-center bg-muted font-bold text-xs"
                                        >
                                            กิจกรรม
                                        </td>
                                    );
                                }

                                if (dayIndex === 2 && period > 14 && period <= 17) {
                                    return null;
                                }

                                // สำคัญ: ใช้ค่า dayIndex แทน day เพราะในตารางเราวนลูปโดยใช้ dayIndex
                                const cellKey = `${dayIndex}-${period}`;

                                // Debug
                                if (cellToSubject[cellKey]) {
                                    console.log(`Found subject at ${cellKey}:`, cellToSubject[cellKey].subjectCode);
                                }

                                // ตรวจสอบการข้ามเซลล์
                                if (cellSkip.has(cellKey)) {
                                    console.log(`Skipping cell ${cellKey}`);
                                    return null;
                                }

                                // เช็คว่าเซลล์นี้มีวิชาหรือไม่
                                const subject = cellToSubject[cellKey];
                                const colspan = cellColspan[cellKey] || 1;

                                // แสดงเลขคาบเรียนที่ถูกต้องใน UI (เริ่มที่ 1)
                                const displayPeriod = period + 1;

                                return (
                                    <td
                                        key={`cell-${dayIndex}-${displayPeriod}`}
                                        className={`border text-center h-[36px] p-0 align-middle overflow-hidden text-xs ${subject
                                            ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                                            : 'bg-card'
                                            }`}
                                        colSpan={colspan}
                                    >
                                        {subject ? (
                                            <SubjectInCell
                                                subject={{
                                                    ...subject,
                                                    // แปลงเลขคาบเพื่อแสดงผล
                                                    startPeriod: subject.startPeriod + 1,
                                                    endPeriod: subject.endPeriod + 1
                                                }}
                                                colspan={colspan}
                                            />
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// แสดงวิชาในตาราง
function SubjectInCell({
    subject,
    colspan = 1
}: {
    subject: any;
    colspan?: number;
}) {
    // คำนวณจำนวนชั่วโมงรวมของวิชา
    const lectureHours = subject.lectureHour || 0;
    const labHours = subject.labHour || 0;
    const totalHours = lectureHours + labHours;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full h-full p-1">
                        <div className="text-center">
                            <div className="font-medium text-green-950 dark:text-green-50">
                                {subject.subjectCode}
                                {subject.section && (
                                    <span className="text-[9px] ml-1 bg-green-200 dark:bg-green-700 px-1 py-0.5 rounded">
                                        sec.{subject.section}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] truncate text-green-900 dark:text-green-100">
                                {subject.subjectName}
                            </div>
                            <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                                <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded">
                                    {totalHours} ชม. ({lectureHours}/{labHours})
                                </span>
                                {colspan > 1 && (
                                    <span className="bg-green-300/30 dark:bg-green-600/30 px-1 rounded">
                                        {colspan} คาบ
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-slate-950 text-slate-50 dark:bg-slate-900">
                    <div className="text-xs p-1">
                        <div className="font-medium">
                            {subject.subjectCode}
                            {subject.section && <span className="ml-2">Section: {subject.section}</span>}
                        </div>
                        <div className="mt-1">{subject.subjectName}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>จำนวนหน่วยกิต:</div>
                            <div className="text-right">{subject.credit}</div>
                            <div>ชั่วโมงบรรยาย:</div>
                            <div className="text-right">{lectureHours} ชม.</div>
                            <div>ชั่วโมงปฏิบัติ:</div>
                            <div className="text-right">{labHours} ชม.</div>
                            <div>รวม:</div>
                            <div className="text-right">{totalHours} ชม. ({totalHours * 2} คาบ)</div>

                            {/* แสดงข้อมูลอาจารย์ผู้สอน */}
                            {subject.teacher && (
                                <>
                                    <div>อาจารย์:</div>
                                    <div className="text-right">{subject.teacher.tName} {subject.teacher.tLastName}</div>
                                </>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}