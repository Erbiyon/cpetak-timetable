import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { toast } from "sonner"

export default function DeleteTeacherButtonCustom({
    teacherId,
    teacherName,
    onDeleted,
}: {
    teacherId: number
    teacherName?: string
    onDeleted?: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/teacher/${teacherId}`, {
                method: "DELETE",
            })
            if (res.ok) {
                toast.success(`ลบอาจารย์ ${teacherName || ""} สำเร็จ`)
                setOpen(false)
                if (onDeleted) {
                    onDeleted()
                }
            } else {
                const data = await res.json().catch(() => ({}))
                toast.error(data.error || "เกิดข้อผิดพลาดในการลบอาจารย์")
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={`ลบ ${teacherName || "อาจารย์"}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <AlertDialogTitle className="text-center font-sans text-lg font-bold">
                        ยืนยันการลบข้อมูลอาจารย์
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center font-sans text-sm text-muted-foreground">
                        คุณต้องการลบข้อมูล <strong className="text-foreground">{teacherName || "อาจารย์ท่านนี้"}</strong> ใช่หรือไม่?
                        <br />
                        การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 sm:justify-center gap-2">
                    <AlertDialogCancel disabled={loading} className="font-sans">
                        ยกเลิก
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
                    >
                        {loading ? "กำลังลบ..." : "ยืนยันการลบ"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
