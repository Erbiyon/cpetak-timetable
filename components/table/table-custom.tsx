import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function TableCustom() {
    return (
        <Table>
            <TableHeader className="sticky top-0 z-10">
                <TableRow>
                    <TableHead>รหัสวิชา</TableHead>
                    <TableHead>ชื่อวิชา</TableHead>
                    <TableHead>หน่วยกิต</TableHead>
                    <TableHead>ชั่วโมงบรรยาย</TableHead>
                    <TableHead>ชั่วโมงปฎิบัติ</TableHead>
                    <TableHead>ปุ่มดำเนินการ</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell></TableCell>
                </TableRow>
                {/* <TableRow className="sticky bottom-0 z-10 bg-card pointer-events-none select-none">
                    <TableCell colSpan={6}><p className="invisible">""</p></TableCell>
                </TableRow> */}
            </TableBody>
        </Table>
    )
}
