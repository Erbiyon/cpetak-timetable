import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TimeTableCustom() {
    return (
        <Table>
            <TableHeader className="sticky top-0 z-10">
                <TableRow>
                    <TableHead></TableHead>
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