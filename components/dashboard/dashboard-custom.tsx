"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  School,
  SquareUser,
  Table,
  Calendar,
  ArrowRight,
  BookOpenText,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardClock } from "@/features/dashboard/components/DashboardClock";
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
}

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

  // เมนูจัดตารางเรียนตามหลักสูตร
  const timetableCurriculums = [
    {
      title: "หลักสูตรเทียบโอน",
      curriculumCode: "TRANSFER",
      years: [
        { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year" },
        { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year" },
        ...(isTerm3 ? [] : [{ label: "ชั้นปีที่ 3", href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year" }]),
      ],
      planCount: stats?.planBreakdown.transfer || 0,
      badgeVariant: "default" as const,
    },
    ...(isTerm3
      ? []
      : [
          {
            title: "หลักสูตร 4 ปี (ปกติ)",
            curriculumCode: "FOUR_YEAR",
            years: [
              { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-four-year/four-one-year" },
              { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-four-year/four-two-year" },
              { label: "ชั้นปีที่ 3", href: "/adjust-time-tables/adjust-plan-four-year/four-three-year" },
              { label: "ชั้นปีที่ 4", href: "/adjust-time-tables/adjust-plan-four-year/four-four-year" },
            ],
            planCount: stats?.planBreakdown.fourYear || 0,
            badgeVariant: "secondary" as const,
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
      badgeVariant: "outline" as const,
    },
    {
      title: "หลักสูตร ปวส. (ม.6)",
      curriculumCode: "DVE-MSIX",
      years: [
        { label: "ชั้นปีที่ 1", href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year" },
        { label: "ชั้นปีที่ 2", href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year" },
      ],
      planCount: stats?.planBreakdown.dveMsix || 0,
      badgeVariant: "outline" as const,
    },
  ];

  // เมนูดำเนินงานหลัก
  const quickOperations = [
    {
      title: "ตารางการใช้ห้องเรียน",
      description: "ตรวจสอบความหนาแน่นและช่วงเวลาการใช้ห้อง",
      icon: <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      href: "/rooms-use",
    },
    {
      title: "ตารางสอนอาจารย์",
      description: "ตรวจสอบภาระการสอนและส่งออกไฟล์ Excel",
      icon: <CalendarCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      href: "/class-schedule",
    },
    {
      title: "จัดการข้อมูลอาจารย์",
      description: "รายชื่อคณาจารย์ประจำและอาจารย์ภายนอก",
      icon: <SquareUser className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      href: "/teachers",
    },
    {
      title: "จัดการห้องเรียนและแล็บ",
      description: "ข้อมูลห้องปฏิบัติการและห้องบรรยาย",
      icon: <School className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      href: "/rooms",
    },
    {
      title: "โครงสร้างหลักสูตร",
      description: "ตรวจสอบรายชื่อวิชาและหน่วยกิตตามแผน",
      icon: <BookOpenText className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      href: "/curriculum",
    },
    {
      title: "ปฏิทินการศึกษา",
      description: "กำหนดการเปิด-ปิดภาคเรียนและกิจกรรมสาขา",
      icon: <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      href: "/academic-calendar",
    },
  ];

  return (
    <div className="space-y-6">
      {/* A. Academic Context Header */}
      <div className="rounded-xl border bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 font-medium text-xs px-2.5 py-0.5">
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              {session?.user?.role === "admin" && (
                <Badge variant="secondary" className="font-normal text-xs">
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
            <div className="rounded-lg border bg-muted/40 px-4 py-2.5 text-left sm:text-right">
              <div className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                เวลาปัจจุบัน
              </div>
              <DashboardClock className="text-sm font-semibold text-foreground font-mono" />
              {currentTermYear && (
                <div className="text-xs font-medium text-primary mt-0.5">
                  ภาคการศึกษาที่ {currentTermYear}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* B. Scheduling Progress Overview (Enterprise KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: รายวิชาที่จัดตารางแล้ว */}
        <Card className="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายวิชาที่จัดตารางแล้ว
            </CardTitle>
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={assignedPlans} />}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                / {totalPlans} แผน
              </span>
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
        <Card className="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายวิชาที่ยังไม่ได้จัด
            </CardTitle>
            <div className="p-2 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={unassignedPlans} />}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                รายวิชา
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {unassignedPlans > 0 ? "มีรายวิชารอจัดลงช่วงเวลาตาราง" : "จัดลงตารางครบถ้วนแล้ว"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: ห้องเรียนที่มีการใช้งาน */}
        <Card className="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ห้องเรียนที่ใช้งาน
            </CardTitle>
            <div className="p-2 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <School className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={utilizedRooms} />}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                / {totalRooms} ห้อง
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ห้องปฏิบัติการและห้องบรรยายในระบบ
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: จำนวนอาจารย์ผู้สอน */}
        <Card className="shadow-xs hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              คณาจารย์ผู้สอน
            </CardTitle>
            <div className="p-2 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <SquareUser className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={stats?.totalTeachers || 0} />}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                ท่าน
              </span>
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
        <Card className="lg:col-span-1 shadow-xs border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                รายการที่ต้องดำเนินการ
              </CardTitle>
              <Badge variant="outline" className="text-xs">
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
                <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 border-amber-200 dark:border-amber-900/40">
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
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-muted/50 hover:bg-muted transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน เทียบโอน ปี 1</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/adjust-time-tables/adjust-plan-four-year/four-one-year"
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-muted/50 hover:bg-muted transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน 4 ปี ชั้นปีที่ 1</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/adjust-time-tables/adjust-plan-dve/dve-one-year"
                      className="flex items-center justify-between px-3 py-2 text-xs rounded-md bg-muted/50 hover:bg-muted transition-colors text-foreground font-medium"
                    >
                      <span>จัดตารางเรียน ปวส. ปี 1 (ปวช.)</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border-emerald-200 dark:border-emerald-900/40 text-center">
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
        <Card className="lg:col-span-2 shadow-xs border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  <h2 className="flex items-center gap-2 text-base font-semibold m-0 p-0 text-foreground">
                    <Table className="h-4 w-4 text-primary" />
                    จัดการตารางเรียน
                  </h2>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  ความคืบหน้าการจัดตารางเรียนตามหลักสูตรและทางเข้าสู่แต่ละชั้นปี
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-medium">
                {timetableCurriculums.length} หลักสูตร
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {timetableCurriculums.map((curr) => (
                <div
                  key={curr.curriculumCode}
                  className="rounded-lg border p-4 hover:border-primary/40 transition-colors bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-foreground">
                      {curr.title}
                    </span>
                    <Badge variant={curr.badgeVariant} className="text-[11px] font-normal">
                      {curr.planCount} แผนการเรียน
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {curr.years.map((yr) => (
                      <Link key={yr.href} href={yr.href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between text-xs h-8 font-normal hover:bg-accent border-border/70"
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

      {/* F. Quick Operations (เมนูดำเนินงาน) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            เมนูดำเนินงาน
          </h2>
          <span className="text-xs text-muted-foreground">
            เข้าถึงโมดูลหลักสำหรับงานบริหารวิชาการ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickOperations.map((op) => (
            <Link key={op.href} href={op.href} className="group block">
              <Card className="shadow-xs border hover:border-primary/50 transition-all h-full">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {op.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {op.description}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/60 border border-border group-hover:bg-primary/10 transition-colors shrink-0 ml-3">
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
