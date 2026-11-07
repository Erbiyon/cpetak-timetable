"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Building2, School } from "lucide-react";
import DownloadRoomButton from "@/components/room-download/download-room-button";
import { Badge } from "@/components/ui/badge";

export default function RoomsUse() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("in-department");
  const [currentTermYear, setCurrentTermYear] = useState<string>("");

  const roomGroups = useMemo(() => {
    const inDepartment: any[] = [];
    const outDepartment: any[] = [];
    const engineering: any[] = [];

    rooms.forEach((room) => {
      if (room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์") {
        inDepartment.push(room);
      } else if (room.roomType === "ไม่ได้กำหนดประเภทห้อง") {
        outDepartment.push(room);
      } else if (room.roomType === "ตึกวิศวกรรมศาสตร์") {
        engineering.push(room);
      }
    });

    return { inDepartment, outDepartment, engineering };
  }, [rooms]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const roomsResponse = await fetch("/api/room");
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        }

        const termYearResponse = await fetch("/api/current-term-year");
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

    if (activeTab === "in-department") {
      if (roomGroups.inDepartment.length > 0) {
        const firstRoom = roomGroups.inDepartment[0];
        setSelectedRoomId(String(firstRoom.id));
        fetchTimetableByRoom(firstRoom.id, currentTermYear);
      } else {
        setSelectedRoomId("");
        setTimetables([]);
      }
    } else if (activeTab === "engineering") {
      if (roomGroups.engineering.length > 0) {
        const firstRoom = roomGroups.engineering[0];
        setSelectedRoomId(String(firstRoom.id));
        fetchTimetableByRoom(firstRoom.id, currentTermYear);
      } else {
        setSelectedRoomId("");
        setTimetables([]);
      }
    }
  }, [activeTab, roomGroups, currentTermYear]);

  const fetchTimetableByRoom = async (roomId: number, termYear: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/timetable?roomId=${roomId}&termYear=${encodeURIComponent(termYear)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTimetables(data);
      }
    } catch (error) {
      console.error("Error fetching room timetable:", error);
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomChange = (value: string) => {
    setSelectedRoomId(value);
    if (currentTermYear) {
      fetchTimetableByRoom(Number(value), currentTermYear);
    }
  };

  const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
    const cellToSubject: { [cellKey: string]: any } = {};
    const cellColspan: { [cellKey: string]: number } = {};
    const cellSkip: Set<string> = new Set();

    if (!timetables || timetables.length === 0 || !currentTermYear) {
      return { cellToSubject, cellColspan, cellSkip };
    }

    const filteredTimetables = timetables.filter((item) => {
      const roomMatch = String(item.roomId) === selectedRoomId;
      const termYearMatch = item.termYear === currentTermYear;
      return roomMatch && termYearMatch;
    });

    filteredTimetables.forEach((item) => {
      const { day, startPeriod, endPeriod, plan } = item;

      if (!plan) return;

      const cellKey = `${day}-${startPeriod}`;

      cellToSubject[cellKey] = {
        ...plan,
        room: item.room,
        teacher: item.teacher,
        day,
        startPeriod,
        endPeriod,
        termYear: item.termYear,
      };

      const colspan = endPeriod - startPeriod + 1;
      cellColspan[cellKey] = colspan;

      for (let p = startPeriod + 1; p <= endPeriod; p++) {
        cellSkip.add(`${day}-${p}`);
      }
    });

    return { cellToSubject, cellColspan, cellSkip };
  }, [timetables, selectedRoomId, currentTermYear]);

  const combinedHoursMap = useMemo(() => {
    const map = new Map<string, { lectureHour: number; labHour: number }>();
    timetables.forEach((item) => {
      if (!item.plan) return;
      const baseSec = (item.plan.section || "").replace(/-\d+$/, "");
      const key = `${item.plan.subjectCode}-${baseSec}`;
      if (!map.has(key)) {
        map.set(key, {
          lectureHour: item.plan.lectureHour || 0,
          labHour: item.plan.labHour || 0,
        });
      } else {
        const ex = map.get(key)!;
        ex.lectureHour += item.plan.lectureHour || 0;
        ex.labHour += item.plan.labHour || 0;
      }
    });
    return map;
  }, [timetables]);

  const selectedRoom = rooms.find((r) => r.id === Number(selectedRoomId));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Academic Header */}
      <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-foreground font-medium text-xs px-2.5 py-0.5 font-sans"
              >
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              <Badge
                variant="secondary"
                className="font-normal text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-sans"
              >
                การใช้ประโยชน์ห้องเรียน
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              ตารางการใช้ห้องเรียน
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              ตรวจสอบความหนาแน่นและช่วงเวลาการใช้ห้องเรียนในอาคารสาขาและตึกคณะวิศวกรรมศาสตร์
            </p>
          </div>
          {currentTermYear && (
            <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-border bg-secondary/50">
              ภาคเรียนที่ {currentTermYear}
            </Badge>
          )}
        </div>
      </div>

      {/* Selector & Info Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 font-sans">
            <School className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            เลือกอาคารและห้องเรียน
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            เลือกสังกัดอาคารและหมายเลขห้องเพื่อเรียกดูตารางการใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="in-department" className="text-xs font-sans">
                    อาคารสาขาวิศวกรรม ({roomGroups.inDepartment.length})
                  </TabsTrigger>
                  <TabsTrigger value="engineering" className="text-xs font-sans">
                    ตึกวิศวกรรมศาสตร์ ({roomGroups.engineering.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="in-department" className="pt-2">
                  <Select
                    key={`in-${activeTab}`}
                    value={selectedRoomId}
                    onValueChange={handleRoomChange}
                  >
                    <SelectTrigger className="text-xs font-sans h-9 border-border">
                      <SelectValue placeholder="เลือกห้องเรียนในอาคารสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomGroups.inDepartment.length > 0 ? (
                        roomGroups.inDepartment.map((room) => (
                          <SelectItem
                            key={`in-${room.id}`}
                            value={String(room.id)}
                            className="text-xs font-sans"
                          >
                            ห้อง {room.roomCode} ({room.roomCate || "ห้องเรียน"})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-sans">
                          ไม่มีข้อมูลห้องเรียน
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="engineering" className="pt-2">
                  <Select
                    key={`eng-${activeTab}`}
                    value={selectedRoomId}
                    onValueChange={handleRoomChange}
                  >
                    <SelectTrigger className="text-xs font-sans h-9 border-border">
                      <SelectValue placeholder="เลือกห้องเรียนตึกวิศวกรรมศาสตร์" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomGroups.engineering.length > 0 ? (
                        roomGroups.engineering.map((room) => (
                          <SelectItem
                            key={`eng-${room.id}`}
                            value={String(room.id)}
                            className="text-xs font-sans"
                          >
                            ห้อง {room.roomCode} ({room.roomCate || "ห้องเรียนส่วนกลาง"})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-sans">
                          ไม่มีข้อมูลห้องเรียน
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              {selectedRoom ? (
                <div className="p-4 rounded-lg bg-secondary/40 border border-border/80 space-y-2">
                  <div className="text-xs font-semibold text-foreground font-sans">
                    ข้อมูลห้องเรียนที่เลือก
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                    <div>
                      <span className="text-muted-foreground">เลขห้อง:</span>{" "}
                      <span className="font-mono font-medium text-foreground">
                        {selectedRoom.roomCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ประเภท:</span>{" "}
                      <span className="font-medium text-foreground">
                        {selectedRoom.roomCate || "ห้องเรียน"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อาคาร:</span>{" "}
                      <span className="font-medium text-foreground">
                        {selectedRoom.roomType}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ภาคการศึกษา:</span>{" "}
                      <span className="font-medium text-foreground">
                        {currentTermYear || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-border/80 text-center text-xs text-muted-foreground font-sans flex items-center justify-center h-full">
                  กรุณาเลือกห้องเรียนเพื่อแสดงรายละเอียด
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Card */}
      {loading ? (
        <div className="flex justify-center items-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground font-sans">
            กำลังโหลดข้อมูลตารางการใช้ห้อง...
          </span>
        </div>
      ) : selectedRoom && currentTermYear ? (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base font-semibold font-sans flex items-center gap-2">
                  <span>ตารางการใช้ห้อง {selectedRoom.roomCode}</span>
                  <Badge variant="outline" className="text-xs font-normal border-border font-sans">
                    ภาคเรียน {currentTermYear}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs font-sans mt-0.5">
                  ช่วงเวลาการใช้งาน คาบละ 30 นาที (08:00 - 20:30 น.)
                </CardDescription>
              </div>
              <DownloadRoomButton
                roomCode={selectedRoom.roomCode}
                roomName={selectedRoom.roomType}
                termYear={currentTermYear}
                cellToSubject={cellToSubject}
                cellColspan={cellColspan}
                cellSkip={cellSkip}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RoomTimetable
              key={`timetable-${selectedRoomId}-${currentTermYear}`}
              cellToSubject={cellToSubject}
              cellColspan={cellColspan}
              cellSkip={cellSkip}
              roomId={selectedRoomId}
              termYear={currentTermYear}
              combinedHoursMap={combinedHoursMap}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="text-center py-16">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground font-sans">
              {!currentTermYear
                ? "กำลังโหลดข้อมูลภาคเรียน..."
                : "กรุณาเลือกห้องเรียนเพื่อดูตารางการใช้งาน"}
            </p>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              เลือกห้องเรียนจากรายการด้านบนเพื่อตรวจสอบคาบเรียนและอาจารย์ผู้ใช้ห้อง
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoomTimetable({
  cellToSubject,
  cellColspan,
  cellSkip,
  roomId: _roomId,
  termYear,
  combinedHoursMap,
}: {
  cellToSubject: { [cellKey: string]: any };
  cellColspan: { [cellKey: string]: number };
  cellSkip: Set<string>;
  roomId: string;
  termYear?: string;
  combinedHoursMap?: Map<string, { lectureHour: number; labHour: number }>;
}) {
  const isTerm3 = typeof termYear === "string" && termYear.startsWith("3/");
  const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border/80">
      <table className="table-fixed border-collapse w-full">
        <thead>
          <tr className="bg-muted/40">
            <th className="border-b border-r border-border/80 px-2 py-2 text-xs font-semibold text-foreground font-sans w-[60px]">
              วัน/คาบ
            </th>
            {Array.from({ length: 25 }, (_, i) => (
              <th
                key={i}
                className="border-b border-r border-border/70 px-0.5 py-1 text-xs"
                style={{ width: `${100 / 25}%` }}
              >
                <div className="font-semibold text-foreground text-center font-sans">{i + 1}</div>
                <div className="text-[8px] font-normal text-muted-foreground leading-tight text-center font-mono">
                  {(() => {
                    const startMinutes = 8 * 60 + i * 30;
                    const endMinutes = startMinutes + 30;
                    const fmt = (m: number) => {
                      const h = Math.floor(m / 60);
                      const min = m % 60;
                      return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
                    };
                    return `${fmt(startMinutes)}-${fmt(endMinutes)}`;
                  })()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIndex) => (
            <tr key={dayIndex} className="hover:bg-muted/10 transition-colors">
              <td className="border-b border-r border-border/80 text-center font-semibold text-xs text-foreground font-sans w-[60px] bg-muted/20">
                {day}
              </td>
              {Array.from({ length: 25 }, (_, colIdx) => {
                const period = colIdx;

                if (!isTerm3 && dayIndex === 2 && period === 14) {
                  return (
                    <td
                      key={`activity-${dayIndex}-${period}`}
                      colSpan={4}
                      className="border-b border-r border-border/80 text-center bg-muted/60 font-semibold text-xs text-muted-foreground font-sans"
                    >
                      กิจกรรม
                    </td>
                  );
                }

                if (!isTerm3 && dayIndex === 2 && period > 14 && period <= 17) {
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
                    className={`border-b border-r border-border/70 text-center h-[42px] p-0 align-middle overflow-hidden text-xs transition-colors ${
                      subject
                        ? "bg-blue-500/10 dark:bg-blue-500/20 border-blue-300 dark:border-blue-800"
                        : "bg-card"
                    }`}
                    colSpan={colspan}
                  >
                    {subject ? (
                      <SubjectInCell
                        subject={{
                          ...subject,
                          startPeriod: subject.startPeriod + 1,
                          endPeriod: subject.endPeriod + 1,
                        }}
                        colspan={colspan}
                        combinedHoursMap={combinedHoursMap}
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

const getPlanTypeText = (planType: string) => {
  switch (planType) {
    case "TRANSFER":
      return "เทียบโอน";
    case "FOUR_YEAR":
      return "4 ปี";
    case "DVE-MSIX":
      return "ปวส. (ม.6)";
    case "DVE-LVC":
      return "ปวส. (ปวช.)";
    default:
      return planType;
  }
};

function SubjectInCell({
  subject,
  colspan = 1,
  combinedHoursMap,
}: {
  subject: any;
  colspan?: number;
  combinedHoursMap?: Map<string, { lectureHour: number; labHour: number }>;
}) {
  const lectureHours = subject.lectureHour || 0;
  const labHours = subject.labHour || 0;
  const totalHours = lectureHours + labHours;
  const isSplit = !!subject.subjectName?.includes("(ส่วนที่");
  const baseSec = (subject.section || "").replace(/-\d+$/, "");
  const combined = isSplit
    ? combinedHoursMap?.get(`${subject.subjectCode}-${baseSec}`)
    : undefined;
  const tooltipLectureHours = combined ? combined.lectureHour : lectureHours;
  const tooltipLabHours = combined ? combined.labHour : labHours;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-full p-1 cursor-pointer">
            <div className="text-center space-y-0.5">
              <div className="font-semibold text-xs text-foreground font-sans flex items-center justify-center gap-1">
                <span>{subject.subjectCode}</span>
                {subject.section && (
                  <span className="text-[9px] font-mono bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded-xs">
                    sec.{subject.section}
                  </span>
                )}
              </div>
              <div className="text-[10px] truncate text-muted-foreground font-sans">
                {subject.subjectName}
              </div>
              <div className="text-[8px] flex items-center justify-center gap-1">
                <span className="bg-secondary text-secondary-foreground px-1 rounded-xs font-sans">
                  {totalHours} ชม. ({lectureHours}/{labHours})
                </span>
                {colspan > 1 && (
                  <span className="bg-muted text-muted-foreground px-1 rounded-xs font-sans">
                    {colspan} คาบ
                  </span>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="bg-popover text-popover-foreground border border-border shadow-md"
        >
          <div className="text-xs p-1 space-y-1">
            <div className="font-bold text-foreground font-sans">
              {subject.subjectCode} {subject.subjectName}
              {subject.section && (
                <span className="ml-2 font-mono text-muted-foreground">กลุ่มเรียน: {subject.section}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground font-sans pt-1 border-t border-border/60">
              <div>หลักสูตร:</div>
              <div className="text-right text-foreground font-medium">
                {getPlanTypeText(subject.planType)}
              </div>
              <div>ชั้นปี:</div>
              <div className="text-right text-foreground font-medium">{subject.yearLevel}</div>
              <div>จำนวนหน่วยกิต:</div>
              <div className="text-right text-foreground font-medium">{subject.credit}</div>
              <div>ชั่วโมงบรรยาย:</div>
              <div className="text-right text-foreground font-medium">{tooltipLectureHours} ชม.</div>
              <div>ชั่วโมงปฏิบัติ:</div>
              <div className="text-right text-foreground font-medium">{tooltipLabHours} ชม.</div>
              <div>รวม:</div>
              <div className="text-right text-foreground font-medium">
                {totalHours} ชม. ({totalHours * 2} คาบ)
              </div>

              {subject.teacher && (
                <>
                  <div>ผู้สอน:</div>
                  <div className="text-right text-foreground font-medium">
                    {subject.teacher.tName} {subject.teacher.tLastName}
                  </div>
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
