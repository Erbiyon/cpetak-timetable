import { Eraser } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Loader2 } from "lucide-react";

interface ClearButtonSubjectProps {
    termYear?: string;
    yearLevel?: string;
    planType?: string;
    onClearComplete?: () => void;
}

export default function ClearButtonSubject({
    termYear = "",
    yearLevel = "",
    planType = "",
    onClearComplete
}: ClearButtonSubjectProps) {
    const [isClearing, setIsClearing] = useState(false);

    const handleClearSubjects = async () => {
        setIsClearing(true);
        try {
            console.log('🗑️ เริ่มการล้างตารางเรียน');

            // Call the API to delete all assignments for the current filter
            const response = await fetch('/api/timetable/clear', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    termYear: termYear || '1',
                    yearLevel: yearLevel || 'ปี 1',
                    planType: planType || 'TRANSFER',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to clear timetable');
            }

            console.log(`✅ ล้างตาราง ${planType} สำเร็จ`);

            // ซิ๊งค์การล้างไปยังอีกหลักสูตรสำหรับ DVE planTypes
            const isDVEPlan = planType === "DVE-MSIX" || planType === "DVE-LVC";
            if (isDVEPlan) {
                const targetPlanType = planType === "DVE-MSIX" ? "DVE-LVC" : "DVE-MSIX";

                try {
                    console.log(`🔄 ซิ๊งค์การล้างไปยัง ${targetPlanType}`);

                    const syncResponse = await fetch('/api/timetable/clear', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            termYear: termYear || '1',
                            yearLevel: yearLevel || 'ปี 1',
                            planType: targetPlanType,
                        }),
                    });

                    if (syncResponse.ok) {
                        console.log(`✅ ซิ๊งค์การล้างไปยัง ${targetPlanType} สำเร็จ`);
                    } else {
                        console.log(`⚠️ ซิ๊งค์การล้างไปยัง ${targetPlanType} ไม่สำเร็จ:`, await syncResponse.text());
                    }
                } catch (syncError) {
                    console.log(`⚠️ เกิดข้อผิดพลาดในการซิ๊งค์การล้าง:`, syncError);
                }
            }

            // Call the callback to update UI after clearing
            if (onClearComplete) {
                onClearComplete();
            }

            // Force refresh หน้าเว็บหลังจาก clear สำเร็จ
            setTimeout(() => {
                window.location.reload();
            }, 500); // หน่วงเวลา 500ms เพื่อให้ UI อัปเดตก่อน

        } catch (error) {
            console.error("Error clearing timetable:", error);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500 hover:border-transparent gap-2"
                                disabled={isClearing}
                            >
                                {isClearing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Eraser className="h-4 w-4" />
                                )}
                                ล้างวิชา
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการล้างข้อมูลทั้งหมด</AlertDialogTitle>
                                <AlertDialogDescription>
                                    คุณต้องการล้างวิชาทั้งหมดในตารางนี้หรือไม่?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearSubjects}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    ยืนยัน
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TooltipTrigger>
                <TooltipContent>
                    <p>ล้างวิชาทั้งหมดในตาราง</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
