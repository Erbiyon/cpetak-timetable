"use client"

import { useEffect, useState } from "react";
import AddRoomSubjectOutCustom from "../add-room-subject-out/add-room-subject-out-custom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";

type Subject = {
    id: number;
    subjectName: string;
    subjectCode: string;
    yearLevel: string;
    planType: string;
    dep?: string;
    roomId?: number | null;
    room?: {
        id: number;
        roomCode: string;
    } | null;
};

type GroupedSubjects = {
    [planType: string]: {
        [yearLevel: string]: Subject[]
    }
};

export default function OutdepartmentRoom() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [termYear, setTermYear] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/subject");
            if (res.ok) {
                const data = await res.json();
                console.log("API response:", data);

                // กรองเฉพาะวิชานอกสาขาในภาคเรียนปัจจุบัน
                const filteredSubjects = data.filter((s: any) =>
                    s.dep === "นอกสาขา" &&
                    s.termYear === `ภาคเรียนที่ ${termYear}`
                );
                console.log("Filtered subjects:", filteredSubjects);

                setSubjects(filteredSubjects);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    // โหลดข้อมูล term year ปัจจุบัน
    useEffect(() => {
        async function fetchTermYear() {
            try {
                const res = await fetch("/api/current-term-year");
                if (res.ok) {
                    const data = await res.json();
                    setTermYear(data.termYear);
                }
            } catch (error) {
                console.error("Failed to fetch term year:", error);
                setLoading(false);
            }
        }
        fetchTermYear();
    }, []);

    // โหลดข้อมูลวิชาเมื่อมีการเปลี่ยน term year หรือมีการรีเฟรช
    useEffect(() => {
        if (termYear) {
            fetchSubjects();
        }
    }, [termYear, refreshKey]);

    // ฟังก์ชันสำหรับแปลง planType เป็นข้อความภาษาไทย
    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    // ฟังก์ชันสำหรับรีโหลดข้อมูลหลังจากอัปเดต
    const handleRoomUpdated = () => {
        setRefreshKey(prev => prev + 1);
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

    // เพิ่มฟังก์ชันสำหรับเรียงลำดับ yearLevel
    const sortYearLevels = (yearLevels: string[]) => {
        return yearLevels.sort((a, b) => {
            // แยกเลขจากชื่อ yearLevel (เช่น "ปวส.1" -> 1, "ปวส.2" -> 2)
            const getYearNumber = (yearLevel: string) => {
                const match = yearLevel.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };

            const yearA = getYearNumber(a);
            const yearB = getYearNumber(b);

            return yearA - yearB; // เรียงจากน้อยไปมาก (1, 2, 3, 4)
        });
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-auto">
            <div className="flex justify-between items-center mx-8">
                <h2 className="text-xl font-bold">
                    เพิ่มห้องเรียนของวิชานอกสาขา
                    {termYear && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({termYear})
                        </span>
                    )}
                </h2>
            </div>

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">กำลังโหลดข้อมูลห้องเรียน...</span>
                    </div>
                ) : Object.keys(groupedSubjects).length > 0 ? (
                    <div className="space-y-6 p-4">
                        {Object.entries(groupedSubjects).map(([planType, yearLevels]) => (
                            <div key={planType} className="space-y-4">
                                {/* หัวข้อ Plan Type */}
                                <div className="p-3 rounded-lg border bg-muted border-border">
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
                                                        <TableHead className="w-[120px]">เลขห้อง</TableHead>
                                                        <TableHead className="w-[100px]">ประเภท</TableHead>
                                                        <TableHead className="w-[100px]">รหัสวิชา</TableHead>
                                                        <TableHead>ชื่อวิชา</TableHead>
                                                        <TableHead className="text-center w-[100px]">ดำเนินการ</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {subjects.map(subject => (
                                                        <TableRow key={subject.id} className="hover:bg-muted/50">
                                                            <TableCell className="font-medium">
                                                                {subject.room?.roomCode || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-xs">
                                                                {subject.room?.roomCode ? (
                                                                    <span className={
                                                                        subject.room.roomCode.toUpperCase().startsWith("ENG")
                                                                            ? "text-blue-600"
                                                                            : "text-gray-600"
                                                                    }>
                                                                        {subject.room.roomCode.toUpperCase().startsWith("ENG")
                                                                            ? "ตึกวิศวกรรม"
                                                                            : "นอกสาขา"
                                                                        }
                                                                    </span>
                                                                ) : "-"}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">
                                                                {subject.subjectCode}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium text-sm">
                                                                    {subject.subjectName}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <AddRoomSubjectOutCustom
                                                                    subjectId={subject.id}
                                                                    roomCode={subject.room?.roomCode || ""}
                                                                    onUpdate={handleRoomUpdated}
                                                                />
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
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        {termYear
                            ? `ไม่มีวิชานอกสาขาในภาคเรียน ${termYear}`
                            : "ไม่มีข้อมูลภาคเรียน"
                        }
                    </div>
                )}
            </div>
        </div>
    );
}