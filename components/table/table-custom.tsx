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
        <Table className="my-4">
            <TableHeader>
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
            </TableBody>
        </Table>
    )
}
