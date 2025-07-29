"use client"

import * as React from "react"
import Link from "next/link"

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
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/login" className="text-red-500">Sign Out</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <DarkModeToggle />
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </>
    )
}