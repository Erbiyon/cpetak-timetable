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
        <Button variant="ghost">
          <Pencil color="#ffff00" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>แก้ไขวิชา</DialogTitle>
            <DialogDescription className="pb-2">
              เลือกวิชาจากหลักสูตรที่ต้องการแก้ไข
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
              <Label>ค้นหาและเลือกวิชา</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="justify-between"
                  >
                    {selectedSubject
                      ? `${selectedSubject.id_sub} - ${selectedSubject.subject_name}`
                      : "เลือกวิชา..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[460px] p-0">
                  <Command>
                    <CommandInput placeholder="ค้นหารหัสวิชาหรือชื่อวิชา..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบวิชาที่ค้นหา</CommandEmpty>
                      <CommandGroup>
                        {curriculum.map((subject) => (
                          <CommandItem
                            key={subject.id}
                            value={`${subject.id_sub} ${subject.subject_name}`}
                            onSelect={() => {
                              setSelectedSubject(subject);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSubject?.id === subject.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {subject.id_sub}
                              </span>
                              <span className="text-sm text-muted-foreground">
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
              <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                <h4 className="font-semibold text-sm">รายละเอียดวิชา</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">รหัสวิชา:</span>{" "}
                    <span className="font-medium">
                      {selectedSubject.id_sub}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">หน่วยกิต:</span>{" "}
                    <span className="font-medium">
                      {selectedSubject.credit}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">ชื่อวิชา:</span>{" "}
                    <span className="font-medium">
                      {selectedSubject.subject_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      ชั่วโมงบรรยาย:
                    </span>{" "}
                    <span className="font-medium">
                      {selectedSubject.lacture_credit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      ชั่วโมงปฏิบัติ:
                    </span>{" "}
                    <span className="font-medium">
                      {selectedSubject.lab_credit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="dep"
                    checked={isOutOfDepartment}
                    onCheckedChange={(checked) =>
                      setIsOutOfDepartment(checked === true)
                    }
                  />
                  <Label htmlFor="dep" className="cursor-pointer">
                    วิชานอกสาขา
                  </Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                ยกเลิก
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !selectedSubject}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
