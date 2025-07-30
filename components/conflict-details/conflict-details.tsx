// components/conflict-details/conflict-details.tsx
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
        };
    };
}

export function ConflictDetails({ conflict }: ConflictDetailsProps) {
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

                {/* วิชาที่กำลังจัดตาราง */}
                {conflict.mainSubject && (
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-700 mb-1">วิชาที่กำลังจัดตาราง</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono font-medium">{conflict.mainSubject.subjectCode}</span>
                            <span>{conflict.mainSubject.subjectName}</span>
                            {conflict.mainSubject.yearLevel && (
                                <Badge variant="outline" className="text-xs">{conflict.mainSubject.yearLevel}</Badge>
                            )}
                            {conflict.mainSubject.planType && (
                                <Badge variant="secondary" className="text-xs">{getPlanTypeText(conflict.mainSubject.planType)}</Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* รายการวิชาที่ชนกัน */}
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
                                        {/* ข้อมูลวิชา */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-medium text-blue-600 text-sm">
                                                    {item.plan?.subjectCode}
                                                </span>
                                                <span className="text-sm font-medium">{item.plan?.subjectName}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                {item.plan?.yearLevel && (
                                                    <Badge
                                                        variant={conflict.type === "YEAR_LEVEL_CONFLICT" ? "destructive" : "outline"}
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
                                                    <Badge variant="outline" className="text-xs">Sec {item.section}</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* ข้อมูลเวลาและทรัพยากร */}
                                        <div className="text-right text-sm">
                                            <div className="font-medium">
                                                {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][item.day]}
                                                คาบ {item.startPeriod === item.endPeriod
                                                    ? item.startPeriod + 1
                                                    : `${item.startPeriod + 1}-${item.endPeriod + 1}`}
                                            </div>

                                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                {item.room?.roomCode && (
                                                    <div className={conflict.type === "ROOM_CONFLICT" ? "text-red-600 font-medium" : ""}>
                                                        ห้อง: {item.room.roomCode}
                                                    </div>
                                                )}
                                                {item.teacher && (
                                                    <div className={conflict.type === "TEACHER_CONFLICT" ? "text-red-600 font-medium" : ""}>
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
            </DialogContent>
        </Dialog>
    );
}