"use client";

import { useEffect, useState } from "react";
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

export default function RoomRequestDeadlineSettingsPage() {
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>กำลังโหลดข้อมูล...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          ตั้งค่าวันที่กำหนดการเลือกห้องเรียน
        </h1>
        <p className="text-gray-600 mt-2">
          กำหนดวันที่สุดท้ายที่อาจารย์สามารถเลือกห้องเรียนสำหรับวิชาที่สอนได้
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>วันที่กำหนดการเลือกห้อง</CardTitle>
          <CardDescription>
            หลังจากเลยวันที่ที่กำหนดแล้ว
            อาจารย์จะไม่สามารถเลือกหรือเปลี่ยนแปลงห้องเรียนได้
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">เลือกวันที่</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? (
                    format(deadline, "PPP", { locale: th })
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
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {deadline && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    วันที่กำหนด: {format(deadline, "PPP", { locale: th })}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    อาจารย์จะสามารถเลือกห้องได้จนถึงวันที่{" "}
                    {format(deadline, "d MMMM yyyy", { locale: th })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
