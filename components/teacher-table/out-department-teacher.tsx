import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function OutdepartmentTeacher() {
    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-auto">
            <div className="flex justify-between items-center mx-8">
                <h2>อาจารย์ภายนอกสาขา</h2>
            </div>
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-6.5 shadow-sm mx-8 max-h-[64vh] overflow-y-auto">
                <Table className="sticky top-0 z-10 bg-card">
                    <TableHeader>
                        <TableRow>
                            <TableHead>ชื่อจริง</TableHead>
                            <TableHead>นามสกุล</TableHead>
                            <TableHead>ชื่อวิชา</TableHead>
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