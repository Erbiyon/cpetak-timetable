import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";

export default function OutdepartmentRoom() {
    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-4">อาคารสาขาวิศวกรรมคอมพิวเตอร์</h1>

                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-5 shadow-sm max-h-[71vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                            <TableRow>
                                <TableHead>เลขห้อง</TableHead>
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
        </div>
    )
}