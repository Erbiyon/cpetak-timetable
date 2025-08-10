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
import DownloadRoomButton from "@/components/room-download/download-room-button";

export default function RoomsUse() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [timetables, setTimetables] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("in-department");

    // เพิ่มสำหรับภาคเรียนปัจจุบัน
    const [currentTermYear, setCurrentTermYear] = useState<string>("");

    // กลุ่มห้องเรียนตามประเภท
    const roomGroups = useMemo(() => {
        const inDepartment: any[] = [];
        const outDepartment: any[] = [];
        const engineering: any[] = [];

        rooms.forEach(room => {
            if (room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์") {
                inDepartment.push(room);
            } else if (room.roomType === "ห้องเรียนนอกสาขา") {
                outDepartment.push(room);
            } else if (room.roomType === "ตึกวิศวกรรมศาสตร์") {
                engineering.push(room);
            }
        });

        return { inDepartment, outDepartment, engineering };
    }, [rooms]);

    // โหลดข้อมูลเริ่มต้น
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // โหลดข้อมูลห้องเรียน
                const roomsResponse = await fetch('/api/room');
                if (roomsResponse.ok) {
                    const roomsData = await roomsResponse.json();
                    setRooms(roomsData);
                }

                // โหลดข้อมูลภาคเรียนปัจจุบันจาก TermYear_tb
                const termYearResponse = await fetch('/api/current-term-year');
                if (termYearResponse.ok) {
                    const termYearData = await termYearResponse.json();
                    setCurrentTermYear(termYearData.termYear);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // เมื่อเปลี่ยน tab ให้เลือกห้องแรกของแต่ละกลุ่มโดยอัตโนมัติ
    useEffect(() => {
        if (!currentTermYear) return; // รอให้โหลดภาคเรียนก่อน

        if (activeTab === "in-department") {
            if (roomGroups.inDepartment.length > 0) {
                const firstRoom = roomGroups.inDepartment[0];
                setSelectedRoomId(String(firstRoom.id));
                fetchTimetableByRoom(firstRoom.id, currentTermYear);
            } else {
                setSelectedRoomId("");
                setTimetables([]);
            }
        } else if (activeTab === "out-department") {
            if (roomGroups.outDepartment.length > 0) {
                const firstRoom = roomGroups.outDepartment[0];
                setSelectedRoomId(String(firstRoom.id));
                fetchTimetableByRoom(firstRoom.id, currentTermYear);
            } else {
                setSelectedRoomId("");
                setTimetables([]);
            }
        } else if (activeTab === "engineering") {
            if (roomGroups.engineering.length > 0) {
                const firstRoom = roomGroups.engineering[0];
                setSelectedRoomId(String(firstRoom.id));
                fetchTimetableByRoom(firstRoom.id, currentTermYear);
            } else {
                setSelectedRoomId("");
                setTimetables([]);
            }
        }
    }, [activeTab, roomGroups, currentTermYear]);

    // โหลดข้อมูลตารางการใช้ห้องตามห้องและภาคเรียนปัจจุบัน
    const fetchTimetableByRoom = async (roomId: number, termYear: string) => {
        try {
            setLoading(true);
            console.log("Fetching timetable for room ID:", roomId, "Term Year:", termYear);

            const response = await fetch(`/api/timetable?roomId=${roomId}&termYear=${encodeURIComponent(termYear)}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Timetable data received:", data);
                setTimetables(data);
            }
        } catch (error) {
            console.error("Error fetching room timetable:", error);
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    };

    // เมื่อเลือกห้องให้โหลดข้อมูลตารางการใช้ห้องใหม่
    const handleRoomChange = (value: string) => {
        console.log("Room selected:", value);
        setSelectedRoomId(value);
        if (currentTermYear) {
            fetchTimetableByRoom(Number(value), currentTermYear);
        }
    };

    // สร้างข้อมูลตารางเวลาในรูปแบบที่ต้องการ
    const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
        const cellToSubject: { [cellKey: string]: any } = {};
        const cellColspan: { [cellKey: string]: number } = {};
        const cellSkip: Set<string> = new Set();

        // ตรวจสอบว่ามีข้อมูลตารางหรือไม่
        if (!timetables || timetables.length === 0 || !currentTermYear) {
            console.log("No timetable data available or no term year");
            return { cellToSubject, cellColspan, cellSkip };
        }

        console.log(`Total timetable entries: ${timetables.length}, filtering for room ID: ${selectedRoomId}, Term Year: ${currentTermYear}`);

        // กรองเฉพาะข้อมูลตารางของห้องและภาคเรียนปัจจุบัน
        const filteredTimetables = timetables.filter(item => {
            const roomMatch = String(item.roomId) === selectedRoomId;
            const termYearMatch = item.termYear === currentTermYear;
            return roomMatch && termYearMatch;
        });

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
    }, [timetables, selectedRoomId, currentTermYear]);

    // สร้าง UI
    return (
        <div className="container mx-auto px-6 pt-2">
            <h2 className="text-2xl font-bold mb-2">ตารางการใช้ห้องเรียน</h2>

            <Card className="mb-2">
                <CardHeader>
                    <CardTitle>
                        เลือกประเภทห้องและห้องเรียน
                        {currentTermYear && (
                            <span className="text-base font-normal text-muted-foreground ml-2">
                                ({currentTermYear})
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 h-auto gap-1 p-1">
                                    <TabsTrigger
                                        value="in-department"
                                        className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-normal text-center"
                                    >
                                        อาคารสาขาวิศวกรรมคอมพิวเตอร์
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="engineering"
                                        className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-normal text-center"
                                    >
                                        ตึกวิศวกรรมศาสตร์
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="out-department"
                                        className="text-xs sm:text-sm px-2 py-2 h-auto whitespace-normal text-center"
                                    >
                                        ห้องเรียนนอกสาขา
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="in-department">
                                    <Select key={`in-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนในสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.inDepartment.length > 0 ? (
                                                roomGroups.inDepartment.map(room => (
                                                    <SelectItem key={`in-${room.id}`} value={String(room.id)}>
                                                        {room.roomCode}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    ไม่มีข้อมูลห้องเรียน
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {roomGroups.inDepartment.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            ยังไม่มีการเพิ่มห้องเรียนในอาคารสาขาวิศวกรรมคอมพิวเตอร์
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent value="engineering">
                                    <Select key={`eng-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนตึกวิศวกรรมศาสตร์" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.engineering.length > 0 ? (
                                                roomGroups.engineering.map(room => (
                                                    <SelectItem key={`eng-${room.id}`} value={String(room.id)}>
                                                        {room.roomCode}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    ไม่มีข้อมูลห้องเรียน
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {roomGroups.engineering.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            ยังไม่มีการเพิ่มห้องเรียนในตึกวิศวกรรมศาสตร์
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent value="out-department">
                                    <Select key={`out-${activeTab}`} value={selectedRoomId} onValueChange={handleRoomChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกห้องเรียนนอกสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomGroups.outDepartment.length > 0 ? (
                                                roomGroups.outDepartment.map(room => (
                                                    <SelectItem key={`out-${room.id}`} value={String(room.id)}>
                                                        {room.roomCode}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    ไม่มีข้อมูลห้องเรียน
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {roomGroups.outDepartment.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            ยังไม่มีการเพิ่มห้องเรียนนอกสาขา
                                        </p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div>
                            {selectedRoomId && currentTermYear && rooms.length > 0 && (
                                <div className="p-3 bg-muted rounded-md">
                                    <div className="text-sm font-medium mb-2">ข้อมูลที่แสดง</div>
                                    <div className="grid grid-cols-1 gap-1 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">ภาคเรียน:</span>{" "}
                                            <span className="font-medium">{currentTermYear}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">รหัสห้อง:</span>{" "}
                                            <span className="font-medium">
                                                {rooms.find(r => r.id === Number(selectedRoomId))?.roomCode || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">ประเภทห้อง:</span>{" "}
                                            <span className="font-medium">
                                                {rooms.find(r => r.id === Number(selectedRoomId))?.roomType || "-"}
                                            </span>
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
            ) : selectedRoomId && currentTermYear ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="text-lg font-semibold">
                                ตารางการใช้ห้อง{" "}
                                {rooms.find(r => r.id === Number(selectedRoomId))?.roomCode || ""}{" "}
                                <span className="text-base font-normal text-muted-foreground">
                                    ({currentTermYear})
                                </span>
                            </div>

                            <DownloadRoomButton />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RoomTimetable
                            key={`timetable-${selectedRoomId}-${currentTermYear}`}
                            cellToSubject={cellToSubject}
                            cellColspan={cellColspan}
                            cellSkip={cellSkip}
                            roomId={selectedRoomId}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">
                            {!currentTermYear
                                ? "กำลังโหลดข้อมูลภาคเรียน..."
                                : "กรุณาเลือกห้องเรียนเพื่อดูตารางการใช้งาน"
                            }
                        </p>
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