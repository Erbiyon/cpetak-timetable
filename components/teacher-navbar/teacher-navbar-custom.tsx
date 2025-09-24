"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { DarkModeToggle } from "../theme-provider/dark-mode"
import { CircleUser, LogOut, Menu } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function TeacherNavbarCustom() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" })
    }

    return (
        <>
            <div className="sticky top-0 left-0 w-full z-50 bg-card border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>เมนู</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col space-y-4 mt-6">

                                    <div className="px-3 py-2 border-b border-border">
                                        <div className="font-medium text-foreground flex items-center">
                                            <CircleUser className="mr-2 h-4 w-4" />
                                            {session?.user?.name || "ไม่ระบุชื่อ"}
                                        </div>
                                        <div className="text-xs text-muted-foreground ml-6">
                                            รหัส: {session?.user?.teacherId || "ไม่ระบุ"}
                                        </div>
                                        <div className="text-xs text-muted-foreground ml-6">
                                            ประเภท: {session?.user?.teacherType || "ไม่ระบุ"}
                                        </div>
                                    </div>


                                    <Link
                                        href="/teacher-use/time-table"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
                                    >
                                        ตารางสอน
                                    </Link>

                                    <Link
                                        href="/teacher-use/request-room"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
                                    >
                                        คำขอใช้ห้อง
                                    </Link>


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
                        <h1 className="text-lg font-semibold">ระบบอาจารย์</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <DarkModeToggle />
                    </div>
                </div>
            </div>
        </>
    )
}