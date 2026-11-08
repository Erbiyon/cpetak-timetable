"use client"

import { useEffect, useRef, useState } from "react"
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
import { UserPlus } from "lucide-react"
import { toast } from "sonner"

export function AddTeacherCustom({
    onAdded,
    teacherType = "อาจารย์ภายในสาขา"
}: {
    onAdded?: () => void;
    teacherType?: "อาจารย์ภายในสาขา" | "อาจารย์ภายนอกสาขา";
}) {

    const initialForm = {
        tName: "",
        tLastName: "",
        teacherType: teacherType
    }
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
    const closeRef = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(false)
    const [existingNames, setExistingNames] = useState<{ tName: string; tLastName: string }[]>([])

    useEffect(() => {
        if (!open) return;
        fetch("/api/teacher")
            .then((r) => r.json())
            .then((teachers: { tName: string; tLastName: string }[]) => setExistingNames(teachers))
            .catch(() => setExistingNames([]));
    }, [open]);

    const isDuplicate =
        form.tName.trim() !== "" &&
        form.tLastName.trim() !== "" &&
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
        if (!form.tName.trim()) errors.tName = "กรุณากรอกชื่อจริง"
        if (!form.tLastName.trim()) errors.tLastName = "กรุณากรอกนามสกุล"
        return errors
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFieldErrors({})
        const errors = validate()
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        setLoading(true)
        try {
            const res = await fetch("/api/teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
            }
            toast.success(`เพิ่มอาจารย์ ${form.tName} ${form.tLastName} สำเร็จ`)
            setForm(initialForm)
            setFieldErrors({})
            setOpen(false)
            if (typeof onAdded === "function") onAdded()
        } catch (err: any) {
            setFieldErrors({ api: err.message })
            toast.error(err.message || "เกิดข้อผิดพลาดในการเพิ่มอาจารย์")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setForm(initialForm)
        setFieldErrors({})
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 font-sans font-medium shadow-xs">
                    <UserPlus className="h-4 w-4" />
                    เพิ่มอาจารย์
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle className="font-sans font-bold text-lg">เพิ่มข้อมูลอาจารย์</DialogTitle>
                        <DialogDescription className="font-sans text-xs text-muted-foreground">
                            กรอกข้อมูลชื่อและนามสกุลอาจารย์เพื่อบันทึกลงในระบบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
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
                                    placeholder="ชื่อจริง"
                                    className="font-sans"
                                />
                                {fieldErrors.tName && <span className="text-destructive text-xs font-sans">{fieldErrors.tName}</span>}
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
                                    placeholder="นามสกุล"
                                    className="font-sans"
                                />
                                {fieldErrors.tLastName && <span className="text-destructive text-xs font-sans">{fieldErrors.tLastName}</span>}
                            </div>
                        </div>
                        {fieldErrors.api && <span className="text-destructive text-xs font-sans">{fieldErrors.api}</span>}
                        {isDuplicate && (
                            <span className="text-destructive text-xs font-sans">อาจารย์ชื่อนี้มีอยู่ในระบบแล้ว</span>
                        )}

                        <div className="text-xs text-muted-foreground mt-1 border-t pt-2 font-sans flex items-center justify-between">
                            <span>ประเภทอาจารย์:</span>
                            <span className="font-medium text-foreground">{teacherType}</span>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleCancel}
                                ref={closeRef}
                                className="font-sans"
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading || isDuplicate} className="font-sans">
                            {loading ? "กำลังเพิ่ม..." : "เพิ่มข้อมูล"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
