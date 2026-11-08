"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronsUpDown, Check } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CurriculumItem = {
  id: number;
  id_sub: string;
  subject_name: string;
  credit: number;
  lacture_credit: number;
  lab_credit: number;
  out_credit: number;
  curriculum_type: string;
};

export default function EditSubjectButtonCustom({
  plan,
  curriculumType,
  onUpdated,
}: {
  plan: {
    id: number;
    subjectCode: string;
    subjectName: string;
    credit: number;
    lectureHour: number;
    labHour: number;
    termYear: string;
    yearLevel: string;
    planType: string;
    dep?: string;
  };
  curriculumType?: "DVE" | "BACHELOR";
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumItem | null>(
    null
  );
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOutOfDepartment, setIsOutOfDepartment] = useState(
    plan.dep === "นอกสาขา"
  );

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        const response = await fetch("/api/curriculum");

        if (!response.ok) {
          console.error("Failed to fetch curriculum:", response.status);
          setCurriculum([]);
          return;
        }

        const data = await response.json();

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error("Invalid curriculum data format:", data);
          setCurriculum([]);
          return;
        }

        // Filter by curriculumType if provided
        const filteredData = curriculumType
          ? data.filter(
              (item: CurriculumItem) => item.curriculum_type === curriculumType
            )
          : data;
        setCurriculum(filteredData);

        // หาวิชาที่ตรงกับ plan ปัจจุบัน
        const currentSubject = filteredData.find(
          (item: CurriculumItem) => item.id_sub === plan.subjectCode
        );
        if (currentSubject) {
          setSelectedSubject(currentSubject);
        }
      } catch (error) {
        console.error("Error fetching curriculum:", error);
        setCurriculum([]);
      }
    };

    if (open) {
      fetchCurriculum();
      setIsOutOfDepartment(plan.dep === "นอกสาขา");
    }
  }, [open, plan, curriculumType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      toast.error("กรุณาเลือกวิชาที่ต้องการแก้ไข");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/subject/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectCode: selectedSubject.id_sub,
          subjectName: selectedSubject.subject_name,
          credit: selectedSubject.credit,
          lectureHour: selectedSubject.lacture_credit,
          labHour: selectedSubject.lab_credit,
          termYear: plan.termYear,
          yearLevel: plan.yearLevel,
          planType: plan.planType,
          dep: isOutOfDepartment ? "นอกสาขา" : "วิชาในสาขา",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("แก้ไขวิชาสำเร็จ");
      setOpen(false);
      if (typeof onUpdated === "function") onUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    title={`แก้ไขรายวิชา ${plan.subjectName}`}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-sans font-bold text-lg">แก้ไขรายวิชาในแผนการเรียน</DialogTitle>
                        <DialogDescription className="font-sans text-xs text-muted-foreground pb-2">
                            เลือกวิชาจากหลักสูตรกลางเพื่อปรับเปลี่ยนวิชาในแผน
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-3">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-medium font-sans">ค้นหาและเลือกวิชาจากหลักสูตร</Label>
                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen}
                                        className="justify-between font-sans text-xs h-9"
                                    >
                                        {selectedSubject
                                            ? `${selectedSubject.id_sub} - ${selectedSubject.subject_name}`
                                            : "เลือกวิชา..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[460px] p-0">
                                    <Command>
                                        <CommandInput placeholder="ค้นหารหัสวิชาหรือชื่อวิชา..." className="font-sans text-xs" />
                                        <CommandList>
                                            <CommandEmpty className="py-6 text-center text-xs font-sans text-muted-foreground">
                                                ไม่พบวิชาที่ค้นหา
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {curriculum.map((subject) => (
                                                    <CommandItem
                                                        key={subject.id}
                                                        value={`${subject.id_sub} ${subject.subject_name}`}
                                                        onSelect={() => {
                                                            setSelectedSubject(subject);
                                                            setComboboxOpen(false);
                                                        }}
                                                        className="font-sans text-xs cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedSubject?.id === subject.id
                                                                    ? "opacity-100 text-primary"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {subject.id_sub}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {subject.subject_name}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {selectedSubject && (
                            <div className="border border-border/70 rounded-lg p-3.5 space-y-2.5 bg-muted/30">
                                <h4 className="font-semibold text-xs font-sans text-foreground">รายละเอียดวิชาที่เลือก</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                                    <div>
                                        <span className="text-muted-foreground">รหัสวิชา:</span>{" "}
                                        <span className="font-mono font-medium text-foreground">
                                            {selectedSubject.id_sub}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">หน่วยกิต:</span>{" "}
                                        <span className="font-mono font-medium text-foreground">
                                            {selectedSubject.credit}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">ชื่อวิชา:</span>{" "}
                                        <span className="font-medium text-foreground">
                                            {selectedSubject.subject_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            ชั่วโมงบรรยาย:
                                        </span>{" "}
                                        <span className="font-mono font-medium text-foreground">
                                            {selectedSubject.lacture_credit}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            ชั่วโมงปฏิบัติ:
                                        </span>{" "}
                                        <span className="font-mono font-medium text-foreground">
                                            {selectedSubject.lab_credit}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                                    <Checkbox
                                        id="dep"
                                        checked={isOutOfDepartment}
                                        onCheckedChange={(checked) =>
                                            setIsOutOfDepartment(checked === true)
                                        }
                                    />
                                    <Label htmlFor="dep" className="cursor-pointer text-xs font-sans font-medium">
                                        วิชานอกสาขา (สอนโดยสาขาอื่น)
                                    </Label>
                                </div>
                            </div>
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
                            disabled={loading || !selectedSubject}
                            className="font-sans"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
