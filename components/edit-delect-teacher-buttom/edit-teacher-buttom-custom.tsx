import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
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

type Teacher = {
    id: number
    tName: string
    tLastName: string
}

export default function EditTeacherButtonCustom({
    teacher,
    onUpdated,
}: {
    teacher: Teacher
    onUpdated?: () => void
}) {
    const [form, setForm] = useState({
        tName: teacher.tName,
        tLastName: teacher.tLastName,
    })
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" })
    }

    const validate = () => {
        const errors: { [key: string]: string } = {}
        if (!form.tName.trim()) errors.tName = "กรุณากรอกชื่อ"
        if (!form.tLastName.trim()) errors.tLastName = "กรุณากรอกนามสกุล"
        return errors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFieldErrors({})
        const errors = validate()
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        setLoading(true)
        const res = await fetch(`/api/teacher/${teacher.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        })
        setLoading(false)
        if (res.ok) {
            onUpdated?.()
            setOpen(false)
        } else {
            const data = await res.json()
            setFieldErrors({ api: data.error || "เกิดข้อผิดพลาด" })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost">
                    <Pencil color="#facc15" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>แก้ไขอาจารย์</DialogTitle>
                        <DialogDescription className="pb-2">
                            กรุณากรอกข้อมูลอาจารย์ที่ต้องการแก้ไข
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="flex gap-x-4">
                            <div className="flex flex-col gap-3 w-full">
                                <Label htmlFor="teacher-name">ชื่อ</Label>
                                <Input
                                    id="teacher-name"
                                    name="tName"
                                    value={form.tName}
                                    onChange={handleChange}
                                />
                                {fieldErrors.tName && (
                                    <span className="text-red-500 text-xs">{fieldErrors.tName}</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <Label htmlFor="teacher-surname">นามสกุล</Label>
                                <Input
                                    id="teacher-surname"
                                    name="tLastName"
                                    value={form.tLastName}
                                    onChange={handleChange}
                                />
                                {fieldErrors.tLastName && (
                                    <span className="text-red-500 text-xs">{fieldErrors.tLastName}</span>
                                )}
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
