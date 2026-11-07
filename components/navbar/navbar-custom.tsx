"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Calendar,
  CircleUser,
  Grid2x2Check,
  House,
  LogOut,
  Menu,
  NotebookPen,
  School,
  SquareUser,
  Table,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DarkModeToggle } from "../theme-provider/dark-mode";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function NavigationMenuCustom() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isTerm3, setIsTerm3] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentTermYear = async () => {
      try {
        const response = await fetch("/api/current-term-year");
        if (response.ok) {
          const data = await response.json();
          const termNumber = parseInt(data.termYear.split("/")[0]);
          setIsTerm3(termNumber === 3);
        }
      } catch (error) {
        console.error("Error fetching current term year:", error);
      }
    };

    fetchCurrentTermYear();
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const menuItems = [
    {
      title: "แผนการเรียน",
      icon: <NotebookPen size={16} className="mr-2" />,
      items: [
        { href: "/study-plans/transfer-plan", label: "แผนการเรียน เทียบโอน" },
        { href: "/study-plans/four-year-plan", label: "แผนการเรียน 4 ปี" },
        { href: "/study-plans/dve-lvc-plan", label: "แผนการเรียน ปวส. (ปวช.)" },
        { href: "/study-plans/dve-msix-plan", label: "แผนการเรียน ปวส. (ม.6)" },
      ],
    },
    {
      title: "ห้องเรียน",
      icon: <School size={16} className="mr-2" />,
      items: [
        { href: "/rooms", label: "จัดการห้องเรียน" },
        { href: "/rooms/room-out", label: "เพิ่มห้องเรียนวิชานอกสาขา" },
      ],
    },
    {
      title: "อาจารย์",
      icon: <SquareUser size={16} className="mr-2" />,
      items: [
        { href: "/teachers", label: "จัดการรายชื่ออาจารย์" },
        { href: "/teachers/in-teacher", label: "เพิ่มอาจารย์วิชาภายในสาขา" },
        { href: "/teachers/out-teacher", label: "เพิ่มอาจารย์วิชาภายนอกสาขา" },
      ],
    },
    {
      title: "จัดตารางเรียน เทียบโอน",
      icon: <Table size={16} className="mr-2 text-blue-600 dark:text-blue-400" />,
      items: [
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year",
          label: "จัดตารางเรียน ปี 1",
        },
        {
          href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year",
          label: "จัดตารางเรียน ปี 2",
        },
        ...(isTerm3
          ? []
          : [
              {
                href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year",
                label: "จัดตารางเรียน ปี 3",
              },
            ]),
      ],
    },
    ...(isTerm3
      ? []
      : [
          {
            title: "จัดตารางเรียน 4 ปี",
            icon: <Table size={16} color="#00ff40" className="mr-2" />,
            items: [
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-one-year",
                label: "จัดตารางเรียน ปี 1",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-two-year",
                label: "จัดตารางเรียน ปี 2",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-three-year",
                label: "จัดตารางเรียน ปี 3",
              },
              {
                href: "/adjust-time-tables/adjust-plan-four-year/four-four-year",
                label: "จัดตารางเรียน ปี 4",
              },
            ],
          },
        ]),
    {
      title: "จัดตารางเรียน ปวส.",
      icon: <Table size={16} color="#ff8000" className="mr-2" />,
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

  const singleItems = [
    { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { href: "/class-schedule", label: "ตารางสอน", icon: Grid2x2Check },
    { href: "/rooms-use", label: "การใช้ห้อง", icon: House },
    { href: "/academic-calendar", label: "ปฏิทินการศึกษา", icon: Calendar },
    { href: "/curriculum", label: "หลักสูตร", icon: NotebookPen },
  ];

  return (
    <>
      <div className="sticky top-0 left-0 w-full z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-xs px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 border-border hover:bg-accent cursor-pointer" aria-label="เปิดเมนูหลัก">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] overflow-y-auto p-4 border-r border-border bg-card">
                <SheetHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      CP
                    </div>
                    <div>
                      <SheetTitle className="text-base font-semibold leading-none">ระบบจัดตารางเรียน</SheetTitle>
                      <span className="text-xs text-muted-foreground">วิศวกรรมคอมพิวเตอร์</span>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex flex-col space-y-3 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border/60">
                    <div className="font-medium text-foreground flex items-center text-sm">
                      <CircleUser className="mr-2 h-4 w-4 text-primary" />
                      {session?.user?.name || "ผู้ดูแลระบบ"}
                    </div>
                    <div className="text-xs text-muted-foreground ml-6 mt-0.5">
                      {session?.user?.role === "admin"
                        ? "สถานะ: ผู้ดูแลระบบ (Admin)"
                        : "สถานะ: ผู้ใช้งาน"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {menuItems.map((menu) => (
                      <Collapsible key={menu.title}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-accent/80 rounded-md transition-colors cursor-pointer group">
                          <span className="text-sm font-medium flex items-center text-foreground group-hover:text-primary transition-colors">
                            <span>{menu.icon}</span> {menu.title}
                          </span>
                          <span className="text-xs text-muted-foreground">▼</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-2">
                          {menu.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="block px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border space-y-1">
                    {singleItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-3 py-2 text-sm font-medium hover:bg-accent/80 rounded-md transition-colors text-foreground"
                      >
                        <item.icon size={16} className="mr-2 text-primary" /> {item.label}
                      </Link>
                    ))}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-4 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs group-hover:opacity-90 transition-opacity">
                CP
              </div>
              <h1 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">ระบบจัดตารางเรียน</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
