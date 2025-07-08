import { useDraggable } from "@dnd-kit/core";
import { PlusCircle } from "lucide-react"; // เพิ่ม import ไอคอน Scissors
import CutButton from "../cut-add-button/cut-button";
import AddSubDetail from "../cut-add-button/add-sub-detail";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

type SplitData = {
    part1: { lectureHour: number; labHour: number; partNumber: number };
    part2: { lectureHour: number; labHour: number; partNumber: number };
};

interface PlansStatusCustomProps {
    termYear?: string;
    yearLevel?: string;
    planType?: string;
    plans: any[];
    assignments?: { [subjectId: number]: { day: number; periods: number[] } | null };
    assignedCount?: number;
    onRemoveAssignment?: ((subjectId: number) => void) | null;
    onSplitSubject: (subjectId: number, splitData: SplitData) => void;
}

export default function PlansStatusCustom({
    termYear,
    yearLevel = "",
    planType = "",
    plans = [],
    assignments = {},
    assignedCount = 0,
    onRemoveAssignment = null,
    onSplitSubject
}: PlansStatusCustomProps) {
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

    // แสดง UI เมื่อไม่มีข้อมูล
    if (filteredPlans.length === 0) {
        return (
            <div className="flex gap-4 mx-auto my-5 max-w-7xl">
                <div className="flex-[4_4_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
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
                <div className="flex-[2_2_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-2 px-4 flex-col gap-4">
                    <div className="pb-2 font-medium">สถานะ</div>
                    <div className="rounded-xl border shadow-sm max-h-32 overflow-y-auto p-4">
                        <div className="text-center text-muted-foreground">ไม่มีข้อมูล</div>
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
        <div className="flex gap-4 mx-auto my-5 max-w-7xl">
            <div className="flex-[4_4_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="font-semibold">
                        แผนการเรียน {planType === 'TRANSFER' ? 'เทียบโอน' : planType} {yearLevel} ภาคเรียนที่ {termYear}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        จำนวนวิชาทั้งหมด: {filteredPlans.length} วิชา
                    </div>
                </div>
                <div className="rounded-xl border shadow-sm py-4 px-4 overflow-visible">
                    <div className="text-center text-sm mb-2">
                        ลากวิชาจากรายการด้านล่างไปวางในตารางเพื่อจัดตารางเรียน
                        {assignedCount > 0 && <div className="text-xs text-muted-foreground">สามารถลากวิชาที่อยู่ในตารางมาวางใหม่ หรือคลิกขวาที่วิชาในตารางเพื่อนำออก</div>}
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {unassignedPlans.map((plan) => (
                            <SubjectCard
                                key={plan.id}
                                subject={plan}
                                onSplitSubject={handleSplitSubjectAdapter}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-[2_2_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-2 px-4 flex-col gap-4">
                <div className="pb-2 font-medium">สถานะ</div>
                <div className="rounded-xl border shadow-sm max-h-32 overflow-y-auto">
                    <div className="m-2 text-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>
                                จัดตารางแล้ว: {assignedCount}/{filteredPlans.length} วิชา
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>
                                รอจัดตาราง: {filteredPlans.length - assignedCount}/{filteredPlans.length} วิชา
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Card วิชาที่สามารถลากได้
function SubjectCard({
    subject,
    onSplitSubject
}: {
    subject: any;
    onSplitSubject?: ((subjectId: number, splitData: {
        part1: { lectureHour: number; labHour: number };
        part2: { lectureHour: number; labHour: number };
    }) => void) | null;
}) {
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

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip open={openTooltip} onOpenChange={setOpenTooltip}>
                <TooltipTrigger asChild>
                    <div
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                        className={`relative rounded border shadow-sm bg-card dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 w-[120px] h-[70px] flex items-center justify-center p-2 text-xs cursor-grab ${isDragging ? 'opacity-30' : ''}`}
                    >
                        {/* ปุ่ม PlusCircle ที่มุมขวาบน */}
                        <div
                            className="absolute top-[-8px] right-[-8px] z-20"
                            onClick={handleButtonClick}
                            onMouseEnter={() => setOpenTooltip(false)} // ปิด tooltip เมื่อเมาส์อยู่เหนือปุ่ม
                        >
                            <AddSubDetail
                                subject={subject}
                                onUpdate={() => {
                                    // อาจเพิ่ม callback ในกรณีที่ต้องการรีโหลดข้อมูลหลังอัพเดท
                                }}
                            />
                        </div>

                        {/* ปุ่ม CutButton ที่มุมล่างขวา */}
                        <div
                            className="absolute bottom-[-1px] right-[-1px] z-20"
                            onClick={handleButtonClick}
                            onMouseEnter={() => setOpenTooltip(false)} // ปิด tooltip เมื่อเมาส์อยู่เหนือปุ่ม
                        >
                            <CutButton
                                subject={subject}
                                onSplitSubject={onSplitSubject || undefined}
                            />
                        </div>

                        <div className="text-center">
                            <div className="font-medium mb-1 text-slate-900 dark:text-slate-100">
                                {subject.subjectCode}
                            </div>
                            <div className="text-[10px] truncate max-w-[110px] text-slate-700 dark:text-slate-300">
                                {subject.subjectName}
                            </div>
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
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}