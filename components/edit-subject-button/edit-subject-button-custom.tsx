import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Pencil } from 'lucide-react';
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function EditSubjectButtonCustom({ plan, onUpdated }: {
    plan: {
        id: number,
        subjectCode: string,
        subjectName: string,
        credit: number,
        lectureHour: number,
        labHour: number,
        termYear: string,
        yearLevel: string,
        planType: string
    },
    onUpdated?: () => void
}) {
    const [form, setForm] = useState({
        subjectCode: plan.subjectCode,
        subjectName: plan.subjectName,
        credit: plan.credit,
        lectureHour: plan.lectureHour,
        labHour: plan.labHour,
        termYear: plan.termYear,
        yearLevel: plan.yearLevel,
        planType: plan.planType
    });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    };

    const validate = () => {
        const errors: { [key: string]: string } = {};
        if (!form.subjectCode) errors.subjectCode = "กรอกรหัสวิชา";
        if (!form.subjectName) errors.subjectName = "กรอกชื่อวิชา";
        if (!form.credit) errors.credit = "กรอกหน่วยกิต";
        if (!form.lectureHour) errors.lectureHour = "กรอกชั่วโมงบรรยาย";
        if (!form.labHour) errors.labHour = "กรอกชั่วโมงปฏิบัติ";
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }
        setLoading(true);
        const res = await fetch(`/api/subject/${plan.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });
        setLoading(false);
        if (res.ok) {
            onUpdated?.();
            setOpen(false);
        } else {
            const data = await res.json();
            setFieldErrors({ api: data.error || "เกิดข้อผิดพลาด" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost">
                    <Pencil color="#ffff00" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>แก้ไขวิชา</DialogTitle>
                        <DialogDescription className="pb-2">
                            กรุณากรอกรายละเอียดของวิชาที่ต้องการแก้ไข
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/4">
                                <Label htmlFor="sub-code">รหัสวิชา</Label>
                                <Input id="sub-code" name="subjectCode" value={form.subjectCode} onChange={handleChange} />
                                {fieldErrors.subjectCode && <span className="text-red-500 text-xs">{fieldErrors.subjectCode}</span>}
                            </div>
                            <div className="flex flex-col gap-3 w-3/4">
                                <Label htmlFor="sub-name">ชื่อวิชา</Label>
                                <Input id="sub-name" name="subjectName" value={form.subjectName} onChange={handleChange} />
                                {fieldErrors.subjectName && <span className="text-red-500 text-xs">{fieldErrors.subjectName}</span>}
                            </div>
                        </div>
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="credit">หน่วยกิต</Label>
                                <Input
                                    id="credit"
                                    name="credit"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.credit}
                                    onChange={handleChange}
                                />
                                {fieldErrors.credit && <span className="text-red-500 text-xs">{fieldErrors.credit}</span>}
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="lecture-hours">ชั่วโมง บรรยาย</Label>
                                <Input
                                    id="lecture-hours"
                                    name="lectureHour"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.lectureHour}
                                    onChange={handleChange}
                                />
                                {fieldErrors.lectureHour && <span className="text-red-500 text-xs">{fieldErrors.lectureHour}</span>}
                            </div>
                            <div className="flex flex-col gap-3 w-1/3">
                                <Label htmlFor="practice-hours">ชั่วโมง ปฏิบัติ</Label>
                                <Input
                                    id="practice-hours"
                                    name="labHour"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.labHour}
                                    onChange={handleChange}
                                />
                                {fieldErrors.labHour && <span className="text-red-500 text-xs">{fieldErrors.labHour}</span>}
                            </div>
                        </div>
                        {fieldErrors.api && (
                            <div className="text-red-500 text-xs">{fieldErrors.api}</div>
                        )}
                    </div>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setOpen(false)}
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}