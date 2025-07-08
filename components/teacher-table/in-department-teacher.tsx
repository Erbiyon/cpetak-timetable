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
import { Edit } from "lucide-react"
import EditTeacherButtonCustom from "../edit-delect-teacher-buttom/edit-teacher-buttom-custom"
import DeleteTeacherButtonCustom from "../edit-delect-teacher-buttom/delect-teacher-buttom-custom"

type Teacher = {
    id: number
    tId: string
    tName: string
    tLastName: string
    teacherType: string // เพิ่ม field teacherType
}

export default function IndepartmentTeacher() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTeachers = async () => {
        setLoading(true)
        // ปรับปรุง API endpoint ให้ดึงเฉพาะอาจารย์ภายในสาขา
        const res = await fetch("/api/teacher?inDepartment=true")
        const data = await res.json()
        setTeachers(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchTeachers()
    }, [])

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-auto">
            <div className="flex justify-between items-center mx-8">
                <h2>อาจารย์ภายในสาขา</h2>
                <AddTeacherCustom onAdded={fetchTeachers} />
            </div>
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                            <TableHead>รหัสประจำตัวอาจารย์</TableHead>
                            <TableHead>ชื่อจริง</TableHead>
                            <TableHead>นามสกุล</TableHead>
                            <TableHead>ปุ่มดำเนินการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">กำลังโหลด...</TableCell>
                            </TableRow>
                        ) : teachers.length > 0 ? (
                            teachers.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.tId}</TableCell>
                                    <TableCell>{t.tName}</TableCell>
                                    <TableCell>{t.tLastName}</TableCell>
                                    <TableCell>
                                        <EditTeacherButtonCustom
                                            teacher={t}
                                            onUpdated={fetchTeachers}
                                        />
                                        <DeleteTeacherButtonCustom
                                            teacherId={t.id}
                                            teacherName={`${t.tName} ${t.tLastName}`}
                                            onDeleted={fetchTeachers}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell className="text-center" colSpan={4}>ไม่มีข้อมูลอาจารย์ภายในสาขา</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
