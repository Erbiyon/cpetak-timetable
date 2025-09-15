"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import DownloadTeacherButton from "@/components/teacher-download/page";

export default function TimeTablePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [timetables, setTimetables] = useState<any[]>([]);
    const [currentTermYear, setCurrentTermYear] = useState<string>("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!session?.user?.teacherId) return;

            try {
                setLoading(true);

                const termYearResponse = await fetch('/api/current-term-year');
                if (termYearResponse.ok) {
                    const termYearData = await termYearResponse.json();
                    setCurrentTermYear(termYearData.termYear);

                    await fetchMyTimetable(session.user.id, termYearData.termYear);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user) {
            fetchInitialData();
        }
    }, [session]);

    const fetchMyTimetable = async (teacherId: string, termYear: string) => {
        try {
            console.log("Fetching my timetable for teacher ID:", teacherId, "Term Year:", termYear);

            const response = await fetch(`/api/timetable?teacherId=${teacherId}&termYear=${encodeURIComponent(termYear)}`);
            if (response.ok) {
                const data = await response.json();
                console.log("My timetable data received:", data);
                setTimetables(data);
            }
        } catch (error) {
            console.error("Error fetching my timetable:", error);
            setTimetables([]);
        }
    };

    const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
        const cellToSubject: { [cellKey: string]: any } = {};
        const cellColspan: { [cellKey: string]: number } = {};
        const cellSkip: Set<string> = new Set();

        if (!timetables || timetables.length === 0 || !currentTermYear || !session?.user?.id) {
            return { cellToSubject, cellColspan, cellSkip };
        }

        console.log(`Processing ${timetables.length} timetable entries for teacher ID: ${session.user.id}`);

        const filteredTimetables = timetables.filter(item => {
            const teacherMatch = String(item.teacherId) === session.user.id;
            const termYearMatch = item.termYear === currentTermYear;
            return teacherMatch && termYearMatch;
        });

        console.log(`Filtered timetable entries: ${filteredTimetables.length}`);

        filteredTimetables.forEach(item => {
            const { day, startPeriod, endPeriod, plan } = item;

            if (!plan) {
                return;
            }

            const cellKey = `${day}-${startPeriod}`;

            cellToSubject[cellKey] = {
                ...plan,
                room: item.room,
                teacher: item.teacher,
                day,
                startPeriod,
                endPeriod,
                termYear: item.termYear
            };

            const colspan = endPeriod - startPeriod + 1;
            cellColspan[cellKey] = colspan;

            for (let p = startPeriod + 1; p <= endPeriod; p++) {
                cellSkip.add(`${day}-${p}`);
            }
        });

        return { cellToSubject, cellColspan, cellSkip };
    }, [timetables, session?.user?.id, currentTermYear]);

    const selectedTeacher = session?.user ? {
        id: parseInt(session.user.id),
        tName: session.user.name?.split(' ')[0] || '',
        tLastName: session.user.name?.split(' ')[1] || '',
        tId: session.user.teacherId || '',
        teacherType: session.user.teacherType || ''
    } : undefined;

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <div>กำลังโหลด...</div>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">ตารางสอน</h1>
                    <p className="text-gray-600 mt-2">
                        ยินดีต้อนรับ,{" "}
                        <span className="font-semibold text-blue-600">{session.user.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        รหัสประจำตัว: {session.user.teacherId} | ประเภท:{" "}
                        {session.user.teacherType}
                        {currentTermYear && (
                            <span className="ml-2">| ภาคเรียน: {currentTermYear}</span>
                        )}
                    </p>
                </div>
                <DownloadTeacherButton
                    selectedTeacher={selectedTeacher}
                    currentTermYear={currentTermYear}
                    timetables={timetables}
                />
            </div>

            {loading ? (
                <Card>
                    <CardContent className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                        <span>กำลังโหลดตารางสอน...</span>
                    </CardContent>
                </Card>
            ) : currentTermYear ? (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            ตารางสอน
                            <span className="text-base font-normal text-muted-foreground ml-2">
                                ({currentTermYear})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timetables.length > 0 ? (
                            <MyTimetable
                                cellToSubject={cellToSubject}
                                cellColspan={cellColspan}
                                cellSkip={cellSkip}
                            />
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    ยังไม่มีตารางสอนในภาคเรียนนี้
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    กรุณาติดต่อผู้ดูแลระบบเพื่อจัดตารางสอน
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">
                            กำลังโหลดข้อมูลภาคเรียน...
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MyTimetable({
    cellToSubject,
    cellColspan,
    cellSkip,
}: {
    cellToSubject: { [cellKey: string]: any };
    cellColspan: { [cellKey: string]: number };
    cellSkip: Set<string>;
}) {
    const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    return (
        <div className="w-full overflow-x-auto">
            <table className="table-fixed border-collapse w-full">
                <thead>
                    <tr>
                        <th className="border px-2 py-1 text-xs w-[72px]">วัน/คาบ</th>
                        {Array.from({ length: 25 }, (_, i) => (
                            <th key={i} className="border px-2 py-1 text-xs" style={{ width: `${100 / 25}%` }}>
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day, dayIndex) => (
                        <tr key={dayIndex}>
                            <td className="border text-center text-xs w-[72px] font-medium bg-muted">{day}</td>
                            {Array.from({ length: 25 }, (_, colIdx) => {
                                const period = colIdx;

                                if (dayIndex === 2 && period === 14) {
                                    return (
                                        <td
                                            key={`activity-${dayIndex}-${period}`}
                                            colSpan={4}
                                            className="border text-center bg-yellow-100 dark:bg-yellow-900 font-bold text-xs"
                                        >
                                            กิจกรรม
                                        </td>
                                    );
                                }

                                if (dayIndex === 2 && period > 14 && period <= 17) {
                                    return null;
                                }

                                const cellKey = `${dayIndex}-${period}`;

                                if (cellSkip.has(cellKey)) {
                                    return null;
                                }

                                const subject = cellToSubject[cellKey];
                                const colspan = cellColspan[cellKey] || 1;

                                return (
                                    <td
                                        key={`cell-${dayIndex}-${period}`}
                                        className={`border text-center h-[48px] p-0 align-middle overflow-hidden text-xs ${subject
                                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
                                            : 'bg-card'
                                            }`}
                                        colSpan={colspan}
                                    >
                                        {subject ? (
                                            <SubjectInCell
                                                subject={{
                                                    ...subject,
                                                    startPeriod: subject.startPeriod + 1,
                                                    endPeriod: subject.endPeriod + 1
                                                }}
                                                colspan={colspan}
                                            />
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SubjectInCell({
    subject,
    colspan = 1
}: {
    subject: any;
    colspan?: number;
}) {
    const lectureHours = subject.lectureHour || 0;
    const labHours = subject.labHour || 0;
    const totalHours = lectureHours + labHours;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full h-full p-1 cursor-pointer">
                        <div className="text-center">
                            <div className="font-bold text-blue-950 dark:text-blue-50 text-xs">
                                {subject.subjectCode}
                                {subject.section && (
                                    <span className="text-[9px] ml-1 bg-blue-200 dark:bg-blue-700 px-1 py-0.5 rounded">
                                        sec.{subject.section}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] truncate text-blue-900 dark:text-blue-100 font-medium">
                                {subject.subjectName}
                            </div>
                            <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                                <span className="bg-blue-200/50 dark:bg-blue-700/50 px-1 rounded">
                                    {totalHours} ชม.
                                </span>
                                {colspan > 1 && (
                                    <span className="bg-blue-300/30 dark:bg-blue-600/30 px-1 rounded">
                                        {colspan} คาบ
                                    </span>
                                )}
                            </div>
                            {subject.room && (
                                <div className="text-[8px] mt-1">
                                    <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded font-medium">
                                        📍 {subject.room.roomCode}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-slate-950 text-slate-50 dark:bg-slate-900">
                    <div className="text-xs p-2 max-w-xs">
                        <div className="font-bold text-sm mb-2">
                            {subject.subjectCode} - {subject.subjectName}
                            {subject.section && <span className="ml-2 text-yellow-300">Section: {subject.section}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>จำนวนหน่วยกิต:</div>
                            <div className="text-right font-medium">{subject.credit}</div>
                            <div>ชั่วโมงบรรยาย:</div>
                            <div className="text-right">{lectureHours} ชม.</div>
                            <div>ชั่วโมงปฏิบัติ:</div>
                            <div className="text-right">{labHours} ชม.</div>
                            <div className="font-medium">รวม:</div>
                            <div className="text-right font-medium">{totalHours} ชม.</div>

                            {(subject.planType || subject.yearLevel) && (
                                <>
                                    <div className="col-span-2 border-t border-gray-600 mt-2 pt-2">
                                        {subject.planType && (
                                            <div className="flex justify-between mb-1">
                                                <span>หลักสูตร:</span>
                                                <span className="font-medium text-purple-300">
                                                    {subject.planType === 'TRANSFER' && 'เทียบโอน'}
                                                    {subject.planType === 'FOUR_YEAR' && '4 ปี'}
                                                    {subject.planType === 'DVE_LVC' && 'ทค.'}
                                                    {subject.planType === 'DVE_MSIX' && 'ทค.ม.6'}
                                                    {!['TRANSFER', 'FOUR_YEAR', 'DVE_LVC', 'DVE_MSIX'].includes(subject.planType) && subject.planType}
                                                </span>
                                            </div>
                                        )}
                                        {subject.yearLevel && (
                                            <div className="flex justify-between">
                                                <span>ชั้นปี:</span>
                                                <span className="font-medium text-orange-300">{subject.yearLevel}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {subject.room && (
                                <>
                                    <div className="col-span-2 border-t border-gray-600 mt-2 pt-2">
                                        <div className="flex justify-between">
                                            <span>ห้องเรียน:</span>
                                            <span className="font-medium text-green-300">{subject.room.roomCode}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="col-span-2 border-t border-gray-600 mt-2 pt-2">
                                <div className="flex justify-between">
                                    <span>เวลา:</span>
                                    <span className="font-medium text-blue-300">
                                        คาบ {subject.startPeriod} - {subject.endPeriod}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}