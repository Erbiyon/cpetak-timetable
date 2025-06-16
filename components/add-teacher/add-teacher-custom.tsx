import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddTeacherCustom() {
    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <Button variant="outline">เพิ่มอาจารย์</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>เพิ่มอาจารย์</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลให้ครบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-full">
                                <Label htmlFor="teacher-name">ชื่อ</Label>
                                <Input id="teacher-name" name="teacher-name" />
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <Label htmlFor="teacher-surname">นามสกุล</Label>
                                <Input id="teacher-surname" name="teacher-surname" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">ยกเลิก</Button>
                        </DialogClose>
                        <Button type="submit">เพิ่ม</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
