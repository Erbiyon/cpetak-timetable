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

type DelectRoomButtonCustomProps = {
    roomId: string;
    roomName: string;
    onDeleted?: () => void;
};

export default function DelectRoomButtonCustom({ roomId, roomName, onDeleted }: DelectRoomButtonCustomProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/room/${roomId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                onDeleted?.();
            } else {
                alert("เกิดข้อผิดพลาดในการลบห้อง");
            }
        } catch (e) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost">
                    <Trash2 color="#ff0000" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>แน่ใจหรือไม่?</AlertDialogTitle>
                    <AlertDialogDescription>
                        คุณต้องการลบห้อง {roomName} ใช่หรือไม่?
                        <Trash2 className="mx-auto" color="#ff0000" size={180} />
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading}>
                        {loading ? "กำลังลบ..." : "ดำเนินการต่อ"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}