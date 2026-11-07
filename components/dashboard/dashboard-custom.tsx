"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  SquareUser,
  Table,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarCheck2,
  BookOpenText,
  Layers,
  ArrowRight,
  ChevronRight,
  BarChart3,
  CalendarRange,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardClock } from "@/features/dashboard/components/DashboardClock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "./animated-counter";

interface DashboardStats {
  totalTeachers: number;
  totalRooms: number;
  totalSubjects: number;
  activePlans: number;
  planBreakdown: {
    transfer: number;
    fourYear: number;
    dveLvc: number;
    dveMsix: number;
  };
  currentTermYear?: string;
  assignedPlansCount?: number;
  unassignedPlansCount?: number;
  schedulingProgressPercent?: number;
  utilizedRoomsCount?: number;
  scheduledTimetableSlots?: number;
  dayDistribution?: Record<number, number>;
}

const DAYS_MAP = [
  { day: 1, label: "จันทร์", fullLabel: "วันจันทร์" },
  { day: 2, label: "อังคาร", fullLabel: "วันอังคาร" },
  { day: 3, label: "พุธ", fullLabel: "วันพุธ" },
  { day: 4, label: "พฤหัสฯ", fullLabel: "วันพฤหัสบดี" },
  { day: 5, label: "ศุกร์", fullLabel: "วันศุกร์" },
  { day: 6, label: "เสาร์", fullLabel: "วันเสาร์" },
  { day: 7, label: "อาทิตย์", fullLabel: "วันอาทิตย์" },
];

export default function DashboardCustom() {
  const { data: session } = useSession();
  const [isTerm3, setIsTerm3] = useState<boolean>(false);
  const [currentTermYear, setCurrentTermYear] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentTermYear = async () => {
      try {
        const response = await fetch("/api/current-term-year");
        if (response.ok) {
          const data = await response.json();
          const termNumber = parseInt(data.termYear.split("/")[0]);
          setIsTerm3(termNumber === 3);
          setCurrentTermYear(data.termYear);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลปีการศึกษา:", error);
      }
    };

    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchCurrentTermYear();
    fetchStats();
  }, []);

  // คำนวณความคืบหน้าการจัดตารางเรียน
  const totalPlans = stats?.activePlans || 0;
  const assignedPlans = stats?.assignedPlansCount ?? 0;
  const unassignedPlans = stats?.unassignedPlansCount ?? totalPlans;
  const progressPercent = stats?.schedulingProgressPercent ?? (totalPlans > 0 ? Math.round((assignedPlans / totalPlans) * 100) : 0);
  const totalRooms = stats?.totalRooms || 0;
  const utilizedRooms = stats?.utilizedRoomsCount ?? 0;
  const dayDistribution = stats?.dayDistribution || {};
  const maxDaySlots = Math.max(...Object.values(dayDistribution), 1);

  // ข้อมูลหลักสูตรและชั้นปี พร้อมสีกรอบและป้ายกำกับเฉพาะแต่ละหลักสูตร
  const timetableCurriculums = [
    {
      title: "หลักสูตรเทียบโอน (3 ปี)",
      curriculumCode: "TRANSFER",
      years: [
        { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year" },
        { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year" },
        { label: "ชั้นปีที่ 3", href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year" },
      ],
      planCount: stats?.planBreakdown.transfer || 0,
      borderStyle: "border-sky-300/80 dark:border-sky-800/80 hover:border-sky-500 dark:hover:border-sky-400",
      accentBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      indicatorColor: "bg-sky-500",
    },
    ...(isTerm3
      ? []
      : [
          {
            title: "หลักสูตร 4 ปี",
            curriculumCode: "FOUR_YEAR",
            years: [
              { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-four-year/four-one-year" },
              { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-four-year/four-two-year" },
              { label: "ชั้นปีที่ 3", href: "/adjust-time-tables/adjust-plan-four-year/four-three-year" },
              { label: "ชั้นปีที่ 4", href: "/adjust-time-tables/adjust-plan-four-year/four-four-year" },
            ],
            planCount: stats?.planBreakdown.fourYear || 0,
            borderStyle: "border-indigo-300/80 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-400",
            accentBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
            indicatorColor: "bg-indigo-500",
          },
        ]),
    {
      title: "หลักสูตร ปวส. (ปวช.)",
      curriculumCode: "DVE-LVC",
      years: [
        { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-dve/dve-one-year" },
        { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-dve/dve-two-year" },
      ],
      planCount: stats?.planBreakdown.dveLvc || 0,
      borderStyle: "border-amber-300/80 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-400",
      accentBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      indicatorColor: "bg-amber-500",
    },
    {
      title: "หลักสูตร ปวส. (ม.6)",
      curriculumCode: "DVE-MSIX",
      years: [
        { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year" },
        { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year" },
      ],
      planCount: stats?.planBreakdown.dveMsix || 0,
      borderStyle: "border-emerald-300/80 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-400",
      accentBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      indicatorColor: "bg-emerald-500",
    },
  ];

  // เมนูดำเนินงานหลัก (Quick Operations) พร้อมสีกรอบแยกหมวดหมู่อย่างชัดเจน
  const quickOperations = [
    {
      title: "ตารางการใช้ห้องเรียน",
      description: "ตรวจสอบความหนาแน่นและช่วงเวลาการใช้ห้อง",
      icon: <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      borderStyle: "border-blue-200/90 dark:border-blue-900/60 hover:border-blue-500 dark:hover:border-blue-400",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
      href: "/rooms-use",
    },
    {
      title: "ตารางสอนอาจารย์",
      description: "ตรวจสอบภาระการสอนและส่งออกไฟล์ Excel",
      icon: <CalendarCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      borderStyle: "border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-500 dark:hover:border-indigo-400",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50",
      href: "/class-schedule",
    },
    {
      title: "จัดการข้อมูลอาจารย์",
      description: "รายชื่ออาจารย์ผู้สอนและการลงทะเบียนผู้ใช้",
      icon: <SquareUser className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
      borderStyle: "border-violet-200/90 dark:border-violet-900/60 hover:border-violet-500 dark:hover:border-violet-400",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/50",
      href: "/teachers",
    },
    {
      title: "จัดการห้องเรียน",
      description: "เพิ่ม แก้ไข และกำหนดประเภทห้องเรียน",
      icon: <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      borderStyle: "border-teal-200/90 dark:border-teal-900/60 hover:border-teal-500 dark:hover:border-teal-400",
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/50",
      href: "/rooms",
    },
    {
      title: "โครงสร้างหลักสูตร",
      description: "ตรวจสอบรายชื่อวิชาและหน่วยกิตตามแผน",
      icon: <BookOpenText className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      borderStyle: "border-amber-200/90 dark:border-amber-900/60 hover:border-amber-500 dark:hover:border-amber-400",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
      href: "/curriculum",
    },
    {
      title: "ปฏิทินการศึกษา",
      description: "กำหนดการเปิด-ปิดภาคเรียนและกิจกรรมสาขา",
      icon: <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      borderStyle: "border-rose-200/90 dark:border-rose-900/60 hover:border-rose-500 dark:hover:border-rose-400",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
      href: "/academic-calendar",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* A. Academic Context Header (ภาพรวมงานวิชาการ) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-border bg-muted/60 text-foreground font-medium text-xs px-2.5 py-0.5">
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              {session?.user?.role === "admin" && (
                <Badge variant="secondary" className="font-normal text-xs bg-secondary text-secondary-foreground">
                  สิทธิ์ผู้ดูแลระบบ
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ยินดีต้อนรับ — ภาพรวมงานวิชาการ
            </h1>
            <p className="text-sm text-muted-foreground">
              ข้อมูลการจัดตารางเรียนและการดำเนินงานประจำภาคการศึกษา
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-left sm:text-right">
              <div className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1.5">
                <Clock className="h-3.5 w-3.5 text-foreground" />
                เวลาปัจจุบัน
              </div>
              <DashboardClock className="text-sm font-semibold text-foreground font-sans tracking-tight" />
              {currentTermYear && (
                <div className="text-xs font-medium text-foreground mt-0.5">
                  ภาคการศึกษาที่ {currentTermYear}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* B. Scheduling Progress Overview (Zinc Enterprise KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: รายวิชาที่จัดตารางแล้ว */}
        <Card className="border border-border bg-card shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายวิชาที่จัดตารางแล้ว
            </CardTitle>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <AnimatedCounter value={assignedPlans} />
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    / {totalPlans} แผน
                  </span>
                </>
              )}
            </div>
            <div className="mt-2.5">
              <Progress value={progressPercent} className="h-1.5 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              คิดเป็น {progressPercent}% ของแผนทั้งหมด
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: รายวิชาที่ยังไม่ได้จัดตาราง */}
        <Card className="border border-border bg-card shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายวิชาที่ยังไม่ได้จัด
            </CardTitle>
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <AnimatedCounter value={unassignedPlans} />
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    รายวิชา
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {unassignedPlans > 0 ? "มีรายวิชารอจัดลงช่วงเวลาตาราง" : "จัดลงตารางครบถ้วนแล้ว"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: ห้องเรียนที่มีการใช้งาน */}
        <Card className="border border-border bg-card shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ห้องเรียนที่ใช้งาน
            </CardTitle>
            <div className="p-2 rounded-md bg-secondary text-foreground">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <AnimatedCounter value={utilizedRooms} />
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    / {totalRooms} ห้อง
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ห้องปฏิบัติการและห้องบรรยายในระบบ
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: จำนวนอาจารย์ผู้สอน */}
        <Card className="border border-border bg-card shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              คณาจารย์ผู้สอน
            </CardTitle>
            <div className="p-2 rounded-md bg-secondary text-foreground">
              <SquareUser className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <AnimatedCounter value={stats?.totalTeachers || 0} />
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    ท่าน
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              อาจารย์ประจำสาขาและอาจารย์พิเศษ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* C & D. Required Actions & Curriculum Scheduling Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Required Actions (รายการที่ต้องดำเนินการ) */}
        <Card className="lg:col-span-1 shadow-xs border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                รายการที่ต้องดำเนินการ
              </CardTitle>
              <Badge variant="outline" className="text-xs border-border bg-muted/40">
                {unassignedPlans > 0 ? `${unassignedPlans} รายการ` : "ครบถ้วน"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              งานจัดตารางที่ต้องตรวจสอบหรือดำเนินการในภาคการศึกษานี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {unassignedPlans > 0 ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-500/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        มีรายวิชายังไม่ได้จัดลงตาราง
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        พบ {unassignedPlans} แผนการเรียนที่ยังไม่มีการกำหนดวันและคาบเวลา
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    เข้าสู่หน้าจัดตารางเรียนด่วน:
                  </div>
                  <div className="space-y-1">
                    <Link
                      href="/adjust-time-tables/adjust-plan-transfer/transfer-one-year"
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-secondary/60 hover:bg-secondary transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน เทียบโอน ปี 1</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/adjust-time-tables/adjust-plan-four-year/four-one-year"
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-secondary/60 hover:bg-secondary transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน 4 ปี ชั้นปีที่ 1</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/adjust-time-tables/adjust-plan-dve/dve-one-year"
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-secondary/60 hover:bg-secondary transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน ปวส. ปี 1 (ปวช.)</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-500/5 p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-foreground">
                  จัดตารางเรียนครบถ้วนสมบูรณ์
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ทุกแผนการเรียนได้รับการจัดช่วงเวลาและห้องเรียนเรียบร้อยแล้ว
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* D. Curriculum Scheduling Progress (ความคืบหน้าการจัดตารางเรียนตามหลักสูตร) */}
        <Card className="lg:col-span-2 shadow-xs border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  <h2 className="flex items-center gap-2 text-base font-semibold m-0 p-0 text-foreground">
                    <Table className="h-4 w-4 text-foreground" />
                    จัดการตารางเรียน
                  </h2>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  ความคืบหน้าการจัดตารางเรียนตามหลักสูตรและทางเข้าสู่แต่ละชั้นปี
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-medium border-border">
                {timetableCurriculums.length} หลักสูตร
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {timetableCurriculums.map((curr) => (
                <div
                  key={curr.curriculumCode}
                  className={`rounded-lg border p-4 transition-all duration-200 bg-card shadow-2xs ${curr.borderStyle}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${curr.indicatorColor}`} />
                      <span className="font-semibold text-sm text-foreground">
                        {curr.title}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[11px] font-normal ${curr.accentBg}`}>
                      {curr.planCount} แผนการเรียน
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {curr.years.map((yr) => (
                      <Link key={yr.href} href={yr.href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between text-xs h-8 font-normal hover:bg-secondary border-border/80 text-foreground"
                        >
                          <span>{yr.label}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* E. Scheduling Overview (ภาพรวมการกระจายคาบเรียนตามวันในสัปดาห์) */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-foreground" />
                ภาพรวมการจัดตารางเรียน
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                การกระจายช่วงเวลาคาบเรียน (Timetable Slots) ที่ได้รับการจัดตารางในแต่ละวัน
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              รวม {stats?.scheduledTimetableSlots || 0} ช่วงเวลา
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
            {DAYS_MAP.map((d) => {
              const count = dayDistribution[d.day] || 0;
              const heightPercent = maxDaySlots > 0 ? Math.max(Math.round((count / maxDaySlots) * 100), 12) : 12;
              return (
                <div key={d.day} className="flex flex-col items-center justify-end h-28 p-2 rounded-lg bg-secondary/40 border border-border/60">
                  <div className="text-xs font-semibold text-foreground mb-1">
                    {count}
                  </div>
                  <div className="w-full bg-secondary rounded-sm overflow-hidden flex items-end justify-center h-14">
                    <div
                      className="w-full bg-foreground/80 dark:bg-foreground/70 rounded-xs transition-all duration-500 ease-out"
                      style={{ height: `${count > 0 ? heightPercent : 4}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-2 truncate w-full">
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* F. Quick Operations (เมนูดำเนินงาน) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-foreground" />
            เมนูดำเนินงาน
          </h2>
          <span className="text-xs text-muted-foreground">
            เข้าถึงโมดูลหลักสำหรับงานบริหารวิชาการ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickOperations.map((op) => (
            <Link key={op.href} href={op.href} className="group block">
              <Card className={`border bg-card shadow-xs transition-all duration-200 h-full ${op.borderStyle}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-foreground group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {op.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {op.description}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-lg border transition-colors shrink-0 ml-3 ${op.iconBg}`}>
                    {op.icon}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
