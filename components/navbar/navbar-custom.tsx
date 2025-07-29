"use client"

import * as React from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { CircleUser, LogOut } from "lucide-react"

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

export function NavigationMenuCustom() {
    const { data: session } = useSession()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    return (
        <>
            <NavigationMenu viewport={false} className="sticky mx-auto py-4 top-0 left-0 w-screen z-50 shadow-background bg-card border p-2 rounded-b-xl">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <div>
                            <NavigationMenuTrigger className="bg-card">แผนการเรียน</NavigationMenuTrigger>
                            <NavigationMenuContent className="z-50">
                                <ul className="grid w-[200px] gap-4">
                                    <li>
                                        <NavigationMenuLink asChild>
                                            <Link href="/study-plans/transfer-plan">แผนการเรียน เทียบโอน</Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/study-plans/four-year-plan">แผนการเรียน 4 ปี</Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/study-plans/dve-lvc-plan">แผนการเรียน ปวช ขึ้น ปวส.</Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/study-plans/dve-msix-plan">แผนการเรียน ม.6 ขึ้น ปวส.</Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </NavigationMenuContent>
                        </div>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/rooms">ห้องเรียน</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/teachers">อาจารย์</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-card">จัดตารางเรียน เทียบโอน</NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                            <ul className="grid w-[200px] gap-4">
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-transfer/transfer-one-year">จัดตารางเรียน ปี 1</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-transfer/transfer-two-year">จัดตารางเรียน ปี 2</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-transfer/transfer-three-year">จัดตารางเรียน ปี 3</Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-card">จัดตารางเรียน 4 ปี</NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                            <ul className="grid w-[200px] gap-4">
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-four-year/four-one-year">จัดตารางเรียน ปี 1</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-four-year/four-two-year">จัดตารางเรียน ปี 2</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-four-year/four-three-year">จัดตารางเรียน ปี 3</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-four-year/four-four-year">จัดตารางเรียน ปี 4</Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-card">จัดตารางเรียน ปวส.</NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                            <ul className="grid w-[200px] gap-4">
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-dve/dve-one-year">ปวช. ขึ้น ปวส. ปี 1</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-dve/dve-two-year">ปวช. ขึ้น ปวส. ปี 2</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-dve/dve-ms-one-year">ม.6 ขึ้น ปวส. ปี 1</Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/adjust-time-tables/adjust-plan-dve/dve-ms-two-year">ม.6 ขึ้น ปวส. ปี 2</Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/class-schedule">ตารางสอน</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/rooms-use">การใช้ห้อง</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/academic-calendar">ปฏิทินการศึกษา</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    {/* เมนูผู้ใช้ */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-card">
                            <CircleUser className="mr-2 h-4 w-4" />
                            {session?.user?.name || "ผู้ดูแลระบบ"}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                            <ul className="grid w-[250px] gap-2 p-2">
                                <li>
                                    <div className="px-3 py-2 text-sm border-b border-border">
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
                                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
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
        </>
    )
}