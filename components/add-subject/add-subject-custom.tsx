"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
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
import { Check, ChevronsUpDown } from "lucide-react";
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

type AddSubjectCustomProps = {
  planType: string;
  termYear: string;
  yearLevel: string;
  curriculumType?: "DVE" | "BACHELOR";
  onAdded?: () => void;
};

export function AddSubjectCustom({
  planType,
  termYear,
  yearLevel,
  curriculumType,
  onAdded,
}: AddSubjectCustomProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumItem | null>(
    null
  );
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOutOfDepartment, setIsOutOfDepartment] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

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

        if (!Array.isArray(data)) {
          console.error("Invalid curriculum data format:", data);
          setCurriculum([]);
          return;
        }

        const filteredData = curriculumType
          ? data.filter(
              (item: CurriculumItem) => item.curriculum_type === curriculumType
            )
          : data;
        setCurriculum(filteredData);
      } catch (error) {
        console.error("Error fetching curriculum:", error);
        setCurriculum([]);
      }
    };
    fetchCurriculum();
  }, [curriculumType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      toast.error("กรุณาเลือกวิชาที่ต้องการเพิ่ม");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectCode: selectedSubject.id_sub,
          subjectName: selectedSubject.subject_name,
          credit: selectedSubject.credit,
          lectureHour: selectedSubject.lacture_credit,
          labHour: selectedSubject.lab_credit,
          planType: planType,
          termYear: termYear,
          yearLevel: yearLevel,
          dep: isOutOfDepartment ? "นอกสาขา" : "วิชาในสาขา",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("เพิ่มวิชาสำเร็จ");
      setSelectedSubject(null);
      setIsOutOfDepartment(false);
      setOpen(false);
      if (typeof onAdded === "function") onAdded();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedSubject(null);
    setIsOutOfDepartment(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">เพิ่มวิชา</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{`${yearLevel} ${termYear}`}</DialogTitle>
            <DialogDescription className="pb-2">
              เลือกวิชาจากหลักสูตรที่ต้องการเพิ่มในแผนการเรียน
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
                onClick={handleCancel}
                ref={closeRef}
              >
                ยกเลิก
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !selectedSubject}>
              {loading ? "กำลังเพิ่ม..." : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
