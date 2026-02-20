"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddCurriculumCustomProps {
  onSuccess?: () => void;
  defaultCurriculumType?: string;
}

export default function AddCurriculumCustom({
  onSuccess,
  defaultCurriculumType = "DVE",
}: AddCurriculumCustomProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_sub: "",
    subject_name: "",
    credit: "",
    lacture_credit: "",
    lab_credit: "",
    out_credit: "",
    curriculum_type: defaultCurriculumType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/curriculum", {
        method: "POST",
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
        toast.success("เพิ่มวิชาในหลักสูตรเรียบร้อยแล้ว");
        setOpen(false);
        setFormData({
          id_sub: "",
          subject_name: "",
          credit: "",
          lacture_credit: "",
          lab_credit: "",
          out_credit: "",
          curriculum_type: defaultCurriculumType,
        });
        onSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "ไม่สามารถเพิ่มวิชาได้");
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มวิชา
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>เพิ่มวิชาในหลักสูตร</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลวิชาที่ต้องการเพิ่มในหลักสูตร
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
