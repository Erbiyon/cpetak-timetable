"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Calendar,
  CircleUser,
  LogOut,
  Menu,
  School,
  SquareUser,
  Table,
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  BookOpenText,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DarkModeToggle } from "../theme-provider/dark-mode";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

  // หมวดหมู่เมนูแบบพับเก็บได้ (Collapsible Menus)
  const menuCategories = [
    {
      title: "แผนการเรียน",
      icon: <GraduationCap size={16} className="text-zinc-500 dark:text-zinc-400" />,
      items: [
        { href: "/study-plans/transfer-plan", label: "หลักสูตรเทียบโอน (3 ปี)" },
        { href: "/study-plans/four-year-plan", label: "หลักสูตร 4 ปี" },
        { href: "/study-plans/dve-lvc-plan", label: "หลักสูตร ปวส. (ปวช.)" },
        { href: "/study-plans/dve-msix-plan", label: "หลักสูตร ปวส. (ม.6)" },
      ],
    },
    {
      title: "จัดการตารางเรียน",
      icon: <Table size={16} className="text-zinc-500 dark:text-zinc-400" />,
      subCategories: [
        {
          name: "หลักสูตรเทียบโอน (3 ปี)",
          dotColor: "bg-sky-500",
          items: [
            { href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year", label: "ชั้นปีที่ 1" },
            { href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year", label: "ชั้นปีที่ 2" },
            ...(isTerm3
              ? []
              : [{ href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year", label: "ชั้นปีที่ 3" }]),
          ],
        },
        ...(isTerm3
          ? []
          : [
              {
                name: "หลักสูตร 4 ปี",
                dotColor: "bg-indigo-500",
                items: [
                  { href: "/adjust-time-tables/adjust-plan-four-year/four-one-year", label: "ชั้นปีที่ 1" },
                  { href: "/adjust-time-tables/adjust-plan-four-year/four-two-year", label: "ชั้นปีที่ 2" },
                  { href: "/adjust-time-tables/adjust-plan-four-year/four-three-year", label: "ชั้นปีที่ 3" },
                  { href: "/adjust-time-tables/adjust-plan-four-year/four-four-year", label: "ชั้นปีที่ 4" },
                ],
              },
            ]),
        {
          name: "หลักสูตร ปวส. (ปวช.)",
          dotColor: "bg-amber-500",
          items: [
            { href: "/adjust-time-tables/adjust-plan-dve/dve-one-year", label: "ชั้นปีที่ 1" },
            { href: "/adjust-time-tables/adjust-plan-dve/dve-two-year", label: "ชั้นปีที่ 2" },
          ],
        },
        {
          name: "หลักสูตร ปวส. (ม.6)",
          dotColor: "bg-emerald-500",
          items: [
            { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year", label: "ชั้นปีที่ 1" },
            { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year", label: "ชั้นปีที่ 2" },
          ],
        },
      ],
    },
    {
      title: "จัดการข้อมูลอาจารย์",
      icon: <SquareUser size={16} className="text-zinc-500 dark:text-zinc-400" />,
      items: [
        { href: "/teachers", label: "รายชื่ออาจารย์ผู้สอน" },
        { href: "/teachers/in-teacher", label: "เพิ่มอาจารย์ภายในสาขา" },
        { href: "/teachers/out-teacher", label: "เพิ่มอาจารย์ภายนอกสาขา" },
      ],
    },
    {
      title: "จัดการห้องเรียน",
      icon: <School size={16} className="text-zinc-500 dark:text-zinc-400" />,
      items: [
        { href: "/rooms", label: "รายชื่อห้องเรียน" },
        { href: "/rooms/room-out", label: "เพิ่มห้องเรียนวิชานอกสาขา" },
      ],
    },
  ];

  // เมนูดำเนินงานหลัก (ตรงกับ Dashboard)
  const operationalLinks = [
    { href: "/dashboard", label: "ภาพรวมงานวิชาการ", icon: LayoutDashboard },
    { href: "/rooms-use", label: "ตารางการใช้ห้องเรียน", icon: Building2 },
    { href: "/class-schedule", label: "ตารางสอนอาจารย์", icon: CalendarCheck2 },
    { href: "/curriculum", label: "โครงสร้างหลักสูตร", icon: BookOpenText },
    { href: "/academic-calendar", label: "ปฏิทินการศึกษา", icon: Calendar },
  ];

  return (
    <>
      {/* Edge-to-Edge Full-Width Top Navbar */}
      <div className="sticky top-0 left-0 w-full z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-xs px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-border hover:bg-secondary cursor-pointer"
                  aria-label="เปิดเมนูหลัก"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto p-4 border-r border-border bg-card">
                <SheetHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      CP
                    </div>
                    <div>
                      <SheetTitle className="text-base font-semibold leading-none font-sans">ระบบจัดตารางเรียน</SheetTitle>
                      <span className="text-xs text-muted-foreground font-sans">สาขาวิศวกรรมคอมพิวเตอร์</span>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex flex-col space-y-4 mt-4">
                  {/* User Profile Card */}
                  <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                    <div className="font-medium text-foreground flex items-center justify-between text-sm font-sans">
                      <div className="flex items-center gap-2">
                        <CircleUser className="h-4 w-4 text-foreground" />
                        <span>{session?.user?.name || "ผู้ดูแลระบบ"}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal border-border bg-card">
                        {session?.user?.role === "admin" ? "ผู้ดูแลระบบ" : "อาจารย์"}
                      </Badge>
                    </div>
                  </div>

                  {/* Operational Shortcuts */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 font-sans">
                      เมนูดำเนินงาน
                    </div>
                    {operationalLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-3 py-2 text-xs font-medium hover:bg-secondary rounded-md transition-colors text-foreground font-sans group"
                      >
                        <item.icon size={15} className="mr-2.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Collapsible Sections */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 font-sans">
                      การจัดการระบบ
                    </div>

                    {menuCategories.map((menu) => (
                      <Collapsible key={menu.title}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-secondary rounded-md transition-colors cursor-pointer group">
                          <span className="text-xs font-medium flex items-center gap-2.5 text-foreground font-sans">
                            {menu.icon}
                            <span>{menu.title}</span>
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2.5">
                          {menu.subCategories ? (
                            menu.subCategories.map((sub) => (
                              <div key={sub.name} className="py-1">
                                <div className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1.5 px-2 py-0.5 font-sans">
                                  <span className={`h-1.5 w-1.5 rounded-full ${sub.dotColor}`} />
                                  <span>{sub.name}</span>
                                </div>
                                <div className="ml-2 mt-0.5 space-y-0.5">
                                  {sub.items.map((subItem) => (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      onClick={() => setIsOpen(false)}
                                      className="block px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md transition-colors font-sans"
                                    >
                                      {subItem.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            menu.items?.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md transition-colors font-sans"
                              >
                                {item.label}
                              </Link>
                            ))
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer font-sans"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs group-hover:opacity-90 transition-opacity">
                CP
              </div>
              <h1 className="text-base font-semibold tracking-tight text-foreground group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors font-sans">
                ระบบจัดตารางเรียน
              </h1>
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
