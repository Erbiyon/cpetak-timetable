import { useEffect, useState } from "react"
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
import { toast } from "sonner"

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
    const [existingNames, setExistingNames] = useState<{ tName: string; tLastName: string }[]>([])

    useEffect(() => {
        if (!open) return;
        setForm({
            tName: teacher.tName,
            tLastName: teacher.tLastName,
        })
        fetch("/api/teacher")
            .then((r) => r.json())
            .then((teachers: { tName: string; tLastName: string }[]) => setExistingNames(teachers))
            .catch(() => setExistingNames([]));
    }, [open, teacher]);

    const isDuplicate =
        form.tName.trim() !== "" &&
        form.tLastName.trim() !== "" &&
        (form.tName.trim().toLowerCase() !== teacher.tName.trim().toLowerCase() ||
            form.tLastName.trim().toLowerCase() !== teacher.tLastName.trim().toLowerCase()) &&
        existingNames.some(
            (t) =>
                t.tName.trim().toLowerCase() === form.tName.trim().toLowerCase() &&
                t.tLastName.trim().toLowerCase() === form.tLastName.trim().toLowerCase()
        );

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
        try {
            const res = await fetch(`/api/teacher/${teacher.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                toast.success("อัปเดตข้อมูลอาจารย์เรียบร้อยแล้ว")
                onUpdated?.()
                setOpen(false)
            } else {
                const data = await res.json()
                setFieldErrors({ api: data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
                toast.error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    title={`แก้ไข ${teacher.tName} ${teacher.tLastName}`}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-sans font-bold">แก้ไขข้อมูลอาจารย์</DialogTitle>
                        <DialogDescription className="font-sans text-xs text-muted-foreground">
                            ปรับปรุงข้อมูลชื่อและนามสกุลอาจารย์ในระบบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex gap-x-3">
                            <div className="flex flex-col gap-1.5 w-full">
                                <Label htmlFor="teacher-name" className="text-xs font-medium font-sans">
                                    ชื่อ
                                </Label>
                                <Input
                                    id="teacher-name"
                                    name="tName"
                                    value={form.tName}
                                    onChange={handleChange}
                                    className="font-sans"
                                    placeholder="ชื่อจริง"
                                />
                                {fieldErrors.tName && (
                                    <span className="text-destructive text-xs font-sans">{fieldErrors.tName}</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5 w-full">
                                <Label htmlFor="teacher-surname" className="text-xs font-medium font-sans">
                                    นามสกุล
                                </Label>
                                <Input
                                    id="teacher-surname"
                                    name="tLastName"
                                    value={form.tLastName}
                                    onChange={handleChange}
                                    className="font-sans"
                                    placeholder="นามสกุล"
                                />
                                {fieldErrors.tLastName && (
                                    <span className="text-destructive text-xs font-sans">{fieldErrors.tLastName}</span>
                                )}
                            </div>
                        </div>
                        {fieldErrors.api && (
                            <div className="text-destructive text-xs font-sans">{fieldErrors.api}</div>
                        )}
                        {isDuplicate && (
                            <div className="text-destructive text-xs font-sans">อาจารย์ชื่อนี้มีอยู่ในระบบแล้ว</div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setOpen(false)}
                                className="font-sans"
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={loading || isDuplicate}
                            className="font-sans"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
