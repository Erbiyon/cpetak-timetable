"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface CurriculumItem {
  id: number;
  id_sub: string;
  subject_name: string;
  credit: number;
  lacture_credit: number;
  lab_credit: number;
  out_credit: number;
  curriculum_type: string;
}

interface EditCurriculumCustomProps {
  curriculum: CurriculumItem;
  onSuccess?: () => void;
}

export default function EditCurriculumCustom({
  curriculum,
  onSuccess,
}: EditCurriculumCustomProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_sub: curriculum.id_sub,
    subject_name: curriculum.subject_name,
    credit: curriculum.credit.toString(),
    lacture_credit: curriculum.lacture_credit.toString(),
    lab_credit: curriculum.lab_credit.toString(),
    out_credit: curriculum.out_credit.toString(),
    curriculum_type: curriculum.curriculum_type,
  });

  useEffect(() => {
    setFormData({
      id_sub: curriculum.id_sub,
      subject_name: curriculum.subject_name,
      credit: curriculum.credit.toString(),
      lacture_credit: curriculum.lacture_credit.toString(),
      lab_credit: curriculum.lab_credit.toString(),
      out_credit: curriculum.out_credit.toString(),
      curriculum_type: curriculum.curriculum_type,
    });
  }, [curriculum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/curriculum/${curriculum.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_sub: formData.id_sub,
          subject_name: formData.subject_name,
          credit: parseInt(formData.credit),
          lacture_credit: parseInt(formData.lacture_credit),
          lab_credit: parseInt(formData.lab_credit),
          out_credit: parseInt(formData.out_credit),
          curriculum_type: formData.curriculum_type,
        }),
      });

      if (response.ok) {
        toast.success("แก้ไขข้อมูลวิชาเรียบร้อยแล้ว");
        setOpen(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "ไม่สามารถแก้ไขข้อมูลได้");
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          แก้ไข
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>แก้ไขวิชาในหลักสูตร</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลวิชา {curriculum.id_sub}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id_sub">รหัสวิชา</Label>
              <Input
                id="id_sub"
                value={formData.id_sub}
                onChange={(e) =>
                  setFormData({ ...formData, id_sub: e.target.value })
                }
                placeholder="เช่น 20000-1001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject_name">ชื่อวิชา</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) =>
                  setFormData({ ...formData, subject_name: e.target.value })
                }
                placeholder="ชื่อวิชา"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="credit">หน่วยกิต</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0"
                  value={formData.credit}
                  onChange={(e) =>
                    setFormData({ ...formData, credit: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lacture_credit">ชั่วโมงบรรยาย</Label>
                <Input
                  id="lacture_credit"
                  type="number"
                  min="0"
                  value={formData.lacture_credit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lacture_credit: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lab_credit">ชั่วโมงปฏิบัติ</Label>
                <Input
                  id="lab_credit"
                  type="number"
                  min="0"
                  value={formData.lab_credit}
                  onChange={(e) =>
                    setFormData({ ...formData, lab_credit: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="out_credit">ชั่วโมงนอกเวลา</Label>
                <Input
                  id="out_credit"
                  type="number"
                  min="0"
                  value={formData.out_credit}
                  onChange={(e) =>
                    setFormData({ ...formData, out_credit: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
