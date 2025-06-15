import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";

export default function IndepartmentRoom() {
    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-3">อาคารสาขาวิศวกรรมคอมพิวเตอร์</h1>
                <div className="flex justify-between items-center gap-4 mb-2">
                    <Input type="text" placeholder="กรุณากรองเลขห้อง" className="w-5/6" />
                    <Button type="submit" variant="outline" className="w-1/6">
                        เพิ่มห้อง
                    </Button>
                </div>
                <Table>
                    <TableHeader>
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
    )
}