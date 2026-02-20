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
import { useState } from "react";
import { toast } from "sonner";

export default function DelectSubjectButtonCustom({
  planId,
  subjectName,
  onDeleted,
}: {
  planId: any;
  subjectName?: string;
  onDeleted?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subject/${planId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("ลบวิชาสำเร็จ");
        if (onDeleted) {
          onDeleted();
        }
      } else {
        toast.error("เกิดข้อผิดพลาดในการลบวิชา");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบวิชา");
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
            คุณต้องการลบวิชา {subjectName} ใช่หรือไม่?
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
