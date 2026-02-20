"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CurriculumItem {
  id: number;
  id_sub: string;
  subject_name: string;
}

interface DeleteCurriculumCustomProps {
  curriculum: CurriculumItem;
  onSuccess?: () => void;
}

export default function DeleteCurriculumCustom({
  curriculum,
  onSuccess,
}: DeleteCurriculumCustomProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/curriculum/${curriculum.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("ลบวิชาเรียบร้อยแล้ว");
        setOpen(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "ไม่สามารถลบวิชาได้");
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
          ลบ
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบวิชา</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบวิชา <strong>{curriculum.id_sub}</strong> -{" "}
            <strong>{curriculum.subject_name}</strong> ใช่หรือไม่?
            <br />
            <br />
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "กำลังลบ..." : "ลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
