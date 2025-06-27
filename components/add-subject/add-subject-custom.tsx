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

type AddSubjectCustomProps = {
    title?: string,
    description?: string
}

export function AddSubjectCustom({
    title,
    description
}: AddSubjectCustomProps
) {
    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <Button variant="outline">เพิ่มวิชา</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {description || "กรุณากรอกรายละเอียดของวิชาที่ต้องการเพิ่ม"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/4">
                                <Label htmlFor="sub-code">รหัสวิชา</Label>
                                <Input id="sub-code" name="sub_code" />
                            </div>
                            <div className="flex flex-col gap-3 w-3/4">
                                <Label htmlFor="sub-name">ชื่อวิชา</Label>
                                <Input id="sub-name" name="sub_name" />
                            </div>
                        </div>
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="credit">หน่วยกิต</Label>
                                <Input id="credit" name="credit" />
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="ecture-hours">ชั่วโมง บรรยาย</Label>
                                <Input id="lecture-hours" name="lecture_hours" />
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="practice-hours">ชั่วโมง ปฏิบัติ</Label>
                                <Input id="practice-hours" name="practice_hours" />
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
