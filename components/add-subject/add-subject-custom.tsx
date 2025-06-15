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

export function AddSubjectCustom() {
    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <Button variant="outline">เพิ่มวิชา</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>เพิ่มวิชา</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลให้ครบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/4">
                                <Label htmlFor="sub-code-1">รหัสวิชา</Label>
                                <Input id="sub-code-1" name="sub-code" />
                            </div>
                            <div className="flex flex-col gap-3 w-3/4">
                                <Label htmlFor="sub-name-1">ชื่อวิชา</Label>
                                <Input id="sub-name-1" name="sub-name" />
                            </div>
                        </div>
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="credit-1">หน่วยกิต</Label>
                                <Input id="credit-1" name="credit" />
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="-ecture-hours-1">ชั่วโมง บรรยาย</Label>
                                <Input id="lecture-hours-1" name="lecture-hours" />
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="practice-hours-1">ชั่วโมง ปฏิบัติ</Label>
                                <Input id="practice-hours-1" name="practice-hours" />
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
