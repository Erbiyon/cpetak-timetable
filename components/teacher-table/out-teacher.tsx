"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AddTeacherCustom } from "../add-teacher/add-teacher-custom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import EditTeacherButtonCustom from "../edit-delect-teacher-buttom/edit-teacher-buttom-custom";
import DeleteTeacherButtonCustom from "../edit-delect-teacher-buttom/delect-teacher-buttom-custom";

type Teacher = {
    id: number;
    tId: string;
    tName: string;
    tLastName: string;
    teacherType: string;
};

export default function OutTeacher() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            // ปรับปรุง API endpoint ให้ดึงเฉพาะอาจารย์ภายนอกสาขา
            const res = await fetch("/api/teacher?inDepartment=false");
            if (res.ok) {
                const data = await res.json();
                // เพิ่มการกรองข้อมูลใน client-side เพื่อให้แน่ใจว่าได้เฉพาะอาจารย์ภายนอกสาขา
                const filteredTeachers = data.filter((teacher: Teacher) =>
                    teacher.teacherType === "อาจารย์ภายนอกสาขา"
                );
                setTeachers(filteredTeachers);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    return (
        <div className="bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm max-h-[60vh] lg:max-h-[64vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 lg:px-8">
                <h2 className="text-lg lg:text-xl font-bold">อาจารย์ภายนอกสาขา</h2>
                <AddTeacherCustom
                    onAdded={fetchTeachers}
                    teacherType="อาจารย์ภายนอกสาขา"
                />
            </div>

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-2 lg:my-5 shadow-sm mx-4 lg:mx-8 max-h-[50vh] lg:max-h-[56vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-sm lg:text-base">กำลังโหลดข้อมูลอาจารย์...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                    <TableHead className="text-xs lg:text-sm">รหัสประจำตัวอาจารย์</TableHead>
                                    <TableHead className="text-xs lg:text-sm">ชื่อจริง</TableHead>
                                    <TableHead className="text-xs lg:text-sm">นามสกุล</TableHead>
                                    <TableHead className="text-center text-xs lg:text-sm">ดำเนินการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.length > 0 ? (
                                    teachers.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium text-xs lg:text-sm">{t.tId}</TableCell>
                                            <TableCell className="text-xs lg:text-sm">{t.tName}</TableCell>
                                            <TableCell className="text-xs lg:text-sm">{t.tLastName}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-1 lg:gap-2">
                                                    <EditTeacherButtonCustom
                                                        teacher={t}
                                                        onUpdated={fetchTeachers}
                                                    />
                                                    <DeleteTeacherButtonCustom
                                                        teacherId={t.id}
                                                        teacherName={`${t.tName} ${t.tLastName}`}
                                                        onDeleted={fetchTeachers}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell className="text-center text-muted-foreground py-8 text-xs lg:text-sm" colSpan={4}>
                                            ไม่มีข้อมูลอาจารย์ภายนอกสาขา
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
