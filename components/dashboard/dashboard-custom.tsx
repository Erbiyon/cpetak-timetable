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
import Link from "next/link";
import {
  NotebookPen,
  School,
  SquareUser,
  Table,
  Calendar,
  ArrowRight,
  BookOpenText,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Zap,
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

  const quickActions = [
    {
      title: "แผนการเรียน",
      description: "จัดการแผนการเรียนตามหลักสูตร",
      icon: <NotebookPen className="h-6 w-6 text-cyan-400" />,
      accentBorder: "hover:border-cyan-500/50",
      items: [
        { href: "/study-plans/transfer-plan", label: "เทียบโอน" },
        { href: "/study-plans/four-year-plan", label: "4 ปี" },
        { href: "/study-plans/dve-lvc-plan", label: "ปวส. (ปวช.)" },
        { href: "/study-plans/dve-msix-plan", label: "ปวส. (ม.6)" },
      ],
    },
    {
      title: "ห้องเรียน",
      description: "จัดการห้องเรียนและแล็บคอมพิวเตอร์",
      icon: <School className="h-6 w-6 text-violet-400" />,
      accentBorder: "hover:border-violet-500/50",
      items: [
        { href: "/rooms", label: "จัดการห้องเรียน" },
        { href: "/rooms/room-out", label: "ห้องวิชานอกสาขา" },
      ],
    },
    {
      title: "อาจารย์",
      description: "ข้อมูลคณาจารย์และภาระการสอน",
      icon: <SquareUser className="h-6 w-6 text-emerald-400" />,
      accentBorder: "hover:border-emerald-500/50",
      items: [
        { href: "/teachers", label: "จัดการรายชื่ออาจารย์" },
        { href: "/teachers/in-teacher", label: "อาจารย์ในสาขา" },
        { href: "/teachers/out-teacher", label: "อาจารย์นอกสาขา" },
      ],
    },
    {
      title: "หลักสูตร",
      description: "โครงสร้างหลักสูตรและรายวิชา",
      icon: <BookOpenText className="h-6 w-6 text-amber-400" />,
      accentBorder: "hover:border-amber-500/50",
      items: [
        {
          href: "/curriculum",
          label: "ดูโครงสร้างหลักสูตร",
        },
      ],
    },
  ];

  const timetableActions = [
    {
      title: "จัดตารางเรียน เทียบโอน",
      icon: <Table className="h-5 w-5 text-cyan-400" />,
      badge: "Transfer",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      items: [
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year",
          label: "เทียบโอน ปี 1",
        },
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year",
          label: "เทียบโอน ปี 2",
        },
        ...(isTerm3
          ? []
          : [
              {
                href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year",
                label: "เทียบโอน ปี 3",
              },
            ]),
      ],
    },
    ...(isTerm3
      ? []
      : [
          {
            title: "จัดตารางเรียน 4 ปี",
            icon: <Table className="h-5 w-5 text-violet-400" />,
            badge: "4-Year Plan",
            badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
            items: [
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-one-year",
                label: "4 ปี ชั้นปีที่ 1",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-two-year",
                label: "4 ปี ชั้นปีที่ 2",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-three-year",
                label: "4 ปี ชั้นปีที่ 3",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-four-year",
                label: "4 ปี ชั้นปีที่ 4",
              },
            ],
          },
        ]),
    {
      title: "จัดตารางเรียน ปวส.",
      icon: <Table className="h-5 w-5 text-emerald-400" />,
      badge: "DVE System",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      items: [
        {
          href: "/adjust-time-tables/adjust-plan-dve/dve-one-year",
          label: "ปวส. ปี 1 (ปวช.)",
        },
        {
          href: "/adjust-time-tables/adjust-plan-dve/dve-two-year",
          label: "ปวส. ปี 2 (ปวช.)",
        },
        {
          href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year",
          label: "ปวส. ปี 1 (ม.6)",
        },
        {
          href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year",
          label: "ปวส. ปี 2 (ม.6)",
        },
      ],
    },
  ];

  const utilityActions = [
    {
      title: "ตารางสอนอาจารย์",
      description: "ตรวจสอบตารางสอนรายบุคคลและ Export Excel",
      icon: <Calendar className="h-6 w-6 text-cyan-400" />,
      href: "/class-schedule",
    },
    {
      title: "การใช้งานห้องเรียน",
      description: "ตรวจสอบชั่วโมงการใช้ห้องและห้องว่าง",
      icon: <School className="h-6 w-6 text-violet-400" />,
      href: "/rooms-use",
    },
    {
      title: "ปฏิทินการศึกษา",
      description: "กำหนดการเปิด-ปิดภาคเรียนและกิจกรรมสาขา",
      icon: <Activity className="h-6 w-6 text-emerald-400" />,
      href: "/academic-calendar",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Futuristic Cyberpunk Command Center Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 hud-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Cpu className="h-3 w-3 text-cyan-400" />
                ACADEMIC TELEMETRY SYSTEM ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              ยินดีต้อนรับ, <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">{session?.user?.name || "ผู้ดูแลระบบ"}</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-light">
              ศูนย์บัญชาการและบริหารจัดการตารางเรียนอัตโนมัติ ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="backdrop-blur-md bg-slate-900/80 border border-cyan-500/30 rounded-xl px-4 py-2.5 shadow-inner">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono text-cyan-300 tracking-wider">SYSTEM CLOCK</span>
              </div>
              <DashboardClock className="text-sm font-mono text-white font-semibold" />
              {currentTermYear && (
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  ภาคการศึกษา: <span className="text-cyan-400 font-bold">{currentTermYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 mt-6 pt-4 border-t border-slate-800/80">
          <Badge
            variant="outline"
            className="bg-cyan-500/15 text-cyan-300 border-cyan-500/40 text-xs px-3 py-1 font-mono font-medium"
          >
            ROLE: {session?.user?.role === "admin" ? "ADMINISTRATOR" : "FACULTY USER"}
          </Badge>
          {currentTermYear && (
            <Badge
              variant="outline"
              className="bg-violet-500/15 text-violet-300 border-violet-500/40 text-xs px-3 py-1 font-mono font-medium"
            >
              TERM_EPOCH: {currentTermYear}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-xs px-3 py-1 font-mono font-medium"
          >
            DB_ENGINE: MYSQL 8.0 CONCURRENCY LOCKED
          </Badge>
          <span className="text-xs text-slate-400 ml-auto hidden lg:inline font-mono">
            NEXT.JS 16.4.5 TURBOPACK × REACT 19
          </span>
        </div>
      </div>

      {/* 2. Animated Real-Data Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Plans */}
        <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md hover:border-cyan-500/50 hover:shadow-lg transition-all group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
              TOTAL STUDY PLANS
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={stats?.activePlans || 0} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              แผนการเรียนเปิดสอนในระบบ
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Subjects */}
        <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md hover:border-violet-500/50 hover:shadow-lg transition-all group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
              UNIQUE SUBJECTS
            </span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
              <BookOpenText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={stats?.totalSubjects || 0} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              รหัสวิชาที่มีการจัดแผน
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Teachers */}
        <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md hover:border-emerald-500/50 hover:shadow-lg transition-all group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
              FACULTY MEMBERS
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <SquareUser className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={stats?.totalTeachers || 0} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              อาจารย์ผู้สอนในฐานข้อมูล
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Total Rooms */}
        <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md hover:border-amber-500/50 hover:shadow-lg transition-all group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
              ACTIVE ROOMS
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <School className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {isLoadingStats ? "..." : <AnimatedCounter value={stats?.totalRooms || 0} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ห้องเรียนและแล็บรองรับการจัด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Real Plan Distribution Progress / Telemetry Breakdown */}
      {stats?.planBreakdown && (
        <Card className="border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              สัดส่วนแผนการเรียนตามหลักสูตร (Real-time Telemetry Breakdown)
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              TOTAL: {stats.activePlans} PLANS
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <div className="text-xs font-medium text-cyan-400 mb-1">เทียบโอน (Transfer)</div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.planBreakdown.transfer}</div>
              <div className="text-[11px] text-muted-foreground">วิชาทั้งหมดในหลักสูตร</div>
            </div>
            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <div className="text-xs font-medium text-violet-400 mb-1">4 ปี (Four-Year)</div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.planBreakdown.fourYear}</div>
              <div className="text-[11px] text-muted-foreground">วิชาทั้งหมดในหลักสูตร</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="text-xs font-medium text-emerald-400 mb-1">ปวส. ปวช. (DVE-LVC)</div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.planBreakdown.dveLvc}</div>
              <div className="text-[11px] text-muted-foreground">วิชาทั้งหมดในหลักสูตร</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="text-xs font-medium text-amber-400 mb-1">ปวส. ม.6 (DVE-MSIX)</div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.planBreakdown.dveMsix}</div>
              <div className="text-[11px] text-muted-foreground">วิชาทั้งหมดในหลักสูตร</div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Curriculum Timetable Adjustment Matrix (Primary Mission) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            จัดการตารางเรียน
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            11 ACTIVE TIMETABLE MATRICES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetableActions.map((action) => (
            <Card
              key={action.title}
              className="border border-border/80 bg-card/60 backdrop-blur-md hover:border-cyan-500/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    {action.icon}
                    {action.title}
                  </CardTitle>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                    {action.badge}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {action.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block group">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-xs font-normal h-8.5 bg-background/50 hover:bg-cyan-500/10 hover:border-cyan-500/40 border-border/80 transition-all cursor-pointer"
                      >
                        <span className="text-foreground group-hover:text-cyan-400 transition-colors font-medium">
                          {item.label}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Core Academic Management Modules */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground mb-3 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-violet-400" />
          จัดการข้อมูลพื้นฐาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className={`border border-border/80 bg-card/60 backdrop-blur-md transition-all ${action.accentBorder}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-border">
                    {action.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{action.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {action.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs font-normal h-8 bg-background/40 hover:bg-accent border-border/70 cursor-pointer"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. Reporting, Workbooks & Utilities */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          รายงานตารางและการใช้งาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {utilityActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block">
              <Card className="border border-border/80 bg-card/60 backdrop-blur-md hover:border-emerald-500/40 hover:shadow-md transition-all h-full">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-emerald-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-border group-hover:scale-110 transition-transform">
                    {action.icon}
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
