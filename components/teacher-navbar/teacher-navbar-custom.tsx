"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
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
import { CircleUser, LogOut } from "lucide-react"

export function TeacherNavbarCustom() {
    const { data: session } = useSession()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    return (
        <>
            <NavigationMenu viewport={false} className="sticky mx-auto py-4 top-0 left-0 w-screen z-50 shadow-background bg-card border p-2 rounded-b-xl">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/teacher-use/time-table">ตารางสอนของฉัน</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-card`}>
                            <Link href="/teacher-use/request-room">คำขอใช้ห้อง</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    {/* เมนูผู้ใช้ */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-card">
                            <CircleUser className="mr-2 h-4 w-4" />
                            {session?.user?.name || "ผู้ใช้"}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="z-50">
                            <ul className="grid w-[250px] gap-2 p-2">
                                <li>
                                    <div className="px-3 py-2 text-sm border-b border-border">
                                        <div className="font-medium text-foreground">
                                            {session?.user?.name || "ไม่ระบุชื่อ"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            รหัส: {session?.user?.teacherId || "ไม่ระบุ"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ประเภท: {session?.user?.teacherType || "ไม่ระบุ"}
                                        </div>
                                    </div>
                                </li>
                                <li>
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