"use client";

import CalendarCustom from "@/components/calendar/calendar-custom";
import DisplayCalendarCustom from "@/components/calendar/display-calendar-custom";
import { Label } from "@radix-ui/react-label";
import { Loader2, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React from "react";

export default function AcademicCalendar() {
  const [term1, setTerm1] = React.useState<{ start?: Date; end?: Date }>({});
  const [term2, setTerm2] = React.useState<{ start?: Date; end?: Date }>({});
  const [term3, setTerm3] = React.useState<{ start?: Date; end?: Date }>({});
  const [_savedTerm, setSavedTerm] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedCurrentTerm, setSelectedCurrentTerm] = React.useState<
    number | null
  >(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMessage, setDialogMessage] = React.useState("");
  const [dialogTitle, setDialogTitle] = React.useState("แจ้งเตือน");

  function showDialog(message: string, title = "แจ้งเตือน") {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  }

  const terms = [
    { name: "ภาคเรียนที่ 1", start: term1.start, end: term1.end },
    { name: "ภาคเรียนที่ 2", start: term2.start, end: term2.end },
    { name: "ภาคเรียนที่ 3", start: term3.start, end: term3.end },
  ];

  async function saveTerm(name: string, start?: Date, end?: Date) {
    if (start && end) {
      try {
        const res = await fetch("/api/term", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            start,
            end,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedTerm(data);
        }
      } catch (error) {
        console.error("ผิดพลาดในการบันทึกเทอม:", error);
      }
    }
  }

  async function setCurrentTerm(termNumber: number) {
    try {
      const academicYear = term1.start
        ? term1.start.getFullYear() + 543
        : new Date().getFullYear() + 543;
      const termYear = `${termNumber}/${academicYear}`;

      const res = await fetch("/api/term-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termYear }),
      });

      if (res.ok) {
        setSelectedCurrentTerm(termNumber);
        showDialog(
          `กำหนดให้ภาคเรียนที่ ${termNumber}/${academicYear} เป็นภาคเรียนปัจจุบันแล้ว`,
          "สำเร็จ",
        );
      }
    } catch (error) {
      console.error("ผิดพลาดในการกำหนดภาคเรียนปัจจุบัน:", error);
    }
  }

  React.useEffect(() => {
    async function fetchTerms() {
      try {
        setLoading(true);
        const res = await fetch("/api/term");
        if (res.ok) {
          const data = await res.json();
          data.forEach((term: any) => {
            if (term.name === "ภาคเรียนที่ 1")
              setTerm1({
                start: new Date(term.start),
                end: new Date(term.end),
              });
            if (term.name === "ภาคเรียนที่ 2")
              setTerm2({
                start: new Date(term.start),
                end: new Date(term.end),
              });
            if (term.name === "ภาคเรียนที่ 3")
              setTerm3({
                start: new Date(term.start),
                end: new Date(term.end),
              });
          });
        }

        const currentTermRes = await fetch("/api/current-term-year");
        if (currentTermRes.ok) {
          const currentTermData = await currentTermRes.json();
          const termNumber = parseInt(currentTermData.termYear.split("/")[0]);
          setSelectedCurrentTerm(termNumber);
        }
      } catch (error) {
        console.error("ผิดพลาดในการดึงข้อมูลเทอม:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, []);

  function getCurrentTerm() {
    const today = new Date();
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      if (t.start && t.end && today >= t.start && today <= t.end) {
        const academicYear = term1.start
          ? term1.start.getFullYear() + 543
          : new Date().getFullYear() + 543;

        return {
          termNumber: i + 1,
          start: t.start,
          end: t.end,
          academicYear: academicYear,
        };
      }
    }
    return null;
  }

  const currentTerm = getCurrentTerm();

  React.useEffect(() => {
    if (term1.start && term1.end)
      saveTerm("ภาคเรียนที่ 1", term1.start, term1.end);
  }, [term1.start, term1.end]);

  React.useEffect(() => {
    if (term2.start && term2.end)
      saveTerm("ภาคเรียนที่ 2", term2.start, term2.end);
  }, [term2.start, term2.end]);

  React.useEffect(() => {
    if (term3.start && term3.end)
      saveTerm("ภาคเรียนที่ 3", term3.start, term3.end);
  }, [term3.start, term3.end]);

  function getAllOverlapTermNames(
    start: Date | undefined,
    end: Date | undefined,
    otherTerms: { name: string; start?: Date; end?: Date }[],
  ): string[] {
    if (!start || !end) return [];
    return otherTerms
      .filter(
        (term) =>
          term.start && term.end && start <= term.end && end >= term.start,
      )
      .map((term) => term.name);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground font-sans">
          กำลังโหลดข้อมูลปฏิทินการศึกษา...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500 max-w-5xl">
      {/* Academic Header */}
      <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-card p-6 shadow-xs transition-all">
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
                className="font-normal text-xs bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-sans"
              >
                กำหนดการทางวิชาการ
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <CalendarIcon className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              ปฏิทินการศึกษา
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              กำหนดช่วงเวลาเปิด-ปิดภาคเรียน และกำหนดภาคเรียนปัจจุบันสำหรับระบบจัดตารางเรียน
            </p>
          </div>
          {selectedCurrentTerm && (
            <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-border bg-secondary/50">
              ภาคเรียนปัจจุบัน: {selectedCurrentTerm}/{(term1.start ? term1.start.getFullYear() + 543 : new Date().getFullYear() + 543)}
            </Badge>
          )}
        </div>
      </div>

      {/* Date Ranges Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold font-sans">
            ช่วงเวลาของแต่ละภาคการศึกษา
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            กำหนดวันเริ่มต้นและวันสิ้นสุดของภาคเรียนที่ 1, ภาคเรียนที่ 2 และภาคฤดูร้อน (ภาคเรียนที่ 3)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Term 1 */}
            <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-secondary/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-foreground font-sans">
                  ภาคเรียนที่ 1
                </Label>
                {term1.start && term1.end && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10">
                    ครบถ้วน
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <CalendarCustom
                  date={term1.start}
                  onChange={(date) => {
                    const newStart = date;
                    const newEnd = term1.end;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 2", ...term2 },
                        { name: "ภาคเรียนที่ 3", ...term3 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newEnd && newStart && newEnd < newStart) {
                      showDialog("วันเริ่มต้นต้องไม่ใหม่กว่าวันสิ้นสุด");
                      return;
                    }
                    setTerm1((t) => ({ ...t, start: date }));
                  }}
                  terms={terms}
                  selectDate="เริ่มภาคเรียนที่ 1"
                />
                <CalendarCustom
                  date={term1.end}
                  onChange={(date) => {
                    const newStart = term1.start;
                    const newEnd = date;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 2", ...term2 },
                        { name: "ภาคเรียนที่ 3", ...term3 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newStart && newEnd && newEnd < newStart) {
                      showDialog("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น");
                      return;
                    }
                    setTerm1((t) => ({ ...t, end: date }));
                  }}
                  terms={terms}
                  selectDate="สิ้นสุดภาคเรียนที่ 1"
                />
              </div>
            </div>

            {/* Term 2 */}
            <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-secondary/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-foreground font-sans">
                  ภาคเรียนที่ 2
                </Label>
                {term2.start && term2.end && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10">
                    ครบถ้วน
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <CalendarCustom
                  date={term2.start}
                  onChange={(date) => {
                    const newStart = date;
                    const newEnd = term2.end;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 1", ...term1 },
                        { name: "ภาคเรียนที่ 3", ...term3 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newEnd && newStart && newEnd < newStart) {
                      showDialog("วันเริ่มต้นต้องไม่ใหม่กว่าวันสิ้นสุด");
                      return;
                    }
                    setTerm2((t) => ({ ...t, start: date }));
                  }}
                  terms={terms}
                  selectDate="เริ่มภาคเรียนที่ 2"
                />
                <CalendarCustom
                  date={term2.end}
                  onChange={(date) => {
                    const newStart = term2.start;
                    const newEnd = date;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 1", ...term1 },
                        { name: "ภาคเรียนที่ 3", ...term3 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newStart && newEnd && newEnd < newStart) {
                      showDialog("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น");
                      return;
                    }
                    setTerm2((t) => ({ ...t, end: date }));
                  }}
                  terms={terms}
                  selectDate="สิ้นสุดภาคเรียนที่ 2"
                />
              </div>
            </div>

            {/* Term 3 */}
            <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-secondary/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-foreground font-sans">
                  ภาคเรียนที่ 3
                </Label>
                {term3.start && term3.end && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10">
                    ครบถ้วน
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <CalendarCustom
                  date={term3.start}
                  onChange={(date) => {
                    const newStart = date;
                    const newEnd = term3.end;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 1", ...term1 },
                        { name: "ภาคเรียนที่ 2", ...term2 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newEnd && newStart && newEnd < newStart) {
                      showDialog("วันเริ่มต้นต้องไม่ใหม่กว่าวันสิ้นสุด");
                      return;
                    }
                    setTerm3((t) => ({ ...t, start: date }));
                  }}
                  terms={terms}
                  selectDate="เริ่มภาคเรียนที่ 3"
                />
                <CalendarCustom
                  date={term3.end}
                  onChange={(date) => {
                    const newStart = term3.start;
                    const newEnd = date;
                    const overlaps = getAllOverlapTermNames(
                      newStart,
                      newEnd,
                      [
                        { name: "ภาคเรียนที่ 1", ...term1 },
                        { name: "ภาคเรียนที่ 2", ...term2 },
                      ],
                    );
                    if (newStart && newEnd && overlaps.length > 0) {
                      showDialog(`ช่วงเวลานี้ซ้ำกับ${overlaps.join(" และ ")}`);
                      return;
                    }
                    if (newStart && newEnd && newEnd < newStart) {
                      showDialog("วันสิ้นสุดต้องไม่เก่ากว่าวันเริ่มต้น");
                      return;
                    }
                    setTerm3((t) => ({ ...t, end: date }));
                  }}
                  terms={terms}
                  selectDate="สิ้นสุดภาคเรียนที่ 3"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Calendar Preview */}
      {currentTerm && (
        <DisplayCalendarCustom
          termNumber={currentTerm.termNumber}
          start={currentTerm.start}
          end={currentTerm.end}
          academicYear={currentTerm.academicYear}
        />
      )}

      {/* Set Current Term Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold font-sans">
            กำหนดภาคเรียนปัจจุบัน
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            เลือกภาคเรียนที่กำลังเปิดทำการสอน การเลือกนี้จะส่งผลต่อการดึงข้อมูลตารางเรียนและอาจารย์ทั้งระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((termNumber) => {
              const termData =
                termNumber === 1
                  ? term1
                  : termNumber === 2
                    ? term2
                    : term3;
              const isComplete = termData.start && termData.end;
              const academicYear = term1.start
                ? term1.start.getFullYear() + 543
                : new Date().getFullYear() + 543;

              const isCurrent = selectedCurrentTerm === termNumber;

              return (
                <div key={termNumber} className="space-y-2">
                  <Button
                    variant={isCurrent ? "default" : "outline"}
                    className={`w-full h-auto py-3 font-sans transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "border-border hover:bg-secondary"
                    }`}
                    onClick={() => setCurrentTerm(termNumber)}
                    disabled={!isComplete}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs sm:text-sm">
                        ภาคเรียนที่ {termNumber}/{academicYear}
                      </span>
                      {!isComplete && (
                        <span className="text-[10px] text-muted-foreground">
                          (ยังไม่ได้กำหนดช่วงเวลา)
                        </span>
                      )}
                    </div>
                  </Button>
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="w-full justify-center text-[10px] font-sans border-border bg-secondary/80 text-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                      ภาคเรียนปัจจุบัน
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans text-foreground">{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDialogOpen(false)} className="font-sans">
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
