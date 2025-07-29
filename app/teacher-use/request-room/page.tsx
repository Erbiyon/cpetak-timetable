"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Plus, User, UserCheck } from "lucide-react";

type Subject = {
    id: number;
    subjectCode: string;
    subjectName: string;
    credit: number;
    lectureHour: number;
    labHour: number;
    yearLevel: string;
    planType: string;
    section?: string;
    termYear: string;
    dep?: string;
    roomId?: number | null;
    teacherId?: number | null;
    room?: {
        id: number;
        roomCode: string;
        roomType: string;
    } | null;
    teacher?: {
        id: number;
        tName: string;
        tLastName: string;
        tId: string;
    } | null;
};

type Room = {
    id: number;
    roomCode: string;
    roomType: string;
};

type GroupedSubjects = {
    [planType: string]: {
        [yearLevel: string]: Subject[]
    }
};

export default function RequestRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentTermYear, setCurrentTermYear] = useState<string>("");
    const [updating, setUpdating] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // เพิ่ม scroll position tracking
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // โหลดวิชาในสาขาทั้งหมด (เหมือน OutdepartmentRoom)
    const fetchSubjects = async (preserveScroll = false) => {
        try {
            setRefreshing(true);
            const currentScrollY = preserveScroll ? window.scrollY : 0;

            console.log('Fetching subjects with params:', {
                dep: 'ในสาขา',
                termYear: currentTermYear
            });

            const params = new URLSearchParams({
                dep: 'ในสาขา',
                ...(currentTermYear && { termYear: currentTermYear })
            });

            const res = await fetch(`/api/subject?${params}`);
            if (res.ok) {
                const data = await res.json();
                console.log("API response - subjects found:", data.length);
                setSubjects(data);

                // กลับไปยังตำแหน่ง scroll เดิม
                if (preserveScroll) {
                    setTimeout(() => {
                        window.scrollTo(0, currentScrollY);
                    }, 50);
                }
            } else {
                console.error('Failed to fetch subjects:', res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // โหลดข้อมูลห้องเรียน
    const fetchRooms = async () => {
        try {
            console.log('Fetching rooms...');
            const response = await fetch('/api/room');
            if (response.ok) {
                const data = await response.json();
                console.log("Rooms received:", data);
                setRooms(data);
            } else {
                console.error('Failed to fetch rooms');
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    // โหลดข้อมูล term year ปัจจุบัน
    useEffect(() => {
        async function fetchTermYear() {
            try {
                const res = await fetch("/api/current-term-year");
                if (res.ok) {
                    const data = await res.json();
                    console.log('Current term year:', data);
                    setCurrentTermYear(data.termYear);
                } else {
                    console.error('Failed to fetch term year');
                }
            } catch (error) {
                console.error("Failed to fetch term year:", error);
                setLoading(false);
            }
        }
        fetchTermYear();
    }, []);

    // โหลดข้อมูลวิชาและห้องเมื่อมีการเปลี่ยน term year
    useEffect(() => {
        if (currentTermYear && !refreshing) {
            fetchSubjects();
            fetchRooms();
        }
    }, [currentTermYear]);

    // Function สำหรับ refresh ข้อมูลโดยไม่เปลี่ยน scroll
    const refreshData = async () => {
        if (currentTermYear) {
            await fetchSubjects(true); // ส่ง true เพื่อ preserve scroll
        }
    };

    // อัปเดตห้องเรียน
    const handleRoomUpdate = async (subjectId: number, roomId: string) => {
        try {
            setUpdating(subjectId);
            console.log('Updating room for subject:', subjectId, 'to room:', roomId);

            const response = await fetch(`/api/subject/${subjectId}/room`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId === "none" ? null : parseInt(roomId),
                }),
            });

            if (response.ok) {
                // ใช้ refreshData แทน setRefreshKey
                await refreshData();

                const selectedRoom = rooms.find(room => room.id === parseInt(roomId));
                console.log(
                    roomId === "none"
                        ? "ลบการเลือกห้องเรียนแล้ว"
                        : `เลือกห้อง ${selectedRoom?.roomCode} แล้ว`
                );
            } else {
                console.error("เกิดข้อผิดพลาดในการอัปเดตห้องเรียน");
            }
        } catch (error) {
            console.error("Error updating room:", error);
        } finally {
            setUpdating(null);
        }
    };

    // รับสอนวิชา
    const handleTakeSubject = async (subjectId: number) => {
        try {
            setUpdating(subjectId);
            console.log('Taking subject:', subjectId, 'for teacher:', session?.user?.id);

            const response = await fetch(`/api/subject/${subjectId}/teacher`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId: parseInt(session?.user?.id || "0"),
                }),
            });

            if (response.ok) {
                // ใช้ refreshData แทน setRefreshKey
                await refreshData();
                console.log("รับสอนวิชาเรียบร้อยแล้ว");
            } else {
                console.error("เกิดข้อผิดพลาดในการรับสอนวิชา");
            }
        } catch (error) {
            console.error("Error taking subject:", error);
        } finally {
            setUpdating(null);
        }
    };

    // ยกเลิกการสอนวิชา
    const handleRemoveSubject = async (subjectId: number) => {
        try {
            setUpdating(subjectId);
            console.log('Removing subject:', subjectId);

            // Step 1: ลบห้องเรียนก่อน (ถ้ามี)
            const subject = subjects.find(s => s.id === subjectId);
            if (subject?.roomId) {
                console.log('Removing room assignment first...');
                const roomResponse = await fetch(`/api/subject/${subjectId}/room`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roomId: null,
                    }),
                });

                if (!roomResponse.ok) {
                    console.error("เกิดข้อผิดพลาดในการลบห้องเรียน");
                    return;
                }
            }

            // Step 2: ลบอาจารย์ผู้สอน
            const response = await fetch(`/api/subject/${subjectId}/teacher`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId: null,
                }),
            });

            if (response.ok) {
                // รีเฟรชข้อมูลโดยไม่เปลี่ยน scroll position
                await refreshData();
                console.log("ยกเลิกการสอนวิชาเรียบร้อยแล้ว");
            } else {
                console.error("เกิดข้อผิดพลาดในการยกเลิกการสอนวิชา");
            }
        } catch (error) {
            console.error("Error removing subject:", error);
        } finally {
            setUpdating(null);
        }
    };

    // แปลง planType เป็นข้อความภาษาไทย
    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    // ตรวจสอบว่าเป็นวิชาของอาจารย์คนนี้หรือไม่
    const isMySubject = (subject: Subject) => {
        return subject.teacherId && subject.teacherId.toString() === session?.user?.id;
    };

    // จัดกลุ่มวิชาตาม planType และ yearLevel
    const groupedSubjects: GroupedSubjects = subjects.reduce((acc, subject) => {
        if (!acc[subject.planType]) {
            acc[subject.planType] = {};
        }
        if (!acc[subject.planType][subject.yearLevel]) {
            acc[subject.planType][subject.yearLevel] = [];
        }
        acc[subject.planType][subject.yearLevel].push(subject);
        return acc;
    }, {} as GroupedSubjects);

    // เรียงลำดับ yearLevel
    const sortYearLevels = (yearLevels: string[]) => {
        return yearLevels.sort((a, b) => {
            const getYearNumber = (yearLevel: string) => {
                const match = yearLevel.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            return getYearNumber(a) - getYearNumber(b);
        });
    };

    // Debug info
    console.log('Current state:', {
        loading,
        totalSubjects: subjects.length,
        currentTermYear,
        session: session?.user?.id
    });

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <div>กำลังโหลด...</div>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">การจัดการวิชาและห้องเรียน</h1>
                <p className="text-gray-600 mt-2">
                    เลือกวิชาที่สอนและเลือกห้องเรียนสำหรับวิชาในสาขา
                    {currentTermYear && (
                        <span className="ml-2">| ภาคเรียน: {currentTermYear}</span>
                    )}
                </p>
            </div>

            {/* รายการวิชา */}
            {loading ? (
                <Card>
                    <CardContent className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                        <span>กำลังโหลดรายการวิชา...</span>
                    </CardContent>
                </Card>
            ) : Object.keys(groupedSubjects).length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>รายการวิชาในสาขา</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(groupedSubjects).map(([planType, yearLevels]) => (
                                <div key={planType} className="space-y-4">
                                    {/* หัวข้อ Plan Type */}
                                    <div className="p-3 rounded-lg border bg-muted">
                                        <h3 className="font-bold text-lg">
                                            {getPlanTypeText(planType)}
                                            <Badge variant="outline" className="ml-2">
                                                {Object.values(yearLevels).flat().length} วิชา
                                            </Badge>
                                        </h3>
                                    </div>

                                    {/* แสดงกลุ่มตาม Year Level */}
                                    {sortYearLevels(Object.keys(yearLevels)).map((yearLevel) => {
                                        const subjects = yearLevels[yearLevel];

                                        return (
                                            <div key={`${planType}-${yearLevel}`} className="space-y-2">
                                                {/* หัวข้อ Year Level */}
                                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                                    <span className="font-medium">{yearLevel}</span>
                                                    <Badge variant="secondary">{subjects.length} วิชา</Badge>
                                                </div>

                                                {/* ตารางวิชา */}
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[100px]">รหัสวิชา</TableHead>
                                                            <TableHead>ชื่อวิชา</TableHead>
                                                            <TableHead className="w-[80px] text-center">Section</TableHead>
                                                            <TableHead className="w-[60px] text-center">หน่วยกิต</TableHead>
                                                            <TableHead className="w-[100px] text-center">ชั่วโมง</TableHead>
                                                            <TableHead className="w-[120px] text-center">อาจารย์ผู้สอน</TableHead>
                                                            <TableHead className="w-[150px] text-center">ห้องเรียน</TableHead>
                                                            <TableHead className="w-[100px] text-center">การจัดการ</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {subjects.map(subject => (
                                                            <TableRow
                                                                key={subject.id}
                                                                className={`hover:bg-muted/50 ${isMySubject(subject) ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                                                                    }`}
                                                            >
                                                                <TableCell className="font-mono text-sm">
                                                                    {subject.subjectCode}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="font-medium text-sm">
                                                                        {subject.subjectName}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    {subject.section && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {subject.section}
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    {subject.credit}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs">
                                                                    <div>บรรยาย: {subject.lectureHour} ชม.</div>
                                                                    <div>ปฏิบัติ: {subject.labHour} ชม.</div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    {subject.teacher ? (
                                                                        <div className="text-xs">
                                                                            <div className="font-medium">
                                                                                {subject.teacher.tName} {subject.teacher.tLastName}
                                                                            </div>
                                                                            <div className="text-muted-foreground">
                                                                                {subject.teacher.tId}
                                                                            </div>
                                                                            {isMySubject(subject) && (
                                                                                <Badge variant="secondary" className="text-xs mt-1">
                                                                                    คุณ
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground text-xs">
                                                                            ยังไม่มีผู้สอน
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Select
                                                                        value={subject.roomId?.toString() || "none"}
                                                                        onValueChange={(value) => handleRoomUpdate(subject.id, value)}
                                                                        disabled={updating === subject.id || !isMySubject(subject)}
                                                                    >
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="เลือกห้อง" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">ไม่เลือกห้อง</SelectItem>
                                                                            {rooms.map(room => (
                                                                                <SelectItem key={room.id} value={room.id.toString()}>
                                                                                    {room.roomCode}
                                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                                        ({room.roomType})
                                                                                    </span>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    {updating === subject.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            {/* ปุ่มรับสอน/ยกเลิกสอน */}
                                                                            {isMySubject(subject) ? (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    onClick={() => handleRemoveSubject(subject.id)}
                                                                                    className="h-6 px-2 text-xs"
                                                                                >
                                                                                    ยกเลิก
                                                                                </Button>
                                                                            ) : !subject.teacherId ? (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => handleTakeSubject(subject.id)}
                                                                                    className="h-6 px-2 text-xs"
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    สอน
                                                                                </Button>
                                                                            ) : (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    มีผู้สอนแล้ว
                                                                                </span>
                                                                            )}

                                                                            {/* ไอคอนสถานะอาจารย์และห้อง */}
                                                                            <div className="flex items-center gap-1 ml-2">
                                                                                {/* ไอคอนสถานะอาจารย์ */}
                                                                                {subject.teacherId ? (
                                                                                    <div title="มีอาจารย์ผู้สอน">
                                                                                        <UserCheck className="h-4 w-4 text-blue-600" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div title="ยังไม่มีอาจารย์ผู้สอน">
                                                                                        <User className="h-4 w-4 text-gray-400" />
                                                                                    </div>
                                                                                )}

                                                                                {/* ไอคอนสถานะห้อง */}
                                                                                {subject.roomId ? (
                                                                                    <div title="เลือกห้องแล้ว">
                                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div title="ยังไม่เลือกห้อง">
                                                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">
                            ไม่มีวิชาในสาขาในภาคเรียนนี้
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มวิชาในระบบ
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}