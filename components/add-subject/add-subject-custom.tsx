import { useState, useRef } from "react"
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
    description?: string,
    termYear?: string,
    yearLevel?: string,
    planType?: string
}

export function AddSubjectCustom({
    title,
    planType,
    termYear,
    yearLevel
}: AddSubjectCustomProps
) {
    const initialForm = {
        subjectCode: "",
        subjectName: "",
        credit: "",
        lectureHour: "",
        labHour: "",
        planType: { planType },
        termYear: { termYear },
        yearLevel: { yearLevel }
    }
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
    const closeRef = useRef<HTMLButtonElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" })
    }

    const validate = () => {
        const errors: { [key: string]: string } = {}
        if (!form.subjectCode) errors.subjectCode = "กรอกรหัสวิชา"
        if (!form.subjectName) errors.subjectName = "กรอกชื่อวิชา"
        if (!form.credit) errors.credit = "กรอกหน่วยกิต"
        if (!form.lectureHour) errors.lectureHour = "กรอกชั่วโมงบรรยาย"
        if (!form.labHour) errors.labHour = "กรอกชั่วโมงปฏิบัติ"
        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFieldErrors({})
        const errors = validate()
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) {
            return
        }
        setLoading(true)
        try {
            const res = await fetch("/api/subject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "เกิดข้อผิดพลาด")
            }
            setForm(initialForm)
            setFieldErrors({})

            closeRef.current?.click()
        } catch (err: any) {
            setFieldErrors({ api: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setForm(initialForm)
        setFieldErrors({})
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">เพิ่มวิชา</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription className="pb-2">
                            กรุณากรอกรายละเอียดของวิชาที่ต้องการเพิ่ม
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
                                    value={form.credit}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
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
                                    value={form.lectureHour}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
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
                                    value={form.labHour}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                                {fieldErrors.labHour && <span className="text-red-500 text-xs">{fieldErrors.labHour}</span>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleCancel}
                                ref={closeRef}
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>{loading ? "กำลังเพิ่ม..." : "เพิ่ม"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}