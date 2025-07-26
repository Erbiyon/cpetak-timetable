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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async () => {
        setIsLoading(true)
        try {
            // จำลองการ login (แทนที่ด้วย API call จริง)
            await new Promise(resolve => setTimeout(resolve, 1000))

            // redirect ไปหน้าหลักหลังจาก login สำเร็จ
            router.push("/")
        } catch (error) {
            console.error("Login failed:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md">
                {/* Logo หรือชื่อระบบ */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        ระบบจัดตารางเรียน
                    </h1>
                    <p>
                        สาขาวิศวกรรมคอมพิวเตอร์
                    </p>
                </div>

                <Tabs defaultValue="teacher-login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="teacher-login">อาจารย์</TabsTrigger>
                        <TabsTrigger value="admin-login">ผู้ดูแลระบบ</TabsTrigger>
                    </TabsList>

                    <TabsContent value="teacher-login">
                        <Card>
                            <CardHeader>
                                <CardTitle>เข้าสู่ระบบสำหรับอาจารย์</CardTitle>
                                <CardDescription>
                                    กรอกข้อมูลเพื่อเข้าสู่ระบบจัดตารางเรียน
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="user-id">รหัสประจำตัวอาจารย์</Label>
                                    <Input
                                        id="user-id"
                                        type="text"
                                        placeholder="กรอกรหัสประจำตัวอาจารย์"
                                        required
                                    />
                                    <div className="text-sm text-gray-500">
                                        <span className="text-red-500">*</span> รหัสประจำตัวอาจารย์จะถูกสร้างโดยระบบ
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="id-password">รหัสผ่าน</Label>
                                    <Input
                                        id="id-password"
                                        type="password"
                                        placeholder="กรอกรหัสผ่าน"
                                        required
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="rounded"
                                    />
                                    <Label htmlFor="remember" className="text-sm">
                                        จดจำการเข้าสู่ระบบ
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    className="w-full"
                                >
                                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="admin-login">
                        <Card>
                            <CardHeader>
                                <CardTitle>เข้าสู่ระบบสำหรับผู้ดูแลระบบ</CardTitle>
                                <CardDescription>
                                    เข้าสู่ระบบเพื่อจัดการระบบ
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="admin-id">กรอกรหัสประจำตัว</Label>
                                    <Input
                                        id="admin-id"
                                        placeholder="กรอกรหัสประจำตัว"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="admin-password">รหัสผ่าน</Label>
                                    <Input
                                        id="admin-password"
                                        type="password"
                                        placeholder="กรอกรหัสผ่าน"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© 2025 ระบบจัดตารางเรียน สาขาวิศวกรรมคอมพิวเตอร์</p>
                </div>
            </div>
        </div>
    )
}