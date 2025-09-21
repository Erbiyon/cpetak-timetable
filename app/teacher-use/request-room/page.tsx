"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";

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
        roomCate?: string;
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
    roomCate?: string;
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
    const [teacherInfo, setTeacherInfo] = useState<any>(null);
    const [accessDenied, setAccessDenied] = useState(false);


    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);


    useEffect(() => {
        if (session?.user?.id && status === "authenticated") {
            fetchTeacherInfo();
        }
    }, [session, status]);

    const fetchTeacherInfo = async () => {
        try {
            console.log('Fetching teacher info for:', session?.user?.id);
            const response = await fetch(`/api/teacher/${session?.user?.id}`);

            if (response.ok) {
                const teacherData = await response.json();
                console.log('Teacher info:', teacherData);
                setTeacherInfo(teacherData);


                if (teacherData.teacherType === "อาจารย์ภายนอกสาขา") {
                    console.log('Access denied: อาจารย์ภายนอกสาขา');
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                setAccessDenied(false);
            } else {
                console.error('Failed to fetch teacher info');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching teacher info:', error);
            setLoading(false);
        }
    };


    const fetchSubjects = async () => {
        if (accessDenied || !session?.user?.id) return;

        try {
            setLoading(true);
            console.log('Fetching subjects for teacher:', session.user.id);

            const params = new URLSearchParams({
                dep: 'ในสาขา',
                teacherId: session.user.id,
                ...(currentTermYear && { termYear: currentTermYear })
            });

            const res = await fetch(`/api/subject?${params}`);
            if (res.ok) {
                const data = await res.json();
                console.log("API response - subjects found:", data.length);


                const mySubjects = data.filter((subject: Subject) =>
                    subject.teacherId && subject.teacherId.toString() === session?.user?.id
                );

                setSubjects(mySubjects);
            } else {
                console.error('Failed to fetch subjects:', res.status, res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setLoading(false);
        }
    };


    const fetchRooms = async () => {
        if (accessDenied) return;

        try {
            console.log('Fetching rooms...');
            const response = await fetch('/api/room');
            if (response.ok) {
                const data = await response.json();

                const filteredRooms = data.filter((room: Room) => room.roomType == "อาคารสาขาวิศวกรรมคอมพิวเตอร์" || room.roomType == "ตึกวิศวกรรมศาสตร์");
                console.log("Rooms received:", filteredRooms);
                setRooms(filteredRooms);
            } else {
                console.error('Failed to fetch rooms');
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };


    useEffect(() => {
        async function fetchTermYear() {
            if (accessDenied) return;

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


        if (!accessDenied && teacherInfo && teacherInfo.teacherType !== "อาจารย์ภายนอกสาขา") {
            fetchTermYear();
        }
    }, [accessDenied, teacherInfo]);


    useEffect(() => {
        if (currentTermYear && !accessDenied && session?.user?.id) {
            fetchSubjects();
            fetchRooms();
        }
    }, [currentTermYear, accessDenied, session?.user?.id]);


    const handleRoomUpdate = async (subjectId: number, roomId: string) => {
        if (accessDenied) return;

        try {
            setUpdating(subjectId);


            const subject = subjects.find(s => s.id === subjectId);
            if (!subject) return;


            const isDVE = subject.planType === "DVE-MSIX" || subject.planType === "DVE-LVC";

            let updateSubjectIds: number[] = [subjectId];

            if (isDVE) {

                updateSubjectIds = subjects
                    .filter(s =>
                        s.subjectCode === subject.subjectCode &&
                        (s.planType === "DVE-MSIX" || s.planType === "DVE-LVC") &&
                        s.termYear === subject.termYear
                    )
                    .map(s => s.id);
            }


            await Promise.all(
                updateSubjectIds.map(id =>
                    fetch(`/api/subject/${id}/room`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomId: roomId === "none" ? null : parseInt(roomId),
                        }),
                    })
                )
            );


            await fetchSubjects();

            const selectedRoom = rooms.find(room => room.id === parseInt(roomId));
            console.log(
                roomId === "none"
                    ? "ลบการเลือกห้องเรียนแล้ว"
                    : `เลือกห้อง ${selectedRoom?.roomCode} แล้ว`
            );
        } catch (error) {
            console.error("Error updating room:", error);
        } finally {
            setUpdating(null);
        }
    };


    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };


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


    const sortYearLevels = (yearLevels: string[]) => {
        return yearLevels.sort((a, b) => {
            const getYearNumber = (yearLevel: string) => {
                const match = yearLevel.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            return getYearNumber(a) - getYearNumber(b);
        });
    };

    if (status === "loading" || (loading && !accessDenied)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <div>กำลังตรวจสอบสิทธิ์...</div>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }


    if (accessDenied) {
        return (
            <div className="container mx-auto p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="text-center py-12">
                        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-2">
                            ไม่มีสิทธิ์เข้าใช้งาน
                        </h2>
                        <p className="text-gray-600 mb-4">
                            หน้านี้สำหรับอาจารย์ในสาขาเท่านั้น
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">

            <div className="mb-6">
                <h1 className="text-3xl font-bold">เลือกห้องเรียนสำหรับวิชาที่สอน</h1>
                <p className="text-gray-600 mt-2">
                    จัดการห้องเรียนสำหรับวิชาที่คุณเป็นผู้สอน
                    {currentTermYear && (
                        <span className="ml-2">| ภาคเรียน: {currentTermYear}</span>
                    )}
                </p>
                {teacherInfo && (
                    <div className="mt-2 text-sm text-gray-500">
                        อาจารย์: {teacherInfo.tName} {teacherInfo.tLastName} ({teacherInfo.teacherType})
                    </div>
                )}
            </div>


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
                        <CardTitle>
                            วิชาที่สอน
                            <Badge variant="outline" className="ml-2">
                                {subjects.length} วิชา
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(groupedSubjects).map(([planType, yearLevels]) => (
                                <div key={planType} className="space-y-4">

                                    <div className="p-3 rounded-lg border bg-muted">
                                        <h3 className="font-bold text-lg">
                                            {getPlanTypeText(planType)}
                                            <Badge variant="outline" className="ml-2">
                                                {Object.values(yearLevels).flat().length} วิชา
                                            </Badge>
                                        </h3>
                                    </div>


                                    {sortYearLevels(Object.keys(yearLevels)).map((yearLevel) => {
                                        const subjects = yearLevels[yearLevel];

                                        return (
                                            <div key={`${planType}-${yearLevel}`} className="space-y-2">

                                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                                    <span className="font-medium">{yearLevel}</span>
                                                    <Badge variant="secondary">{subjects.length} วิชา</Badge>
                                                </div>


                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[100px]">รหัสวิชา</TableHead>
                                                            <TableHead>ชื่อวิชา</TableHead>
                                                            <TableHead className="w-[80px] text-center">กลุ่มเรียน</TableHead>
                                                            <TableHead className="w-[60px] text-center">หน่วยกิต</TableHead>
                                                            <TableHead className="w-[100px] text-center">ชั่วโมง</TableHead>
                                                            <TableHead className="w-[340px] text-center">ห้องเรียน</TableHead>
                                                            <TableHead className="w-[80px] text-center">สถานะ</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {subjects.map(subject => (
                                                            <TableRow
                                                                key={subject.id}
                                                                className="hover:bg-muted/50 bg-card"
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
                                                                <TableCell>
                                                                    <Select
                                                                        value={subject.roomId?.toString() || "none"}
                                                                        onValueChange={(value) => handleRoomUpdate(subject.id, value)}
                                                                        disabled={updating === subject.id}
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
                                                                                    {room.roomCate && (
                                                                                        <span className="text-xs text-muted-foreground ml-1">
                                                                                            - {room.roomCate}
                                                                                        </span>
                                                                                    )}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    {updating === subject.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center">

                                                                            {subject.roomId ? (
                                                                                <div title="เลือกห้องแล้ว">
                                                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                                                </div>
                                                                            ) : (
                                                                                <div title="ยังไม่เลือกห้อง">
                                                                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                                                                </div>
                                                                            )}
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
                            คุณยังไม่ได้รับมอบหมายให้สอนวิชาใดในภาคเรียนนี้
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับมอบหมายวิชา
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}