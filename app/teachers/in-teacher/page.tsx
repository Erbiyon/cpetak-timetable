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
import { CalendarIcon, Loader2, Save, Trash2, CalendarClock, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const formatThaiDate = (date: Date) => {
  const buddhistYear = date.getFullYear() + 543;
  const formatted = format(date, "d MMMM", { locale: th });
  return `${formatted} ${buddhistYear}`;
};

export default function InTeacherPage() {
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const handleClear = async () => {
    try {
      setClearing(true);
      const response = await fetch("/api/room-request-deadline", {
        method: "DELETE",
      });
      if (response.ok) {
        setDeadline(undefined);
        toast.success("ลบวันที่กำหนดสำเร็จ");
      } else {
        throw new Error("Failed to delete deadline");
      }
    } catch (error) {
      console.error("Error clearing deadline:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setClearing(false);
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
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Academic Header */}
      <div className="rounded-xl border border-violet-200/80 dark:border-violet-900/60 bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-foreground font-medium text-xs px-2.5 py-0.5 font-sans"
              >
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              <Badge
                variant="secondary"
                className="font-normal text-xs bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 font-sans"
              >
                การมอบหมายภาระงานสอน
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <UserCheck className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              เพิ่มอาจารย์วิชาภายในสาขา
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              กำหนดอาจารย์ผู้รับผิดชอบรายวิชาในสาขา พร้อมทั้งกำหนดเงื่อนไขและกำหนดเวลาในการขอใช้ห้องเรียน
            </p>
          </div>
        </div>
      </div>

      {/* Deadline Setting Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-base font-semibold font-sans">
              ตั้งค่ากำหนดการเลือกห้องเรียนสำหรับอาจารย์
            </CardTitle>
          </div>
          <CardDescription className="text-xs font-sans">
            กำหนดวันสุดท้ายที่อาจารย์สามารถส่งคำขอเลือกห้องเรียนสำหรับวิชาที่ได้รับมอบหมาย
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-xs text-muted-foreground font-sans">
                กำลังโหลดข้อมูลกำหนดเวลา...
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 max-w-sm">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-xs font-sans h-9 border-border",
                        !deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {deadline ? (
                        formatThaiDate(deadline)
                      ) : (
                        <span>เลือกวันสิ้นสุดการขอห้อง</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-border bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={(date) => {
                        setDeadline(date);
                        setOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !deadline}
                  size="sm"
                  className="h-9 text-xs font-sans bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  บันทึกกำหนดเวลา
                </Button>
                {deadline && (
                  <Button
                    onClick={handleClear}
                    disabled={clearing}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-sans text-destructive hover:bg-destructive/10 border-border"
                  >
                    {clearing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    ยกเลิกกำหนดเวลา
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Subjects Table */}
      <InTeacher />
    </div>
  );
}
