"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AddTeacherCustom } from "../add-teacher/add-teacher-custom"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import EditTeacherButtonCustom from "../edit-delect-teacher-buttom/edit-teacher-buttom-custom"
import DeleteTeacherButtonCustom from "../edit-delect-teacher-buttom/delect-teacher-buttom-custom"

type Teacher = {
    id: number
    tId: string
    tName: string
    tLastName: string
    teacherType: string
}

export default function IndepartmentTeacher() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTeachers = async () => {
        try {
            setLoading(true)
            // ปรับปรุง API endpoint ให้ดึงเฉพาะอาจารย์ภายในสาขา
            const res = await fetch("/api/teacher?inDepartment=true")
            if (res.ok) {
                const data = await res.json()
                setTeachers(data)
            }
        } catch (error) {
            console.error("Error fetching teachers:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTeachers()
    }, [])

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
            <div className="flex justify-between items-center mx-8">
                <h2 className="text-xl font-bold">อาจารย์ภายในสาขา</h2>
                <AddTeacherCustom onAdded={fetchTeachers} />
            </div>

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">กำลังโหลดข้อมูลอาจารย์...</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                            <TableRow>
                                <TableHead>รหัสประจำตัวอาจารย์</TableHead>
                                <TableHead>ชื่อจริง</TableHead>
                                <TableHead>นามสกุล</TableHead>
                                <TableHead className="text-center">ดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teachers.length > 0 ? (
                                teachers.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.tId}</TableCell>
                                        <TableCell>{t.tName}</TableCell>
                                        <TableCell>{t.tLastName}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
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
                                    <TableCell className="text-center text-muted-foreground py-8" colSpan={4}>
                                        ไม่มีข้อมูลอาจารย์ภายในสาขา
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
