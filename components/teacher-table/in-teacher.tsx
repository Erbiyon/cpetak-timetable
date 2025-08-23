"use client"

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { AddTeacherSubjectInCustom } from "../add-teacher/add-teacher-subject-in-custom";
import { Badge } from "@/components/ui/badge";

type Subject = {
    id: number;
    subjectName: string;
    subjectCode: string;
    yearLevel: string;
    planType: string;
    dep?: string;
    teacherId?: number | null;
    teacher?: {
        id: number;
        tName: string;
        tLastName: string;
    } | null;
};

type GroupedSubjects = {
    [planType: string]: {
        [yearLevel: string]: Subject[]
    }
};

export default function InTeacher() {
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

                // กรองเฉพาะวิชาในสาขาในภาคเรียนปัจจุบัน
                const filteredSubjects = data.filter((s: any) =>
                    s.dep === "วิชาในสาขา" &&
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
    const handleTeacherUpdated = () => {
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

    // เพิ่มฟังก์ชันสำหรับเรียงลำดับ planType
    const sortPlanTypes = (planTypes: string[]) => {
        const order = ["DVE-LVC", "DVE-MSIX", "TRANSFER", "FOUR_YEAR"];
        return planTypes.sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    };

    const isDVE = (planType: string) => {
        return planType.startsWith("DVE");
    };

    // สีพื้นหลังแต่ละแผนการเรียน (โทนฟ้า/เขียว/ม่วง/เทาอ่อน)
    const getPlanTypeBgColor = (planType: string) => {
        switch (planType) {
            case "DVE-LVC": return "bg-blue-50 dark:bg-blue-900";
            case "DVE-MSIX": return "bg-blue-100 dark:bg-blue-800";
            case "TRANSFER": return "bg-blue-200 dark:bg-blue-700";
            case "FOUR_YEAR": return "bg-blue-50 dark:bg-blue-900";
            default: return "bg-gray-50 dark:bg-gray-800";
        }
    };

    // สีพื้นหลังแต่ละชั้นปี (เฉดเทาอ่อนต่างกันเล็กน้อย)
    const getYearLevelBgColor = (yearLevel: string) => {
        if (yearLevel.includes("1")) return "bg-gray-100 dark:bg-gray-700";
        if (yearLevel.includes("2")) return "bg-gray-200 dark:bg-gray-600";
        if (yearLevel.includes("3")) return "bg-gray-100 dark:bg-gray-700";
        if (yearLevel.includes("4")) return "bg-gray-200 dark:bg-gray-600";
        return "bg-gray-50 dark:bg-gray-800";
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-3 mx-5 py-5 shadow-sm">
            <div className="flex justify-between items-center mx-8">
                <h2 className="text-xl font-bold">
                    เพิ่มชื่ออาจารย์ให้วิชาภายในสาขา
                    {termYear && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({termYear})
                        </span>
                    )}
                </h2>
            </div>

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8 max-h-[73vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">กำลังโหลดข้อมูลวิชาในสาขา...</span>
                    </div>
                ) : Object.keys(groupedSubjects).length > 0 ? (
                    <div className="space-y-6 p-4">
                        {sortPlanTypes(Object.keys(groupedSubjects)).map(planType => {
                            const yearLevels = groupedSubjects[planType];

                            return (
                                <div key={planType} className="space-y-4">
                                    {/* หัวข้อ Plan Type */}
                                    <div className={`p-3 rounded-lg border border-border ${getPlanTypeBgColor(planType)}`}>
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
                                                <div className={`flex items-center gap-2 p-2 rounded-md ${getYearLevelBgColor(yearLevel)}`}>
                                                    <span className="font-medium">{yearLevel}</span>
                                                    <Badge variant="secondary">{subjects.length} วิชา</Badge>
                                                    <span className="text-muted-foreground text-xs">({getPlanTypeText(planType)})</span>
                                                </div>

                                                {/* ตารางวิชา */}
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[120px]">ชื่อจริง</TableHead>
                                                            <TableHead className="w-[120px]">นามสกุล</TableHead>
                                                            <TableHead className="w-[100px]">รหัสวิชา</TableHead>
                                                            <TableHead>ชื่อวิชา</TableHead>
                                                            <TableHead className="text-center w-[100px]">สอนร่วม</TableHead>
                                                            <TableHead className="text-center w-[100px]">ดำเนินการ</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {subjects.map(subject => (
                                                            <TableRow key={subject.id} className="hover:bg-muted/50">
                                                                <TableCell className="font-medium">
                                                                    {subject.teacher?.tName || "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {subject.teacher?.tLastName || "-"}
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
                                                                    {isDVE(subject.planType) ? (
                                                                        null
                                                                    ) : (
                                                                        <div>❌</div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <AddTeacherSubjectInCustom
                                                                        subjectId={subject.id}
                                                                        teacherName={`${subject.teacher?.tName || ""} ${subject.teacher?.tLastName || ""}`.trim()}
                                                                        onUpdate={handleTeacherUpdated}
                                                                        subjectName={subject.subjectName}
                                                                        subjectCode={subject.subjectCode}
                                                                        planType={subject.planType}
                                                                        termYear={termYear}
                                                                        yearLevel={subject.yearLevel}
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
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        {termYear
                            ? `ไม่มีวิชาในสาขาในภาคเรียน ${termYear}`
                            : "ไม่มีข้อมูลภาคเรียน"
                        }
                    </div>
                )}
            </div>
        </div>
    )
}
