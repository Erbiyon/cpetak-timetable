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
import { AlertCircle } from "lucide-react";

interface ConflictDetailsProps {
    conflict: {
        type: string;
        message: string;
        conflicts?: any[];
        // เก็บข้อมูลวิชาหลักที่กำลังจะจัดตาราง
        mainSubject?: {
            subjectCode?: string;
            subjectName?: string;
        };
    };
}

export function ConflictDetails({ conflict }: ConflictDetailsProps) {
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-red-500">รายละเอียดการชนกัน</DialogTitle>
                    <DialogDescription>
                        {conflict.message}
                    </DialogDescription>
                </DialogHeader>

                {/* แสดงรายละเอียดวิชาหลักที่กำลังจัดตาราง */}
                {conflict.mainSubject && (
                    <div className="mt-2 p-2 bg-muted/30 rounded border">
                        <p className="text-xs font-medium">
                            วิชาที่กำลังจัดตาราง: {conflict.mainSubject.subjectCode} - {conflict.mainSubject.subjectName}
                        </p>
                    </div>
                )}

                {conflict.conflicts && conflict.conflicts.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">
                            รายการวิชาที่ชนกัน:
                            {conflict.type === "ROOM_CONFLICT" && " (ห้องเรียนซ้ำซ้อน)"}
                            {conflict.type === "TEACHER_CONFLICT" && " (อาจารย์ซ้ำซ้อน)"}
                            {conflict.type === "YEAR_LEVEL_CONFLICT" && " (นักศึกษาซ้ำซ้อน)"}
                        </h3>
                        <div className="rounded border overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left">วิชา</th>
                                        <th className="p-2 text-left">วัน/คาบ</th>
                                        <th className="p-2 text-left">ห้อง</th>
                                        <th className="p-2 text-left">อาจารย์</th>
                                        <th className="p-2 text-left">Section</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conflict.conflicts.map((item, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                                            <td className="p-2">
                                                <div className="font-medium">{item.plan?.subjectCode}</div>
                                                <div className="text-[10px] text-muted-foreground">{item.plan?.subjectName}</div>
                                            </td>
                                            <td className="p-2">
                                                {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][item.day]} /
                                                {item.startPeriod === item.endPeriod
                                                    ? item.startPeriod
                                                    : `${item.startPeriod + 1}-${item.endPeriod + 1}`
                                                }
                                            </td>
                                            <td className="p-2 font-medium">
                                                {conflict.type === "ROOM_CONFLICT" ? (
                                                    <span className="text-red-500">{item.room?.roomCode || '-'}</span>
                                                ) : (
                                                    item.room?.roomCode || '-'
                                                )}
                                            </td>
                                            <td className="p-2 font-medium">
                                                {conflict.type === "TEACHER_CONFLICT" ? (
                                                    <span className="text-red-500">
                                                        {item.teacher
                                                            ? `${item.teacher.tName} ${item.teacher.tLastName}`
                                                            : '-'}
                                                    </span>
                                                ) : (
                                                    item.teacher
                                                        ? `${item.teacher.tName} ${item.teacher.tLastName}`
                                                        : '-'
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {item.section || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            <p>
                                {conflict.type === "ROOM_CONFLICT" && "* ห้องเรียนที่แสดงสีแดงกำลังถูกใช้งานในเวลาเดียวกัน"}
                                {conflict.type === "TEACHER_CONFLICT" && "* อาจารย์ที่แสดงสีแดงมีการสอนในเวลาเดียวกัน"}
                                {conflict.type === "YEAR_LEVEL_CONFLICT" && "* นักศึกษากลุ่มเดียวกันจะต้องเรียนหลายวิชาในเวลาเดียวกัน"}
                            </p>
                        </div>
                    </div>
                )}

                {conflict.type === "ACTIVITY_TIME_CONFLICT" && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800">
                        <p className="text-sm">
                            เวลาที่เลือกตรงกับช่วงกิจกรรมของนักศึกษา (วันพุธ คาบ 14-17)
                            กรุณาเลือกเวลาอื่น
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}