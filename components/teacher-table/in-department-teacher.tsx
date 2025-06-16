import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AddTeacherCustom } from "../add-teacher/add-teacher-custom"

export default function IndepartmentTeacher() {
    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-auto">
            <div className="flex justify-between items-center mx-8">
                <h2>อาจารย์ภายในสาขา</h2>
                <AddTeacherCustom />
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
                        <TableRow>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
