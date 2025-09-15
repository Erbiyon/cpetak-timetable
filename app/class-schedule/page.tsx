"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import DownloadTeacherButton from "@/components/teacher-download/page";

export default function ClassSchedule() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [timetables, setTimetables] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("internal");

    const [currentTermYear, setCurrentTermYear] = useState<string>("");

    const teacherGroups = useMemo(() => {
        const internal: any[] = [];
        const external: any[] = [];

        teachers.forEach(teacher => {
            if (teacher.teacherType === "อาจารย์ภายในสาขา") {
                internal.push(teacher);
            } else if (teacher.teacherType === "อาจารย์ภายนอกสาขา") {
                external.push(teacher);
            }
        });

        return { internal, external };
    }, [teachers]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                const teachersResponse = await fetch('/api/teacher');
                if (teachersResponse.ok) {
                    const teachersData = await teachersResponse.json();
                    setTeachers(teachersData);
                }

                const termYearResponse = await fetch('/api/current-term-year');
                if (termYearResponse.ok) {
                    const termYearData = await termYearResponse.json();
                    setCurrentTermYear(termYearData.termYear);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!currentTermYear) return;

        if (activeTab === "internal") {
            if (teacherGroups.internal.length > 0) {
                const firstTeacher = teacherGroups.internal[0];
                setSelectedTeacherId(String(firstTeacher.id));
                fetchTimetableByTeacher(firstTeacher.id, currentTermYear);
            } else {
                setSelectedTeacherId("");
                setTimetables([]);
            }
        } else if (activeTab === "external") {
            if (teacherGroups.external.length > 0) {
                const firstTeacher = teacherGroups.external[0];
                setSelectedTeacherId(String(firstTeacher.id));
                fetchTimetableByTeacher(firstTeacher.id, currentTermYear);
            } else {
                setSelectedTeacherId("");
                setTimetables([]);
            }
        }
    }, [activeTab, teacherGroups, currentTermYear]);

    const fetchTimetableByTeacher = async (teacherId: number, termYear: string) => {
        try {
            setLoading(true);
            console.log("Fetching timetable for teacher ID:", teacherId, "Term Year:", termYear);

            const response = await fetch(`/api/timetable?teacherId=${teacherId}&termYear=${encodeURIComponent(termYear)}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Timetable data received:", data);
                setTimetables(data);
            }
        } catch (error) {
            console.error("Error fetching teacher timetable:", error);
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherChange = (value: string) => {
        console.log("Teacher selected:", value);
        setSelectedTeacherId(value);
        if (currentTermYear) {
            fetchTimetableByTeacher(Number(value), currentTermYear);
        }
    };

    const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
        const cellToSubject: { [cellKey: string]: any } = {};
        const cellColspan: { [cellKey: string]: number } = {};
        const cellSkip: Set<string> = new Set();

        if (!timetables || timetables.length === 0 || !currentTermYear) {
            console.log("No timetable data available or no term year");
            return { cellToSubject, cellColspan, cellSkip };
        }

        console.log(`Total timetable entries: ${timetables.length}, filtering for teacher ID: ${selectedTeacherId}, Term Year: ${currentTermYear}`);

        const filteredTimetables = timetables.filter(item => {
            const teacherMatch = String(item.teacherId) === selectedTeacherId;
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
    }, [timetables, selectedTeacherId, currentTermYear]);

    return (
        <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold mb-2">ตารางสอน</h2>

            <Card className="mb-2">
                <CardHeader>
                    <CardTitle>
                        เลือกประเภทอาจารย์และอาจารย์ผู้สอน
                        {currentTermYear && (
                            <span className="text-base font-normal text-muted-foreground ml-2">
                                ({currentTermYear})
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="internal" className="flex-1">
                                        อาจารย์ภายในสาขา
                                    </TabsTrigger>
                                    <TabsTrigger value="external" className="flex-1">
                                        อาจารย์ภายนอกสาขา
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="internal">
                                    <Select key={`internal-${activeTab}`} value={selectedTeacherId} onValueChange={handleTeacherChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกอาจารย์ภายในสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teacherGroups.internal.length > 0 ? (
                                                teacherGroups.internal.map(teacher => (
                                                    <SelectItem key={`internal-${teacher.id}`} value={String(teacher.id)}>
                                                        {teacher.tName} {teacher.tLastName} ({teacher.tId})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    ไม่มีข้อมูลอาจารย์
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {teacherGroups.internal.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            ยังไม่มีการเพิ่มอาจารย์ภายในสาขา
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent value="external">
                                    <Select key={`external-${activeTab}`} value={selectedTeacherId} onValueChange={handleTeacherChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกอาจารย์ภายนอกสาขา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teacherGroups.external.length > 0 ? (
                                                teacherGroups.external.map(teacher => (
                                                    <SelectItem key={`external-${teacher.id}`} value={String(teacher.id)}>
                                                        {teacher.tName} {teacher.tLastName} ({teacher.tId})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    ไม่มีข้อมูลอาจารย์
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {teacherGroups.external.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            ยังไม่มีการเพิ่มอาจารย์ภายนอกสาขา
                                        </p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div>
                            {selectedTeacherId && currentTermYear && teachers.length > 0 && (
                                <div className="p-3 bg-muted rounded-md">
                                    <div className="text-sm font-medium mb-2">ข้อมูลที่แสดง</div>
                                    <div className="grid grid-cols-1 gap-1 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">ภาคเรียน:</span>{" "}
                                            <span className="font-medium">{currentTermYear}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">อาจารย์:</span>{" "}
                                            <span className="font-medium">
                                                {(() => {
                                                    const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
                                                    return teacher ? `${teacher.tName} ${teacher.tLastName}` : "-";
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">รหัสอาจารย์:</span>{" "}
                                            <span className="font-medium">
                                                {teachers.find(t => t.id === Number(selectedTeacherId))?.tId || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">ประเภท:</span>{" "}
                                            <span className="font-medium">
                                                {teachers.find(t => t.id === Number(selectedTeacherId))?.teacherType || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">กำลังโหลดข้อมูล...</span>
                </div>
            ) : selectedTeacherId && currentTermYear ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <div>
                                ตารางสอน{" "}
                                {(() => {
                                    const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
                                    return teacher ? `${teacher.tName} ${teacher.tLastName}` : "";
                                })()}{" "}
                                <span className="text-base font-normal text-muted-foreground">
                                    ({currentTermYear})
                                </span>
                            </div>
                            <DownloadTeacherButton
                                selectedTeacher={teachers.find(t => t.id === Number(selectedTeacherId))}
                                currentTermYear={currentTermYear}
                                timetables={timetables}
                            />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TeacherTimetable
                            key={`timetable-${selectedTeacherId}-${currentTermYear}`}
                            cellToSubject={cellToSubject}
                            cellColspan={cellColspan}
                            cellSkip={cellSkip}
                            teacherId={selectedTeacherId}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">
                            {!currentTermYear
                                ? "กำลังโหลดข้อมูลภาคเรียน..."
                                : "กรุณาเลือกอาจารย์เพื่อดูตารางสอน"
                            }
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function TeacherTimetable({
    cellToSubject,
    cellColspan,
    cellSkip,
    teacherId
}: {
    cellToSubject: { [cellKey: string]: any };
    cellColspan: { [cellKey: string]: number };
    cellSkip: Set<string>;
    teacherId: string;
}) {
    const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    console.log("Rendering timetable for teacher ID:", teacherId);
    console.log("Available subjects:", Object.keys(cellToSubject).length);
    console.log("Cell keys:", Object.keys(cellToSubject));

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
                            <td className="border text-center text-xs w-[72px]">{day}</td>
                            {Array.from({ length: 25 }, (_, colIdx) => {
                                const period = colIdx;

                                if (dayIndex === 2 && period === 14) {
                                    return (
                                        <td
                                            key={`activity-${dayIndex}-${period}`}
                                            colSpan={4}
                                            className="border text-center bg-muted font-bold text-xs"
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

                                const displayPeriod = period + 1;

                                return (
                                    <td
                                        key={`cell-${dayIndex}-${displayPeriod}`}
                                        className={`border text-center h-[36px] p-0 align-middle overflow-hidden text-xs ${subject
                                            ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
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
                    <div className="w-full h-full p-1">
                        <div className="text-center">
                            <div className="font-medium text-blue-950 dark:text-blue-50">
                                {subject.subjectCode}
                                {subject.section && (
                                    <span className="text-[9px] ml-1 bg-blue-200 dark:bg-blue-700 px-1 py-0.5 rounded">
                                        sec.{subject.section}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] truncate text-blue-900 dark:text-blue-100">
                                {subject.subjectName}
                            </div>
                            <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                                <span className="bg-blue-200/50 dark:bg-blue-700/50 px-1 rounded">
                                    {totalHours} ชม. ({lectureHours}/{labHours})
                                </span>
                                {colspan > 1 && (
                                    <span className="bg-blue-300/30 dark:bg-blue-600/30 px-1 rounded">
                                        {colspan} คาบ
                                    </span>
                                )}
                            </div>

                            {subject.room && (
                                <div className="text-[8px] mt-1">
                                    <span className="bg-blue-200/30 dark:bg-blue-700/30 px-1 rounded">
                                        ห้อง: {subject.room.roomCode}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-slate-950 text-slate-50 dark:bg-slate-900">
                    <div className="text-xs p-1">
                        <div className="font-medium">
                            {subject.subjectCode}
                            {subject.section && <span className="ml-2">กลุ่มเรียน: {subject.section}</span>}
                        </div>
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

                            {subject.room && (
                                <>
                                    <div>ห้องเรียน:</div>
                                    <div className="text-right">{subject.room.roomCode}</div>
                                </>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}