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

// ใช้ API ที่มีอยู่แล้ว
async function checkCoTeaching(subjectId: number): Promise<boolean> {
    try {
        const response = await fetch(`/api/subject/co-teaching/check?subjectId=${subjectId}`);
        if (response.ok) {
            const data = await response.json();
            return data.planIds && data.planIds.length > 1;
        }
    } catch (error) {
        console.error("Error checking co-teaching:", error);
    }
    return false;
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
            console.log('🗑️ เริ่มการล้างตารางเรียนพร้อมตรวจสอบ Co-Teaching');

            // ดึงข้อมูลตารางเรียนที่มีอยู่
            const timetableResponse = await fetch(`/api/timetable?termYear=${termYear}&yearLevel=${yearLevel}&planType=${planType}`);

            if (!timetableResponse.ok) {
                throw new Error('Failed to fetch timetable data');
            }

            const timetableData = await timetableResponse.json();
            console.log('📊 ข้อมูลตารางเรียนที่ได้:', timetableData);
            console.log('📊 ข้อมูลตารางเรียนที่จะลบ:', timetableData.length);

            if (timetableData.length === 0) {
                console.log('ℹ️ ไม่มีตารางเรียนที่ต้องลบ');

                if (onClearComplete) {
                    onClearComplete();
                }

                setTimeout(() => {
                    window.location.reload();
                }, 500);

                return;
            }

            // ลบทีละรายการพร้อมตรวจสอบ Co-Teaching
            for (const timetable of timetableData) {
                try {
                    // ตรวจสอบโครงสร้างข้อมูล
                    console.log('🔍 ข้อมูลตาราง:', timetable);

                    // หา subjectId จากโครงสร้างข้อมูลที่แตกต่างกัน
                    let subjectId = timetable.subjectId || timetable.planId || timetable.id;

                    // ถ้ายังไม่มี ลองหาจาก nested object
                    if (!subjectId && timetable.plan) {
                        subjectId = timetable.plan.id;
                    }

                    if (!subjectId) {
                        console.error('❌ ไม่พบ subjectId ในข้อมูล:', timetable);
                        continue;
                    }

                    console.log(`🔍 ตรวจสอบ Co-Teaching สำหรับวิชา ID: ${subjectId}`);

                    // ใช้ API ที่มีอยู่แล้วตรวจสอบ Co-Teaching
                    const isCoTeaching = await checkCoTeaching(subjectId);

                    if (isCoTeaching) {
                        console.log(`📚 วิชา ID ${subjectId} เป็น Co-Teaching`);
                    }

                    // ลบด้วย API เดิม (จะจัดการ Co-Teaching อัตโนมัติ)
                    const response = await fetch(`/api/timetable/${subjectId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log(`✅ ลบวิชา ID ${subjectId} สำเร็จ:`, result);
                    } else {
                        console.error(`❌ ลบวิชา ID ${subjectId} ไม่สำเร็จ`);
                    }
                } catch (error) {
                    console.error(`❌ เกิดข้อผิดพลาดในการลบวิชา:`, error);
                }
            }

            console.log('✅ ล้างตารางเรียนทั้งหมดเสร็จสิ้น');

            // ส่วนซิ๊งค์ DVE เหมือนเดิม
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

            if (onClearComplete) {
                onClearComplete();
            }

            setTimeout(() => {
                window.location.reload();
            }, 500);

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
                                    <br />
                                    <span className="text-orange-600 font-medium">
                                        หมายเหตุ: หากมีวิชาสอนร่วม (Co-Teaching) จะถูกลบออกจากแผนการเรียนอื่นๆ ด้วย
                                    </span>
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
                    <p>ล้างวิชาทั้งหมดในตาราง (รวม Co-Teaching)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
