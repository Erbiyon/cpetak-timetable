"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { LoaderCircle, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [teacherId, setTeacherId] = useState("")
    const [teacherPassword, setTeacherPassword] = useState("")
    const [adminId, setAdminId] = useState("")
    const [adminPassword, setAdminPassword] = useState("")
    const [error, setError] = useState("")
    const [rememberTeacher, setRememberTeacher] = useState(false) // แยกสำหรับอาจารย์
    const [rememberAdmin, setRememberAdmin] = useState(false)     // แยกสำหรับผู้ดูแล
    const [isClient, setIsClient] = useState(false)
    const [showTeacherPassword, setShowTeacherPassword] = useState(false)
    const [showAdminPassword, setShowAdminPassword] = useState(false)
    const router = useRouter()

    // ตรวจสอบว่าเป็น client-side และโหลดข้อมูลที่จดจำไว้
    useEffect(() => {
        setIsClient(true)

        if (typeof window !== 'undefined') {
            // โหลดข้อมูลที่จดจำของอาจารย์
            const rememberedTeacher = localStorage.getItem("rememberedTeacherId")
            if (rememberedTeacher) {
                setTeacherId(rememberedTeacher)
                setRememberTeacher(true)
            }

            // โหลดข้อมูลที่จดจำของผู้ดูแล
            const rememberedAdmin = localStorage.getItem("rememberedAdminId")
            if (rememberedAdmin) {
                setAdminId(rememberedAdmin)
                setRememberAdmin(true)
            }
        }
    }, [])

    const handleTeacherLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("teacher-login", {
                teacherId: teacherId,
                password: teacherPassword,
                redirect: false,
            })

            if (result?.error) {
                setError("รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง")
            } else {
                // บันทึกการจดจำสำหรับอาจารย์ (เฉพาะ client-side)
                if (isClient && typeof window !== 'undefined') {
                    if (rememberTeacher) {
                        localStorage.setItem("rememberedTeacherId", teacherId)
                    } else {
                        localStorage.removeItem("rememberedTeacherId")
                    }
                }

                router.push("/teacher-use/time-table")
            }
        } catch (error) {
            console.error("Login failed:", error)
            setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("admin-login", {
                adminId: adminId,
                password: adminPassword,
                redirect: false,
            })

            if (result?.error) {
                setError("รหัสผู้ดูแลหรือรหัสผ่านไม่ถูกต้อง")
            } else {
                // บันทึกการจดจำสำหรับผู้ดูแล (เฉพาะ client-side)
                if (isClient && typeof window !== 'undefined') {
                    if (rememberAdmin) {
                        localStorage.setItem("rememberedAdminId", adminId)
                    } else {
                        localStorage.removeItem("rememberedAdminId")
                    }
                }

                router.push("/study-plans/transfer-plan")
            }
        } catch (error) {
            console.error("Admin login failed:", error)
            setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        } finally {
            setIsLoading(false)
        }
    }

    // แสดง loading หรือ blank จนกว่าจะโหลด client-side เสร็จ
    if (!isClient) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div><LoaderCircle className="animate-spin mx-auto" /></div>
                    <p className="mt-2 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md mx-auto">
                {/* Logo หรือชื่อระบบ */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                        ระบบจัดตารางเรียน
                    </h1>
                    <p className="text-sm sm:text-base text-white">
                        สาขาวิศวกรรมคอมพิวเตอร์
                    </p>
                </div>

                <Tabs defaultValue="teacher-login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="teacher-login" className="text-xs sm:text-sm">อาจารย์</TabsTrigger>
                        <TabsTrigger value="admin-login" className="text-xs sm:text-sm">ผู้ดูแลระบบ</TabsTrigger>
                    </TabsList>

                    <TabsContent value="teacher-login">
                        <Card className="shadow-lg border-0">
                            <form onSubmit={handleTeacherLogin}>
                                <CardHeader className="space-y-1 pb-4">
                                    <CardTitle className="text-lg sm:text-xl">เข้าสู่ระบบสำหรับอาจารย์</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        ใช้รหัสประจำตัวอาจารย์เป็นทั้ง username และ password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 sm:px-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="teacher-id" className="text-sm font-medium">รหัสประจำตัวอาจารย์</Label>
                                        <Input
                                            id="teacher-id"
                                            type="text"
                                            placeholder="กรอกรหัสประจำตัวอาจารย์"
                                            value={teacherId}
                                            onChange={(e) => setTeacherId(e.target.value)}
                                            className="h-10 sm:h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="teacher-password" className="text-sm font-medium">รหัสผ่าน</Label>
                                        <div className="relative">
                                            <Input
                                                id="teacher-password"
                                                type={showTeacherPassword ? "text" : "password"}
                                                placeholder="กรอกรหัสประจำตัวอาจารย์"
                                                value={teacherPassword}
                                                onChange={(e) => setTeacherPassword(e.target.value)}
                                                className="h-10 sm:h-11 pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-10 sm:h-11 px-3 hover:bg-transparent"
                                                onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                                            >
                                                {showTeacherPassword ? (
                                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500">
                                            <span className="text-red-500">*</span> รหัสผ่านคือรหัสประจำตัวอาจารย์เดียวกัน
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 py-2">
                                        <Checkbox
                                            id="remember-teacher"
                                            checked={rememberTeacher}
                                            onCheckedChange={(checked) => setRememberTeacher(checked as boolean)}
                                        />
                                        <Label
                                            htmlFor="remember-teacher"
                                            className="text-xs sm:text-sm cursor-pointer select-none"
                                        >
                                            จดจำรหัสประจำตัว
                                        </Label>
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-3 rounded-md border border-red-200">
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="px-4 sm:px-6 pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-10 sm:h-11"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                กำลังเข้าสู่ระบบ...
                                            </>
                                        ) : (
                                            "เข้าสู่ระบบ"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="admin-login">
                        <Card className="shadow-lg border-0">
                            <form onSubmit={handleAdminLogin}>
                                <CardHeader className="space-y-1 pb-4">
                                    <CardTitle className="text-lg sm:text-xl">เข้าสู่ระบบสำหรับผู้ดูแลระบบ</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        เข้าสู่ระบบเพื่อจัดการระบบ
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 sm:px-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="admin-id" className="text-sm font-medium">รหัสผู้ดูแล</Label>
                                        <Input
                                            id="admin-id"
                                            placeholder="กรอกรหัสผู้ดูแล"
                                            value={adminId}
                                            onChange={(e) => setAdminId(e.target.value)}
                                            className="h-10 sm:h-11"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="admin-password" className="text-sm font-medium">รหัสผ่าน</Label>
                                        <div className="relative">
                                            <Input
                                                id="admin-password"
                                                type={showAdminPassword ? "text" : "password"}
                                                placeholder="กรอกรหัสผ่าน"
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                className="h-10 sm:h-11 pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-10 sm:h-11 px-3 hover:bg-transparent"
                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                            >
                                                {showAdminPassword ? (
                                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 py-2">
                                        <Checkbox
                                            id="remember-admin"
                                            checked={rememberAdmin}
                                            onCheckedChange={(checked) => setRememberAdmin(checked as boolean)}
                                        />
                                        <Label
                                            htmlFor="remember-admin"
                                            className="text-xs sm:text-sm cursor-pointer select-none"
                                        >
                                            จดจำรหัสผู้ดูแล
                                        </Label>
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-3 rounded-md border border-red-200">
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="px-4 sm:px-6 pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-10 sm:h-11"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                กำลังเข้าสู่ระบบ...
                                            </>
                                        ) : (
                                            "เข้าสู่ระบบ"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="text-center mt-6 sm:mt-8">
                    <p className="text-xs sm:text-sm text-gray-500">
                        © 2025 ระบบจัดตารางเรียน สาขาวิศวกรรมคอมพิวเตอร์
                    </p>
                </div>
            </div>
        </div>
    )
}