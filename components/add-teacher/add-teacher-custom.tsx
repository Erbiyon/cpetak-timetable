"use client"

import { useRef, useState } from "react"
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" })
    }

    const validate = () => {
        const errors: { [key: string]: string } = {}
        if (!form.tName.trim()) errors.tName = "กรอกชื่อ"
        if (!form.tLastName.trim()) errors.tLastName = "กรอกนามสกุล"
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
                throw new Error(data.error || "เกิดข้อผิดพลาด")
            }
            setForm(initialForm)
            setFieldErrors({})
            closeRef.current?.click()
            if (typeof onAdded === "function") onAdded()
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">เพิ่มอาจารย์</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>เพิ่มอาจารย์</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลให้ครบ
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
                                {fieldErrors.tName && <span className="text-red-500 text-xs">{fieldErrors.tName}</span>}
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <Label htmlFor="teacher-surname">นามสกุล</Label>
                                <Input
                                    id="teacher-surname"
                                    name="tLastName"
                                    value={form.tLastName}
                                    onChange={handleChange}
                                />
                                {fieldErrors.tLastName && <span className="text-red-500 text-xs">{fieldErrors.tLastName}</span>}
                            </div>
                        </div>
                        {fieldErrors.api && <span className="text-red-500 text-xs">{fieldErrors.api}</span>}

                        <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                            หมายเหตุ: ข้อมูลจะถูกบันทึกเป็น{teacherType}
                        </div>
                    </div>
                    <DialogFooter className="my-4">
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "กำลังเพิ่ม..." : "เพิ่ม"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
