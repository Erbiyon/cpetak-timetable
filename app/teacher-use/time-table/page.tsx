"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimeTablePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div>กำลังโหลด...</div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">ตารางเรียน</h1>
                    <p className="text-gray-600 mt-2">
                        ยินดีต้อนรับ,{" "}
                        <span className="font-semibold text-blue-600">{session.user.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        รหัสประจำตัว: {session.user.teacherId} | ประเภท:{" "}
                        {session.user.teacherType}
                    </p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                    ออกจากระบบ
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ตารางสอนของคุณ</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500 py-8">
                        <p>ตารางเรียนจะแสดงที่นี่</p>
                        <p className="text-sm mt-2">ระบบกำลังในระหว่างการพัฒนา</p>
                    </div>
                </CardContent>
            </Card>

            {/* Debug info */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>ข้อมูล Session (สำหรับ Debug)</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
