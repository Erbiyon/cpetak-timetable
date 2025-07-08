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
import { AddTeacherSubjectOutCustom } from "../add-teacher-subject-out/add-teacher-subject-out-custom";

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

export default function OutdepartmentTeacher() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [termYear, setTermYear] = useState<string>("x/xxxx");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchSubjects = async () => {
        try {
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
        }
    };

    // โหลดข้อมูล term year ปัจจุบัน
    useEffect(() => {
        async function fetchTermYear() {
            try {
                const res = await fetch("/api/term-year");
                if (res.ok) {
                    const data = await res.json();
                    setTermYear(data.termYear);
                }
            } catch (error) {
                console.error("Failed to fetch term year:", error);
            }
        }
        fetchTermYear();
    }, []);

    // โหลดข้อมูลวิชาเมื่อมีการเปลี่ยน term year หรือมีการรีเฟรช
    useEffect(() => {
        if (termYear !== "x/xxxx") {
            fetchSubjects();
        }
    }, [termYear, refreshKey]);

    // ฟังก์ชันสำหรับแปลง planType เป็นข้อความภาษาไทย
    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DEV-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    // ฟังก์ชันสำหรับรีโหลดข้อมูลหลังจากอัปเดต
    const handleTeacherUpdated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-auto">
            <div className="flex justify-between items-center mx-8">
                <h2>อาจารย์ภายนอกสาขา</h2>
            </div>
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-6.5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                            <TableHead>ชื่อจริง</TableHead>
                            <TableHead>นามสกุล</TableHead>
                            <TableHead>รหัสวิชา</TableHead>
                            <TableHead>ชื่อวิชา</TableHead>
                            <TableHead className="text-center">ดำเนินการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.length > 0 ? (
                            subjects.map(subject => (
                                <TableRow key={subject.id}>
                                    <TableCell>{subject.teacher?.tName || "-"}</TableCell>
                                    <TableCell>{subject.teacher?.tLastName || "-"}</TableCell>
                                    <TableCell>{subject.subjectCode}</TableCell>
                                    <TableCell>
                                        {subject.subjectName} ({getPlanTypeText(subject.planType)}) ({subject.yearLevel})
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <AddTeacherSubjectOutCustom
                                            subjectId={subject.id}
                                            teacherName={`${subject.teacher?.tName || ""} ${subject.teacher?.tLastName || ""}`}
                                            onUpdate={handleTeacherUpdated}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    ไม่มีวิชานอกสาขาในภาคเรียนนี้
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}