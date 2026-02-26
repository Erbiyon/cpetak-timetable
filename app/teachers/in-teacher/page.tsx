"use client";

import InTeacher from "@/components/teacher-table/in-teacher";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const formatThaiDate = (date: Date) => {
  const buddhistYear = date.getFullYear() + 543;
  const formatted = format(date, "d MMMM", { locale: th });
  return `${formatted} ${buddhistYear}`;
};

export default function InTeacherPage() {
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchDeadline();
  }, []);

  const fetchDeadline = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/room-request-deadline");
      if (response.ok) {
        const data = await response.json();
        if (data && data.deadline) {
          setDeadline(new Date(data.deadline));
        }
      }
    } catch (error) {
      console.error("Error fetching deadline:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!deadline) {
      toast.error("กรุณาเลือกวันที่");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/room-request-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: deadline.toISOString() }),
      });

      if (response.ok) {
        toast.success("บันทึกวันที่กำหนดสำเร็จ");
      } else {
        throw new Error("Failed to save deadline");
      }
    } catch (error) {
      console.error("Error saving deadline:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mx-5 mt-5 mb-3">
        <Card>
          <CardHeader>
            <CardTitle>ตั้งค่าวันที่กำหนดการเลือกห้องเรียน</CardTitle>
            <CardDescription>
              กำหนดวันที่สุดท้ายที่อาจารย์สามารถเลือกห้องเรียนสำหรับวิชาที่สอนได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? (
                          formatThaiDate(deadline)
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={(date) => {
                          setDeadline(date);
                          setOpen(false);
                        }}
                        locale={th}
                        formatters={{
                          formatCaption: (date) => {
                            const buddhistYear = date.getFullYear() + 543;
                            const monthName = format(date, "MMMM", {
                              locale: th,
                            });
                            return `${monthName} ${buddhistYear}`;
                          },
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDeadline(undefined)}
                  disabled={!deadline || saving}
                >
                  ล้างวันที่
                </Button>
                <Button onClick={handleSave} disabled={!deadline || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึก
                    </>
                  )}
                </Button>
              </div>
            )}
            {deadline && !loading && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  อาจารย์จะสามารถเลือกห้องได้จนถึงวันที่{" "}
                  {formatThaiDate(deadline)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InTeacher />
    </div>
  );
}
