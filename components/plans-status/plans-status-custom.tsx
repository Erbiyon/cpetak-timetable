import { useDraggable } from "@dnd-kit/core";
import { PlusCircle, TriangleAlert, Wand } from "lucide-react"; // เพิ่ม import ไอคอน Scissors
import CutButton from "../cut-add-button/cut-button";
import AddSubDetail from "../cut-add-button/add-sub-detail";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { ConflictDetails } from "../conflict-details/conflict-details";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import AutoTimetableButton from "../auto-timetable-button/page";
import ClearButtonSubject from "../clear-button-subject/page";

type SplitData = {
    part1: { lectureHour: number; labHour: number; partNumber: number };
    part2: { lectureHour: number; labHour: number; partNumber: number };
};

type ConflictType = {
    type: string;
    message: string;
    conflicts?: any[];
    maxConsecutive?: number;
};

// เพิ่ม prop ใหม่ใน interface
interface PlansStatusCustomProps {
    termYear: string;
    yearLevel?: string;
    planType?: string;
    plans?: any[];
    assignments?: { [subjectId: number]: any };
    assignedCount?: number;
    onRemoveAssignment?: ((subjectId: number) => void | null | Promise<void>) | undefined;
    onSplitSubject?: (subjectId: number, splitData: SplitData) => void;
    onMergeSubject?: (subjectId: number) => void;
    conflicts?: Array<{
        type: string;
        message: string;
        conflicts?: any[];
        maxConsecutive?: number;
        mainSubject?: any;
    }>;
    onSubjectUpdate?: () => void;
    // เพิ่ม props สำหรับ drag feedback
    dragFailedSubjectId?: number | null;
    onDragFailedReset?: () => void;
}

export default function PlansStatusCustom({
    termYear,
    yearLevel = "",
    planType = "",
    plans = [],
    assignments = {},
    assignedCount = 0,
    onRemoveAssignment = undefined,
    onSplitSubject,
    onMergeSubject,
    conflicts = [],
    onSubjectUpdate,
    dragFailedSubjectId = null,
    onDragFailedReset,
}: PlansStatusCustomProps) {
    // เพิ่ม state สำหรับแสดง conflict popup
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    // เพิ่ม state เพื่อเก็บ conflicts ล่าสุดที่แสดงแล้ว
    const [lastShownConflicts, setLastShownConflicts] = useState<any[]>([]);
    // เพิ่ม ref เพื่อติดตาม timestamp ของ conflicts ล่าสุด
    const [lastConflictTimestamp, setLastConflictTimestamp] = useState<number>(0);

    // เพิ่ม log เพื่อดูค่าที่ได้รับ
    console.log("PlansStatusCustom received:", { termYear, yearLevel, planType, plansCount: plans.length });

    // กรองวิชาเฉพาะ termYear, yearLevel, planType ที่กำหนด
    // เพิ่มความยืดหยุ่นในการกรองข้อมูล
    const filteredPlans = plans.filter(plan => {
        // ตรวจสอบค่า termYear, yearLevel, planType
        console.log(`วิชา ${plan.subjectCode}: termYear=${plan.termYear}, yearLevel=${plan.yearLevel}, planType=${plan.planType}`);

        // เงื่อนไขการกรองแบบยืดหยุ่น
        // ถ้า yearLevel หรือ planType ว่าง ให้ถือว่าผ่านเงื่อนไข
        const termMatch = plan.termYear && plan.termYear.includes(termYear);
        const yearMatch = !yearLevel || (plan.yearLevel && plan.yearLevel.includes(yearLevel));
        const typeMatch = !planType || (plan.planType && plan.planType.includes(planType));

        return termMatch && yearMatch && typeMatch;
    });

    // แสดงจำนวนวิชาที่ผ่านการกรอง
    console.log(`จำนวนวิชาหลังกรอง: ${filteredPlans.length}`);

    // กรองเฉพาะวิชาที่ยังไม่ได้จัดลงตาราง
    const unassignedPlans = filteredPlans.filter(plan => !assignments[plan.id]);

    // แก้ไข useEffect สำหรับการแสดง conflict popup
    useEffect(() => {
        const currentTime = Date.now();

        if (conflicts && conflicts.length > 0) {
            // ตรวจสอบว่ามี conflicts ใหม่หรือไม่ โดยใช้ timestamp
            if (currentTime > lastConflictTimestamp + 1000) { // ให้แสดงใหม่ได้หลังจาก 1 วินาที
                setShowConflictDialog(true);
                setLastShownConflicts([...conflicts]);
                setLastConflictTimestamp(currentTime);
            }
        } else {
            // ถ้าไม่มี conflicts แล้ว ให้รีเซ็ต state ทันที
            setShowConflictDialog(false);
            setLastShownConflicts([]);
            // ไม่ต้องอัปเดต timestamp เมื่อ conflicts หายไป
        }
    }, [conflicts]);

    // เพิ่มฟังก์ชันสำหรับปิด dialog
    const handleCloseConflictDialog = () => {
        setShowConflictDialog(false);
        // อัปเดต timestamp เพื่อป้องกันการแสดงซ้ำทันที
        setLastConflictTimestamp(Date.now());
    };

    // Reset drag failed state หลังจากแสดง feedback
    useEffect(() => {
        if (dragFailedSubjectId && onDragFailedReset) {
            const timer = setTimeout(() => {
                onDragFailedReset();
            }, 1000); // แสดง feedback 1 วินาที

            return () => clearTimeout(timer);
        }
    }, [dragFailedSubjectId, onDragFailedReset]);

    // แสดง UI เมื่อไม่มีข้อมูล
    if (filteredPlans.length === 0) {
        return (
            <div className="flex gap-4 mx-auto my-5 max-w-7xl">
                <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold">
                            แผนการเรียน {planType === 'TRANSFER' ? 'เทียบโอน' : planType} {yearLevel} ภาคเรียนที่ {termYear}
                        </div>
                    </div>
                    <div className="rounded-xl border shadow-sm py-8 px-4 overflow-visible">
                        <div className="text-center text-muted-foreground">
                            ไม่พบข้อมูลรายวิชาที่ตรงตามเงื่อนไข
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // แอดแอปเตอร์สำหรับฟังก์ชัน onSplitSubject
    const handleSplitSubjectAdapter = (
        subjectId: number,
        splitData: {
            part1: { lectureHour: number; labHour: number };
            part2: { lectureHour: number; labHour: number };
        }
    ) => {
        // เพิ่มคุณสมบัติ partNumber เพื่อให้ตรงกับพารามิเตอร์ที่ฟังก์ชันต้องการ
        const adaptedSplitData = {
            part1: { ...splitData.part1, partNumber: 1 },
            part2: { ...splitData.part2, partNumber: 2 }
        };

        onSplitSubject && onSplitSubject(subjectId, adaptedSplitData);
    };

    return (
        <>
            <div className="mx-auto my-5 max-w-7xl">
                <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold">
                            แผนการเรียน {
                                planType === 'TRANSFER' ? 'เทียบโอน' :
                                    planType === 'FOUR_YEAR' ? '4 ปี' :
                                        planType === 'DVE-LVC' ? 'ปวช. ขึ้น ปวส.' :
                                            planType === 'DVE-MSIX' ? 'ม.6 ขึ้น ปวส.' :
                                                planType
                            } {yearLevel} ภาคเรียนที่ {termYear}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            จำนวนวิชาทั้งหมด: {filteredPlans.length} วิชา | จัดตารางแล้ว: {assignedCount} วิชา
                            <span className="ml-2">
                                <AutoTimetableButton
                                    plans={filteredPlans}
                                    termYear={termYear}
                                    yearLevel={yearLevel}
                                    planType={planType}
                                    currentAssignments={assignments}
                                    onScheduleComplete={(newAssignments) => {
                                        // Update the parent component with the new assignments
                                        if (onSubjectUpdate) {
                                            onSubjectUpdate();
                                        }
                                    }}
                                />
                                <span className="ml-2">
                                    <ClearButtonSubject
                                        termYear={termYear}
                                        yearLevel={yearLevel}
                                        planType={planType}
                                        onClearComplete={() => {
                                            // This will refresh the timetable data after clearing
                                            if (onSubjectUpdate) {
                                                onSubjectUpdate();
                                            }
                                        }}
                                    />
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="rounded-xl border shadow-sm py-4 px-4 overflow-visible">
                        <div className="text-center text-sm mb-2">
                            ลากวิชาจากรายการด้านล่างไปวางในตารางเพื่อจัดตารางเรียน
                            {assignedCount > 0 &&
                                <div className="text-xs text-muted-foreground">
                                    สามารถลากวิชาที่อยู่ในตารางมาวางใหม่ หรือคลิกขวาที่วิชาในตารางเพื่อนำออก
                                </div>
                            }
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {unassignedPlans.map((plan) => (
                                <SubjectCard
                                    key={plan.id}
                                    subject={plan}
                                    onSplitSubject={handleSplitSubjectAdapter}
                                    onMergeSubject={onMergeSubject}
                                    onUpdate={onSubjectUpdate}
                                    isDragFailed={dragFailedSubjectId === plan.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Conflict Dialog */}
            {showConflictDialog && conflicts && conflicts.length > 0 && (
                <ConflictDialog
                    conflicts={conflicts}
                    onClose={handleCloseConflictDialog}
                />
            )}
        </>
    );
}

// เพิ่ม ConflictDialog component ที่รองรับ Section Duplicate
function ConflictDialog({
    conflicts,
    onClose
}: {
    conflicts: Array<{
        type: string;
        message: string;
        conflicts?: any[];
        maxConsecutive?: number;
        mainSubject?: any;
    }>;
    onClose: () => void;
}) {
    // ฟังก์ชันแปลง planType
    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    // ฟังก์ชันกำหนดสีของ Badge ตาม conflict type
    const getBadgeVariant = (conflict: any, field: string) => {
        switch (conflict.type) {
            case "YEAR_LEVEL_CONFLICT":
                return field === "yearLevel" ? "destructive" : "secondary";
            case "SECTION_DUPLICATE_CONFLICT":
                return field === "section" ? "destructive" : "secondary";
            case "TEACHER_CONFLICT":
                return field === "teacher" ? "destructive" : "secondary";
            case "ROOM_CONFLICT":
                return field === "room" ? "destructive" : "secondary";
            default:
                return "secondary";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-red-600 flex items-center">
                            <TriangleAlert className="mr-2" color="#ffff00" />
                            <span>พบการชนกันในตาราง</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        {conflicts.map((conflict, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-card">
                                {/* กรณีการชนกันของ Section แสดงเฉพาะข้อความเตือนโดยไม่แสดงรายการวิชาที่ชนกัน */}
                                {conflict.type === "SECTION_DUPLICATE_CONFLICT" ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <h3 className="font-medium text-red-700 dark:text-red-500">
                                                {conflict.message}
                                            </h3>
                                        </div>

                                        {/* แสดงวิชาที่กำลังจัดตาราง (หากมี) */}
                                        {conflict.mainSubject && (
                                            <div className="p-3 border bg-card rounded">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                                        <span className="font-mono font-medium text-blue-600 text-sm">
                                                            {conflict.mainSubject.subjectCode}
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {conflict.mainSubject.subjectName}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs flex-wrap">
                                                        {conflict.mainSubject.section && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs"
                                                            >
                                                                Section {conflict.mainSubject.section}
                                                            </Badge>
                                                        )}

                                                        {conflict.mainSubject.teacher && (
                                                            <Badge
                                                                variant={getBadgeVariant(conflict, "teacher")}
                                                                className="text-xs"
                                                            >
                                                                อ.{conflict.mainSubject.teacher.tName} {conflict.mainSubject.teacher.tLastName}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* สำหรับการชนกันประเภทอื่นๆ ให้แสดงแบบเดิม */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <h3 className="font-medium text-red-700 dark:text-red-500">
                                                {conflict.message}
                                            </h3>
                                        </div>

                                        {/* วิชาที่กำลังจัดตาราง */}
                                        {conflict.mainSubject && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400 mb-4">
                                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                                    {conflict.mainSubject.yearLevel && (
                                                        <Badge
                                                            variant={getBadgeVariant(conflict, "yearLevel")}
                                                            className="text-xs"
                                                        >
                                                            {conflict.mainSubject.yearLevel}
                                                        </Badge>
                                                    )}

                                                    {conflict.mainSubject.planType && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {getPlanTypeText(conflict.mainSubject.planType)}
                                                        </Badge>
                                                    )}

                                                    {conflict.mainSubject.teacher && (
                                                        <Badge
                                                            variant={getBadgeVariant(conflict, "teacher")}
                                                            className="text-xs"
                                                        >
                                                            อ.{conflict.mainSubject.teacher.tName} {conflict.mainSubject.teacher.tLastName}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* รายการวิชาที่ชนกัน */}
                                        {conflict.conflicts && conflict.conflicts.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <h4 className="font-medium">รายการวิชาที่ชนกัน</h4>
                                                    <Badge variant="destructive" className="text-xs">
                                                        {conflict.conflicts.length} รายการ
                                                    </Badge>
                                                </div>

                                                <div className="space-y-3">
                                                    {conflict.conflicts.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="p-3 border rounded-lg bg-card">
                                                            <div className="flex justify-between items-start gap-4">
                                                                {/* ข้อมูลวิชา */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono font-medium text-blue-600 text-sm">
                                                                            {item.plan?.subjectCode}
                                                                        </span>
                                                                        <span className="text-sm font-medium">{item.plan?.subjectName}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                                                                        {item.plan?.yearLevel && (
                                                                            <Badge
                                                                                variant={getBadgeVariant(conflict, "yearLevel")}
                                                                                className="text-xs"
                                                                            >
                                                                                {item.plan.yearLevel}
                                                                            </Badge>
                                                                        )}

                                                                        {item.plan?.planType && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {getPlanTypeText(item.plan.planType)}
                                                                            </Badge>
                                                                        )}

                                                                        {item.section && (
                                                                            <Badge
                                                                                variant={getBadgeVariant(conflict, "section")}
                                                                                className="text-xs"
                                                                            >
                                                                                Sec {item.section}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* ข้อมูลเวลาและทรัพยากร */}
                                                                <div className="text-right text-sm">
                                                                    {/* แสดงเวลาเฉพาะกรณีที่มีการชนกันเรื่องเวลา */}
                                                                    {(conflict.type === "TIME_CONFLICT" || conflict.type === "ROOM_CONFLICT" || conflict.type === "TEACHER_CONFLICT") && (
                                                                        <div className="font-medium">
                                                                            {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][item.day]}
                                                                            คาบ {item.startPeriod === item.endPeriod
                                                                                ? item.startPeriod + 1
                                                                                : `${item.startPeriod + 1}-${item.endPeriod + 1}`}
                                                                        </div>
                                                                    )}

                                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                                                                        {item.room?.roomCode && (
                                                                            <div className={
                                                                                getBadgeVariant(conflict, "room") === "destructive"
                                                                                    ? "text-red-600 font-medium"
                                                                                    : ""
                                                                            }>
                                                                                ห้อง: {item.room.roomCode}
                                                                            </div>
                                                                        )}
                                                                        {item.teacher && (
                                                                            <div className={
                                                                                getBadgeVariant(conflict, "teacher") === "destructive"
                                                                                    ? "text-red-600 font-medium"
                                                                                    : ""
                                                                            }>
                                                                                อ.{item.teacher.tName} {item.teacher.tLastName}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-4 py-2 bg-card rounded"
                        >
                            ปิด
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Card วิชาที่สามารถลากได้
function SubjectCard({
    subject,
    onSplitSubject,
    onMergeSubject,
    onUpdate,
    isDragFailed = false
}: {
    subject: any;
    onSplitSubject?: ((subjectId: number, splitData: any) => void) | null;
    onMergeSubject?: (subjectId: number) => void;
    onUpdate?: () => void;
    isDragFailed?: boolean;
}) {
    // เพิ่ม state เพื่อ force re-render
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Debug การ render
    useEffect(() => {
        console.log("SubjectCard render:", {
            id: subject.id,
            subjectCode: subject.subjectCode,
            section: subject.section,
            room: subject.room?.roomCode || "ไม่ระบุ",
            teacher: subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : "ไม่ระบุ",
            updateTrigger
        });
    }, [subject, updateTrigger]);

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `subject-${subject.id}`,
        data: {
            subject,
        },
    });

    const lectureHours = subject.lectureHour || 0;
    const labHours = subject.labHour || 0;
    const totalHours = lectureHours + labHours;

    // ปรับปรุงการควบคุม tooltip
    const [openTooltip, setOpenTooltip] = useState<boolean>(false);

    // เพิ่มฟังก์ชันจัดการกดที่ปุ่ม
    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenTooltip(false); // ปิด tooltip ทันที
    };

    // แก้ไขฟังก์ชัน handleMergeSubjectWithRefresh
    const handleMergeSubjectWithRefresh = async (subjectId: number) => {
        if (onMergeSubject) {
            try {
                await onMergeSubject(subjectId);

                // Force re-render และเรียก parent update
                setUpdateTrigger(prev => prev + 1);

                // รอให้ state อัปเดตแล้ว refresh อีกครั้ง
                setTimeout(() => {
                    if (onUpdate) {
                        onUpdate();
                    }
                }, 500);
            } catch (error) {
                console.error("Error in handleMergeSubjectWithRefresh:", error);
            }
        }
    };

    // แก้ไข callback สำหรับ AddSubDetail
    const handleAddSubDetailUpdate = () => {
        console.log("=== AddSubDetail Update Callback ===");
        console.log("Subject after update:", {
            id: subject.id,
            section: subject.section,
            room: subject.room,
            teacher: subject.teacher
        });

        // Force re-render
        setUpdateTrigger(prev => prev + 1);

        // เรียก parent update
        if (onUpdate) {
            setTimeout(() => {
                console.log("Calling parent onUpdate");
                onUpdate();
            }, 200);
        }
    };

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip open={openTooltip} onOpenChange={setOpenTooltip}>
                <TooltipTrigger asChild>
                    <div
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                        className={`relative rounded border shadow-sm bg-card dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 w-[120px] h-[70px] flex items-center justify-center p-2 text-xs cursor-grab transition-all duration-300 ${isDragging ? 'opacity-30' : ''
                            } ${isDragFailed
                                ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 animate-pulse'
                                : ''
                            }`}
                    >
                        {/* เพิ่ม icon แสดงสถานะ drag failed */}
                        {isDragFailed && (
                            <div className="absolute top-1 text-xs left-1">
                                <TriangleAlert size={15} color="#ffff00" className="animate-pulse" />
                            </div>
                        )}

                        {/* ปุ่ม PlusCircle ที่มุมขวาบน */}
                        <div
                            className="absolute top-[-8px] right-[-8px]"
                            onClick={handleButtonClick}
                            onMouseEnter={() => setOpenTooltip(false)}
                        >
                            <AddSubDetail
                                subject={subject}
                                onUpdate={handleAddSubDetailUpdate}
                            />
                        </div>

                        {/* ปุ่ม CutButton ที่มุมล่างขวา */}
                        <div
                            className="absolute bottom-[-1px] right-[-1px]"
                            onClick={handleButtonClick}
                            onMouseEnter={() => setOpenTooltip(false)}
                        >
                            <CutButton
                                subject={subject}
                                onSplitSubject={onSplitSubject || undefined}
                                onMergeSubject={handleMergeSubjectWithRefresh}
                            />
                        </div>

                        <div className="text-center">
                            <div className="font-medium mb-1 text-slate-900 dark:text-slate-100">
                                {subject.subjectCode}
                                {/* แสดง section ถ้ามี */}
                                {subject.section && (
                                    <span className="ml-1 text-[8px] bg-blue-200 dark:bg-blue-700 px-1 rounded">
                                        {subject.section}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] truncate max-w-[110px] text-slate-700 dark:text-slate-300">
                                {subject.subjectName}
                            </div>

                            {/* แสดงข้อมูลห้องและอาจารย์ */}
                            {(subject.room?.roomCode || subject.teacher?.tName) && (
                                <div className="text-[8px] mt-1 flex flex-wrap justify-center gap-1">
                                    {subject.room?.roomCode && (
                                        <span className="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">
                                            {subject.room.roomCode}
                                        </span>
                                    )}
                                    {subject.teacher?.tName && (
                                        <span className="bg-purple-200 dark:bg-purple-700 px-1 rounded text-[7px]">
                                            {subject.teacher.tName}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="text-[8px] mt-1 text-slate-600 dark:text-slate-400">
                                {totalHours} ชม. (บ {lectureHours} / ป {labHours})
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="center"
                    className="bg-slate-950 text-slate-50 dark:bg-slate-900 z-10 max-w-xs"
                >
                    <div className="text-xs p-1">
                        <div className="font-medium">{subject.subjectCode}</div>
                        <div className="mt-1">{subject.subjectName}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>จำนวนหน่วยกิต:</div>
                            <div className="text-right">{subject.credit}</div>
                            <div>ชั่วโมงบรรยาย:</div>
                            <div className="text-right">{lectureHours} ชม.</div>
                            <div>ชั่วโมงปฏิบัติ:</div>
                            <div className="text-right">{labHours} ชม.</div>
                            <div>รวม:</div>
                            <div className="text-right">{totalHours} ชม. ({totalHours * 2} คาบ)</div>

                            {/* เพิ่มข้อมูลรายละเอียดเพิ่มเติม */}
                            {subject.section && (
                                <>
                                    <div>Section:</div>
                                    <div className="text-right">{subject.section}</div>
                                </>
                            )}
                            {subject.room && (
                                <>
                                    <div>ห้องเรียน:</div>
                                    <div className="text-right">{subject.room.roomCode}</div>
                                </>
                            )}
                            {subject.teacher && (
                                <>
                                    <div>อาจารย์:</div>
                                    <div className="text-right">{subject.teacher.tName} {subject.teacher.tLastName}</div>
                                </>
                            )}
                        </div>

                        {/* แสดงข้อความเตือนเมื่อ drag failed */}
                        {isDragFailed && (
                            <div className="mt-2 p-2 bg-red-600 text-white rounded text-center">
                                ไม่สามารถวางได้เนื่องจากมีการชนกัน
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// แก้ไขฟังก์ชัน handleSplitSubject ในคอมโพเนนต์ TransferOneYear

// เพิ่มฟังก์ชันใหม่
async function handleSplitSubject(
    plans: any[],
    setPlans: (plans: any[]) => void,
    subjectId: number,
    splitData: {
        part1: { lectureHour: number; labHour: number; partNumber: number };
        part2: { lectureHour: number; labHour: number; partNumber: number };
    }
) {
    // หาวิชาที่จะแบ่ง
    const subjectToSplit = plans.find(plan => plan.id === subjectId);

    if (!subjectToSplit) return;

    // คำนวณชั่วโมงรวมของแต่ละส่วน
    const part1TotalHours = splitData.part1.lectureHour + splitData.part1.labHour;
    const part2TotalHours = splitData.part2.lectureHour + splitData.part2.labHour;

    // ดึงชื่อวิชาเดิมออกมา (ตัด "(ส่วนที่ X)" ออก ถ้ามี)
    const baseSubjectName = subjectToSplit.subjectName.replace(/\s*\(ส่วนที่ \d+\)\s*$/, '');

    // คำนวณ section ใหม่
    const originalSection = subjectToSplit.section || "1"; // ถ้าไม่มี section ให้เป็น "1"
    const newSection1 = `${originalSection}-1`;
    const newSection2 = `${originalSection}-2`;

    console.log("Section calculation:", {
        originalSection,
        newSection1,
        newSection2
    });

    // กรณีส่วนที่ 1 เป็น 0 ชั่วโมง - ไม่ต้องสร้างส่วนที่ 1 ใช้แค่ส่วนที่ 2
    if (part1TotalHours === 0) {
        // ปรับปรุงวิชาเดิมเป็นข้อมูลของส่วนที่ 2
        const updatedPlans = plans.map(plan => {
            if (plan.id === subjectId) {
                return {
                    ...plan,
                    lectureHour: splitData.part2.lectureHour,
                    labHour: splitData.part2.labHour,
                    subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part2.partNumber})`,
                    section: newSection2,
                };
            }
            return plan;
        });

        // อัปเดต state
        setPlans(updatedPlans);

        // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
        try {
            await fetch('/api/subject', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: subjectId,
                    lectureHour: splitData.part2.lectureHour,
                    labHour: splitData.part2.labHour,
                    subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part2.partNumber})`,
                    section: newSection2,
                }),
            });
        } catch (error) {
            console.error("Failed to update subject:", error);
        }

        return;
    }

    // กรณีส่วนที่ 2 เป็น 0 ชั่วโมง - ไม่ต้องสร้างส่วนที่ 2 ใช้แค่ส่วนที่ 1
    if (part2TotalHours === 0) {
        // ปรับปรุงวิชาเดิมเป็นข้อมูลของส่วนที่ 1
        const updatedPlans = plans.map(plan => {
            if (plan.id === subjectId) {
                return {
                    ...plan,
                    lectureHour: splitData.part1.lectureHour,
                    labHour: splitData.part1.labHour,
                    subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part1.partNumber})`,
                    section: newSection1,
                };
            }
            return plan;
        });

        // อัปเดต state
        setPlans(updatedPlans);

        // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
        try {
            await fetch('/api/subject', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: subjectId,
                    lectureHour: splitData.part1.lectureHour,
                    labHour: splitData.part1.labHour,
                    subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part1.partNumber})`,
                    section: newSection1,
                }),
            });
        } catch (error) {
            console.error("Failed to update subject:", error);
        }

        return;
    }

    // กรณีทั้ง 2 ส่วนมีชั่วโมง - แบ่งตามปกติ
    const updatedPlans = plans.map(plan => {
        if (plan.id === subjectId) {
            return {
                ...plan,
                lectureHour: splitData.part1.lectureHour,
                labHour: splitData.part1.labHour,
                subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part1.partNumber})`,
                section: newSection1,
            };
        }
        return plan;
    });

    // สร้างวิชาใหม่สำหรับส่วนที่สอง
    try {
        // บันทึกการเปลี่ยนแปลงของวิชาเดิม (ส่วนที่ 1)
        await fetch('/api/subject', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: subjectId,
                lectureHour: splitData.part1.lectureHour,
                labHour: splitData.part1.labHour,
                subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part1.partNumber})`,
                section: newSection1,
            }),
        });

        // สร้างวิชาใหม่สำหรับส่วนที่ 2
        const createResponse = await fetch('/api/subject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subjectCode: subjectToSplit.subjectCode,
                subjectName: `${baseSubjectName} (ส่วนที่ ${splitData.part2.partNumber})`,
                credit: subjectToSplit.credit,
                lectureHour: splitData.part2.lectureHour,
                labHour: splitData.part2.labHour,
                termYear: subjectToSplit.termYear,
                yearLevel: subjectToSplit.yearLevel,
                planType: subjectToSplit.planType,
                dep: subjectToSplit.dep,
                roomId: subjectToSplit.roomId,
                teacherId: subjectToSplit.teacherId,
                section: newSection2,
            }),
        });

        if (createResponse.ok) {
            // ดึง ID ของวิชาที่สร้างใหม่จากการตอบกลับ
            const newSubject = await createResponse.json();

            // อัปเดต state ด้วยข้อมูลที่ได้รับจากการบันทึก
            setPlans([...updatedPlans, newSubject]);
        } else {
            throw new Error("Failed to create new subject part");
        }
    } catch (error) {
        console.error("Failed to split subject:", error);
        // คืนค่า state เดิมในกรณีเกิดข้อผิดพลาด
        // อาจเพิ่ม code แสดง error notification ตรงนี้
    }
}