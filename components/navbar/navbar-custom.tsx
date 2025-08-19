"use client"

import * as React from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Calendar, CircleUser, Grid2x2Check, House, LogOut, Menu, NotebookPen, School, SquareUser, Table } from "lucide-react"
import { useState } from "react"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { DarkModeToggle } from "../theme-provider/dark-mode"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function NavigationMenuCustom() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    const menuItems = [
        {
            title: "แผนการเรียน",
            icon: <NotebookPen size={16} className="mr-2" />,
            items: [
                { href: "/study-plans/transfer-plan", label: "แผนการเรียน เทียบโอน" },
                { href: "/study-plans/four-year-plan", label: "แผนการเรียน 4 ปี" },
                { href: "/study-plans/dve-lvc-plan", label: "แผนการเรียน ปวช ขึ้น ปวส." },
                { href: "/study-plans/dve-msix-plan", label: "แผนการเรียน ม.6 ขึ้น ปวส." },
            ]
        },
        {
            title: "ห้องเรียน",
            icon: <School size={16} className="mr-2" />,
            items: [
                { href: "/rooms", label: "จัดการห้องเรียน" },
                { href: "/rooms/room-out", label: "เพิ่มห้องเรียนวิชานอกสาขา" }
            ]
        },
        {
            title: "อาจารย์",
            icon: <SquareUser size={16} className="mr-2" />,
            items: [
                { href: "/teachers", label: "จัดการรายชื่ออาจารย์" },
                { href: "/teachers/in-teacher", label: "เพิ่มอาจารย์วิชาภายในสาขา" },
                { href: "/teachers/out-teacher", label: "เพิ่มอาจารย์วิชาภายนอกสาขา" },
            ]
        },
        {
            title: "จัดตารางเรียน เทียบโอน",
            icon: <Table size={16} color="#0000ff" className="mr-2" />,
            items: [
                { href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year", label: "จัดตารางเรียน ปี 1" },
                { href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year", label: "จัดตารางเรียน ปี 2" },
                { href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year", label: "จัดตารางเรียน ปี 3" },
            ]
        },
        {
            title: "จัดตารางเรียน 4 ปี",
            icon: <Table size={16} color="#00ff40" className="mr-2" />,
            items: [
                { href: "/adjust-time-tables/adjust-plan-four-year/four-one-year", label: "จัดตารางเรียน ปี 1" },
                { href: "/adjust-time-tables/adjust-plan-four-year/four-two-year", label: "จัดตารางเรียน ปี 2" },
                { href: "/adjust-time-tables/adjust-plan-four-year/four-three-year", label: "จัดตารางเรียน ปี 3" },
                { href: "/adjust-time-tables/adjust-plan-four-year/four-four-year", label: "จัดตารางเรียน ปี 4" },
            ]
        },
        {
            title: "จัดตารางเรียน ปวส.",
            icon: <Table size={16} color="#ff8000" className="mr-2" />,
            items: [
                { href: "/adjust-time-tables/adjust-plan-dve/dve-one-year", label: "ปวช. ขึ้น ปวส. ปี 1" },
                { href: "/adjust-time-tables/adjust-plan-dve/dve-two-year", label: "ปวช. ขึ้น ปวส. ปี 2" },
                { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year", label: "ม.6 ขึ้น ปวส. ปี 1" },
                { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year", label: "ม.6 ขึ้น ปวส. ปี 2" },
            ]
        }
    ]

    const singleItems = [
        { href: "/class-schedule", label: "ตารางสอน", icon: Grid2x2Check },
        { href: "/rooms-use", label: "การใช้ห้อง", icon: House },
        { href: "/academic-calendar", label: "ปฏิทินการศึกษา", icon: Calendar },
    ]

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden lg:block sticky top-0 left-0 w-full z-50">
                <NavigationMenu viewport={false} className="sticky mx-auto py-4 top-0 left-0 w-screen z-50 shadow-background bg-card border p-2 rounded-b-xl">
                    <NavigationMenuList className="flex-wrap">
                        {/* แผนการเรียน */}
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-card text-xs xl:text-sm"><NotebookPen size={16} className="mr-2" /> แผนการเรียน</NavigationMenuTrigger>
                            <NavigationMenuContent className="z-50">
                                <ul className="grid w-[200px] xl:w-[250px] gap-2 p-2">
                                    {menuItems[0].items.map((item) => (
                                        <li key={item.href}>
                                            <NavigationMenuLink asChild>
                                                <Link href={item.href} className="block px-3 py-2 text-xs xl:text-sm hover:bg-accent rounded-md">
                                                    {item.label}
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        {/* จัดตารางเรียน menus */}
                        {menuItems.slice(1).map((menu) => (
                            <NavigationMenuItem key={menu.title}>
                                <NavigationMenuTrigger className="bg-card text-xs xl:text-sm">{menu.icon} {menu.title}</NavigationMenuTrigger>
                                <NavigationMenuContent className="z-50">
                                    <ul className="grid w-[200px] xl:w-[250px] gap-2 p-2">
                                        {menu.items.map((item) => (
                                            <li key={item.href}>
                                                <NavigationMenuLink asChild>
                                                    <Link href={item.href} className="block px-3 py-2 text-xs xl:text-sm hover:bg-accent rounded-md">
                                                        {item.label}
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        ))}

                        {/* Single Items */}
                        {singleItems.slice(0, 2).map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card text-xs xl:text-sm`}>
                                    <Link href={item.href}>{item.label}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}

                        {/* Remaining Single Items */}
                        {singleItems.slice(2).map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card text-xs xl:text-sm`}>
                                    <Link href={item.href}>{item.label}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}

                        {/* User Menu */}
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-card text-xs xl:text-sm">
                                <CircleUser className="mr-2 h-4 w-4" />
                                <span className="hidden xl:inline">{session?.user?.name || "ผู้ดูแลระบบ"}</span>
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="z-50">
                                <ul className="grid w-[180px] xl:w-[180px] gap-2 p-2">
                                    <li>
                                        <div className="px-3 py-2 text-xs xl:text-sm border-b border-border">
                                            <div className="font-medium text-foreground">
                                                {session?.user?.name || "ผู้ดูแลระบบ"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {session?.user?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <NavigationMenuLink asChild>
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center w-full px-3 py-2 text-xs xl:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                ออกจากระบบ
                                            </button>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        {/* Dark Mode Toggle */}
                        <NavigationMenuItem>
                            <DarkModeToggle />
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden sticky top-0 left-0 w-full z-50 bg-card border-b p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">ระบบตารางเรียน</h1>
                    <div className="flex items-center gap-2">
                        <DarkModeToggle />
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>เมนู</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col space-y-4 mt-6">
                                    {/* User Info */}
                                    <div className="px-3 py-2 border-b border-border">
                                        <div className="font-medium text-foreground flex items-center">
                                            <CircleUser className="mr-2 h-4 w-4" />
                                            {session?.user?.name || "ผู้ดูแลระบบ"}
                                        </div>
                                        <div className="text-xs text-muted-foreground ml-6">
                                            {session?.user?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}
                                        </div>
                                    </div>

                                    {/* Menu Items with Submenu */}
                                    {menuItems.map((menu) => (
                                        <Collapsible key={menu.title}>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-accent rounded-md">
                                                <span className="text-sm font-medium flex"><span>{menu.icon}</span> {menu.title}</span>
                                                <span className="text-xs">▼</span>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="ml-4 mt-2 space-y-1">
                                                {menu.items.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className="block px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}

                                    {/* Single Items */}
                                    {singleItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
                                        >
                                            <item.icon size={16} className="mr-2" /> {item.label}
                                        </Link>
                                    ))}

                                    {/* Sign Out */}
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors mt-4"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </>
    )
}