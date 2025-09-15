
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface ConflictDetailsProps {
    conflict: {
        type: string;
        message: string;
        conflicts?: any[];
        mainSubject?: {
            subjectCode?: string;
            subjectName?: string;
            yearLevel?: string;
            planType?: string;
            section?: string;
            teacher?: {
                tName?: string;
                tLastName?: string;
            };
        };
    };
}

export function ConflictDetails({ conflict }: ConflictDetailsProps) {

    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };


    const getBadgeVariant = (field: string) => {
        switch (conflict.type) {
            case "YEAR_LEVEL_CONFLICT":
                return field === "yearLevel" ? "destructive" : "outline";
            case "SECTION_DUPLICATE_CONFLICT":
                return field === "section" ? "destructive" : "outline";
            case "TEACHER_CONFLICT":
                return field === "teacher" ? "destructive" : "outline";
            case "ROOM_CONFLICT":
                return field === "room" ? "destructive" : "outline";
            default:
                return "outline";
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 p-0 ml-1 text-red-500 hover:text-red-600"
                >
                    <AlertCircle size={16} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-red-600">รายละเอียดการชนกัน</DialogTitle>
                    <DialogDescription className="text-sm">
                        {conflict.message}
                    </DialogDescription>
                </DialogHeader>


                {conflict.mainSubject && (
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-700 mb-1">วิชาที่กำลังจัดตาราง</p>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="font-mono font-medium">{conflict.mainSubject.subjectCode}</span>
                            <span>{conflict.mainSubject.subjectName}</span>
                            {conflict.mainSubject.yearLevel && (
                                <Badge variant={getBadgeVariant("yearLevel")} className="text-xs">
                                    {conflict.mainSubject.yearLevel}
                                </Badge>
                            )}
                            {conflict.mainSubject.planType && (
                                <Badge variant="secondary" className="text-xs">
                                    {getPlanTypeText(conflict.mainSubject.planType)}
                                </Badge>
                            )}
                            {conflict.mainSubject.section && (
                                <Badge variant={getBadgeVariant("section")} className="text-xs">
                                    Sec {conflict.mainSubject.section}
                                </Badge>
                            )}
                            {conflict.mainSubject.teacher && (
                                <Badge variant={getBadgeVariant("teacher")} className="text-xs">
                                    อ.{conflict.mainSubject.teacher.tName} {conflict.mainSubject.teacher.tLastName}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}


                {conflict.conflicts && conflict.conflicts.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-medium">รายการวิชาที่ชนกัน</h3>
                            <Badge variant="destructive" className="text-xs">{conflict.conflicts.length} รายการ</Badge>
                        </div>

                        <div className="space-y-2">
                            {conflict.conflicts.map((item, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start gap-4">

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-medium text-blue-600 text-sm">
                                                    {item.plan?.subjectCode}
                                                </span>
                                                <span className="text-sm font-medium">{item.plan?.subjectName}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                                                {item.plan?.yearLevel && (
                                                    <Badge
                                                        variant={getBadgeVariant("yearLevel")}
                                                        className="text-xs"
                                                    >
                                                        {item.plan.yearLevel}
                                                    </Badge>
                                                )}
                                                {item.plan?.planType && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {getPlanTypeText(item.plan.planType)}
                                                    </Badge>
                                                )}
                                                {item.section && (
                                                    <Badge
                                                        variant={getBadgeVariant("section")}
                                                        className="text-xs"
                                                    >
                                                        Sec {item.section}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>


                                        <div className="text-right text-sm">

                                            {(conflict.type === "TIME_CONFLICT" || conflict.type === "ROOM_CONFLICT" || conflict.type === "TEACHER_CONFLICT") && (
                                                <div className="font-medium">
                                                    {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][item.day]}
                                                    คาบ {item.startPeriod === item.endPeriod
                                                        ? item.startPeriod + 1
                                                        : `${item.startPeriod + 1}-${item.endPeriod + 1}`}
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                {item.room?.roomCode && (
                                                    <div className={getBadgeVariant("room") === "destructive" ? "text-red-600 font-medium" : ""}>
                                                        ห้อง: {item.room.roomCode}
                                                    </div>
                                                )}
                                                {item.teacher && (
                                                    <div className={getBadgeVariant("teacher") === "destructive" ? "text-red-600 font-medium" : ""}>
                                                        อ.{item.teacher.tName} {item.teacher.tLastName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    {conflict.type === "SECTION_DUPLICATE_CONFLICT" && (
                                        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs">
                                            <div className="font-medium">⚠️ การซ้ำกันของ Section:</div>
                                            <div>อาจารย์ {item.teacher?.tName} {item.teacher?.tLastName} สอนวิชา {item.plan?.subjectCode} Section {item.section} ในแผน{getPlanTypeText(item.plan?.planType)} {item.plan?.yearLevel} อยู่แล้ว</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">คำแนะนำในการแก้ไข:</h4>
                    <div className="text-xs text-yellow-700">
                        {conflict.type === "SECTION_DUPLICATE_CONFLICT" && (
                            <ul className="list-disc list-inside space-y-1">
                                <li>เปลี่ยน Section ของวิชาที่กำลังจัดตาราง</li>
                                <li>มอบหมายอาจารย์คนอื่นสอนวิชานี้</li>
                                <li>ตรวจสอบความจำเป็นในการเปิด Section ซ้ำ</li>
                            </ul>
                        )}
                        {conflict.type === "TEACHER_CONFLICT" && (
                            <ul className="list-disc list-inside space-y-1">
                                <li>เปลี่ยนเวลาสอนให้ไม่ซ้อนกัน</li>
                                <li>มอบหมายอาจารย์คนอื่น</li>
                                <li>ปรับตารางวิชาที่ชนกัน</li>
                            </ul>
                        )}
                        {conflict.type === "ROOM_CONFLICT" && (
                            <ul className="list-disc list-inside space-y-1">
                                <li>เปลี่ยนห้องเรียน</li>
                                <li>เปลี่ยนเวลาสอน</li>
                                <li>ใช้ห้องเรียนอื่นที่ว่าง</li>
                            </ul>
                        )}
                        {conflict.type === "YEAR_LEVEL_CONFLICT" && (
                            <ul className="list-disc list-inside space-y-1">
                                <li>ตรวจสอบความถูกต้องของชั้นปี</li>
                                <li>แยกเวลาสอนตามชั้นปี</li>
                                <li>พิจารณาการรวมกลุ่มเรียน</li>
                            </ul>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}