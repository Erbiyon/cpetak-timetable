import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type DelectRoomButtonCustomProps = {
    roomId: string;
    roomName: string;
    onDeleted?: () => void;
};

export default function DelectRoomButtonCustom({ roomId, roomName, onDeleted }: DelectRoomButtonCustomProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/room/${roomId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success(`ลบห้อง ${roomName} สำเร็จ`);
                setOpen(false);
                onDeleted?.();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "เกิดข้อผิดพลาดในการลบห้อง");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={`ลบห้อง ${roomName}`}
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
                        ยืนยันการลบห้องเรียน
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center font-sans text-sm text-muted-foreground">
                        คุณต้องการลบห้อง <strong className="text-foreground">{roomName}</strong> ใช่หรือไม่?
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
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
                    >
                        {loading ? "กำลังลบ..." : "ยืนยันการลบ"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}