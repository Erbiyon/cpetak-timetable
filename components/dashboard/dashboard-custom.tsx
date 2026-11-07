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
  Grid2x2Check,
  House,
  Calendar,
  ArrowRight,
  BookOpenText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardClock } from "@/features/dashboard/components/DashboardClock";

export default function DashboardCustom() {
  const { data: session } = useSession();
  const [isTerm3, setIsTerm3] = useState<boolean>(false);
  const [currentTermYear, setCurrentTermYear] = useState<string>("");

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

    fetchCurrentTermYear();
  }, []);

  const quickActions = [
    {
      title: "แผนการเรียน",
      description: "จัดการแผนการเรียน",
      icon: <NotebookPen className="h-8 w-8" />,
      color: "text-blue-700",
      items: [
        { href: "/study-plans/transfer-plan", label: "เทียบโอน" },
        { href: "/study-plans/four-year-plan", label: "4 ปี" },
        { href: "/study-plans/dve-lvc-plan", label: "ปวส. (ปวช.)" },
        { href: "/study-plans/dve-msix-plan", label: "ปวส. (ม.6)" },
      ],
    },
    {
      title: "ห้องเรียน",
      description: "จัดการข้อมูลห้องเรียน",
      icon: <School className="h-8 w-8" />,
      color: "text-green-700",
      items: [
        { href: "/rooms", label: "จัดการห้องเรียน" },
        { href: "/rooms/room-out", label: "ห้องวิชานอกสาขา" },
      ],
    },
    {
      title: "อาจารย์",
      description: "จัดการข้อมูลอาจารย์",
      icon: <SquareUser className="h-8 w-8" />,
      color: "text-purple-700",
      items: [
        { href: "/teachers", label: "จัดการรายชื่ออาจารย์" },
        { href: "/teachers/in-teacher", label: "อาจารย์วิชาในสาขา" },
        { href: "/teachers/out-teacher", label: "อาจารย์วิชานอกสาขา" },
      ],
    },
    {
      title: "หลักสูตร",
      description: "ดูหลักสูตรและรายวิชา",
      icon: <BookOpenText className="h-6 w-6" />,
      items: [
        {
          href: "/curriculum",
          label: "หลักสูตร",
        },
      ],
      color: "text-rose-600 dark:text-rose-400",
    },
  ];

  const timetableActions = [
    {
      title: "จัดตารางเรียน เทียบโอน",
      icon: <Table className="h-6 w-6" />,
      color: "border-blue-600",
      iconColor: "text-blue-600 dark:text-blue-400",
      items: [
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year",
          label: "ปี 1",
        },
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year",
          label: "ปี 2",
        },
        ...(isTerm3
          ? []
          : [
              {
                href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year",
                label: "ปี 3",
              },
            ]),
      ],
    },
    ...(isTerm3
      ? []
      : [
          {
            title: "จัดตารางเรียน 4 ปี",
            icon: <Table className="h-6 w-6" />,
            color: "border-green-600",
            iconColor: "text-green-600 dark:text-green-400",
            items: [
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-one-year",
                label: "ปี 1",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-two-year",
                label: "ปี 2",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-three-year",
                label: "ปี 3",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-four-year",
                label: "ปี 4",
              },
            ],
          },
        ]),
    {
      title: "จัดตารางเรียน ปวส.",
      icon: <Table className="h-6 w-6" />,
      color: "border-orange-600",
      iconColor: "text-orange-600 dark:text-orange-400",
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
      title: "ตารางสอน",
      description: "ดูตารางสอนทั้งหมด",
      icon: <Grid2x2Check className="h-6 w-6" />,
      href: "/class-schedule",
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "การใช้ห้อง",
      description: "ตรวจสอบการใช้ห้องเรียน",
      icon: <House className="h-6 w-6" />,
      href: "/rooms-use",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "ปฏิทินการศึกษา",
      description: "ดูปฏิทินและกำหนดการ",
      icon: <Calendar className="h-6 w-6" />,
      href: "/academic-calendar",
      color: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & System Status Banner */}
      <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-sm border border-primary/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground/80">ระบบจัดตารางเรียนออนไลน์</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ยินดีต้อนรับ, {session?.user?.name || "ผู้ดูแลระบบ"}
            </h1>
            <p className="text-sm text-primary-foreground/80 mt-1">
              สาขาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์
            </p>
          </div>
          <div className="text-left sm:text-right bg-black/15 p-3 rounded-lg border border-white/10">
            <DashboardClock className="text-sm text-white font-medium mb-1" />
            {currentTermYear && (
              <p className="text-xs text-primary-foreground/80">
                ภาคเรียนปัจจุบัน: <strong className="text-white font-semibold">{currentTermYear}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/15">
          <Badge
            variant="secondary"
            className="bg-white/20 hover:bg-white/25 text-white border-white/20 font-medium text-xs px-2.5 py-0.5"
          >
            {session?.user?.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ผู้ใช้ทั่วไป"}
          </Badge>
          {currentTermYear && (
            <Badge
              variant="outline"
              className="bg-black/20 text-white border-white/20 font-mono text-xs px-2.5 py-0.5"
            >
              Term: {currentTermYear}
            </Badge>
          )}
          <span className="text-xs text-white/70 ml-auto hidden md:inline">
            สถานะระบบ: เชื่อมต่อฐานข้อมูลปกติ
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3 flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-primary" />
          จัดการข้อมูลพื้นฐาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="border-border hover:shadow-xs transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-muted border border-border/50 ${action.color}`}>
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
                        className="w-full justify-start text-xs font-normal h-8 hover:bg-accent border-border/80 cursor-pointer"
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

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3 flex items-center gap-2">
          <Table className="h-5 w-5 text-primary" />
          จัดการตารางเรียน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetableActions.map((action) => (
            <Card
              key={action.title}
              className={`transition-all border-border hover:border-primary/50 hover:shadow-xs ${action.color}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className={action.iconColor}>{action.icon}</span>
                    {action.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {action.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-xs font-normal h-8 hover:bg-accent/80 cursor-pointer"
                      >
                        {item.label}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          รายงานตารางและการใช้งาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {utilityActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="border-border hover:border-primary/50 hover:shadow-xs transition-all h-full">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-0.5 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg bg-muted border border-border/50 ${action.color} group-hover:scale-105 transition-transform`}
                  >
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
