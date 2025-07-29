"use client"

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
import { CircleUser } from "lucide-react"

export function TeacherNavbarCustom() {
    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/teacher-use/time-table">ตารางสอน</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/teacher-use/request-room">คำขอใช้ห้อง</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger><CircleUser /></NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[100px] gap-4">
                            <li>
                                <NavigationMenuLink asChild>
                                    <p className="disabled">[User Profile]</p>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link href="/login" className="text-red-500">Sign Out</Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}