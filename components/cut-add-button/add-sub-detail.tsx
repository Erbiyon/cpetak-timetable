import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Room = {
    id: number;
    roomCode: string;
    roomType: string;
};

type Teacher = {
    id: number;
    tName: string;
    tLastName: string;
    teacherType?: string; // เพิ่ม teacherType เพื่อตรวจสอบประเภทอาจารย์
};

type SubjectDetails = {
    id: number;
    subjectName: string;
    roomId?: number | null;
    room?: Room | null;
    teacherId?: number | null;
    teacher?: Teacher | null;
    section?: string | null;
    dep?: string | null;
};

export default function AddSubDetail({ subject, onUpdate }: {
    subject?: SubjectDetails,
    onUpdate?: (isFromAddSubDetail?: boolean) => void  // เพิ่ม parameter
}) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [section, setSection] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingSection, setLoadingSection] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    // เก็บข้อมูลเดิมไว้สำหรับกรณียกเลิก
    const [originalData, setOriginalData] = useState<{
        roomId: number | null;
        teacherId: number | null;
        section: string | null;
        room: Room | null;
        teacher: Teacher | null;
    } | null>(null);

    // โหลดข้อมูลห้องเรียน
    const fetchRooms = async () => {
        try {
            setLoadingRooms(true);
            console.log("Fetching rooms...");

            const res = await fetch("/api/room");
            if (res.ok) {
                const data = await res.json();
                console.log("All rooms received:", data.length);

                const filteredRooms = data.filter((room: Room) =>
                    room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์" ||
                    room.roomType === "ตึกวิศวกรรมศาสตร์"
                );

                console.log("Filtered rooms:", filteredRooms.length, filteredRooms);
                setRooms(filteredRooms);
            } else {
                console.error("Failed to fetch rooms:", res.status, res.statusText);
                setRooms([]);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    // โหลดข้อมูลอาจารย์
    const fetchTeachers = async () => {
        try {
            setLoadingTeachers(true);
            console.log("Fetching teachers...");

            const res = await fetch("/api/teacher?inDepartment=true");
            if (res.ok) {
                const data = await res.json();
                console.log("Teachers received:", data.length, data);
                setTeachers(data);
            } else {
                console.error("Failed to fetch teachers:", res.status, res.statusText);
                setTeachers([]);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
            setTeachers([]);
        } finally {
            setLoadingTeachers(false);
        }
    };

    // โหลดข้อมูลเมื่อเปิด Dialog
    useEffect(() => {
        if (open && subject) {
            console.log("=== AddSubDetail Opening ===");
            console.log("Subject:", {
                id: subject.id,
                subjectName: subject.subjectName,
                dep: subject.dep,
                roomId: subject.roomId,
                teacherId: subject.teacherId,
                section: subject.section
            });

            // เก็บข้อมูลเดิมไว้สำหรับกรณียกเลิก
            setOriginalData({
                roomId: subject.roomId || null,
                teacherId: subject.teacherId || null,
                section: subject.section || null,
                room: subject.room || null,
                teacher: subject.teacher || null
            });

            // ตั้งค่า state ตามข้อมูลปัจจุบัน
            setSelectedRoomId(subject.roomId ? String(subject.roomId) : "NONE");
            setSelectedTeacherId(subject.teacherId ? String(subject.teacherId) : "null");
            setSection(subject.section || "");
            setSelectedRoom(subject.room || null);
            setSelectedTeacher(subject.teacher || null);

            console.log("Initial state set:", {
                selectedRoomId: subject.roomId ? String(subject.roomId) : "NONE",
                selectedTeacherId: subject.teacherId ? String(subject.teacherId) : "null",
                section: subject.section || ""
            });

            // โหลดข้อมูลล่าสุดจาก database
            const loadFreshData = async () => {
                try {
                    setLoadingSection(true);

                    console.log("Loading fresh data for subject:", subject.id);
                    const res = await fetch(`/api/subject/${subject.id}`);

                    if (res.ok) {
                        const freshData = await res.json();
                        console.log("Fresh data received:", {
                            id: freshData.id,
                            section: freshData.section,
                            roomId: freshData.roomId,
                            teacherId: freshData.teacherId,
                            room: freshData.room,
                            teacher: freshData.teacher
                        });

                        // อัปเดต state ด้วยข้อมูลล่าสุด
                        setSelectedRoomId(freshData.roomId ? String(freshData.roomId) : "NONE");
                        setSelectedTeacherId(freshData.teacherId ? String(freshData.teacherId) : "null");
                        setSection(freshData.section || "");
                        setSelectedRoom(freshData.room || null);
                        setSelectedTeacher(freshData.teacher || null);

                        // อัปเดตข้อมูลเดิมด้วยข้อมูลล่าสุด
                        setOriginalData({
                            roomId: freshData.roomId || null,
                            teacherId: freshData.teacherId || null,
                            section: freshData.section || null,
                            room: freshData.room || null,
                            teacher: freshData.teacher || null
                        });

                        console.log("State updated with fresh data");
                    }
                } catch (error) {
                    console.error("Failed to load fresh data:", error);
                } finally {
                    setLoadingSection(false);
                }
            };

            // เริ่มโหลดข้อมูลทั้งหมดพร้อมกัน
            loadFreshData();
            fetchRooms();
            fetchTeachers();
            setError(null);
        }
    }, [open, subject?.id]);

    // ฟังก์ชันจัดการการเลือกห้อง
    const handleRoomChange = (value: string) => {
        console.log("Room selection changed:", value);
        setSelectedRoomId(value);

        if (value === "NONE") {
            setSelectedRoom(null);
        } else if (value !== "no-rooms") {
            const room = rooms.find(r => r.id === parseInt(value));
            if (room) {
                setSelectedRoom(room);
                console.log("Room selected:", room);
            }
        }
    };

    // ฟังก์ชันจัดการการเลือกอาจารย์
    const handleTeacherChange = (value: string) => {
        console.log("Teacher selection changed:", value);
        setSelectedTeacherId(value);

        if (value === "null") {
            setSelectedTeacher(null);
        } else if (value !== "no-teachers") {
            const teacher = teachers.find(t => t.id === parseInt(value));
            if (teacher) {
                setSelectedTeacher(teacher);
                console.log("Teacher selected:", teacher);
            }
        }
    };

    // ฟังก์ชันสำหรับยกเลิก - ไม่ต้อง mutate subject object
    const handleCancel = () => {
        console.log("Cancelling - not mutating subject object");

        // รีเซ็ต state เท่านั้น ไม่ต้อง mutate subject object
        setSelectedRoomId(null);
        setSelectedTeacherId(null);
        setSelectedRoom(null);
        setSelectedTeacher(null);
        setSection("");
        setError(null);
        setOriginalData(null);

        // ปิด dialog
        setOpen(false);
    };

    // แก้ไขเมื่อกดปุ่มบันทึก
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) {
            setError("ไม่พบข้อมูลวิชา");
            return;
        }

        try {
            setLoading(true);

            const submitData = {
                roomId: selectedRoom?.id || null,
                teacherId: selectedTeacher?.id || null,
                section: section || null
            };

            console.log("=== Submitting AddSubDetail ===");
            console.log("Subject ID:", subject.id);
            console.log("Submit data:", submitData);

            // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
            const updateResponse = await fetch(`/api/subject/${subject.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.error || 'การอัปเดตข้อมูลล้มเหลว');
            }

            const updatedData = await updateResponse.json();
            console.log("Update response received:", updatedData);

            // รีเซ็ต state
            setOriginalData(null);

            // ปิด dialog
            setOpen(false);

            // Force refresh หน้าเว็บแบบล้างทั้งหมด (เหมือน Ctrl+F5)
            window.location.reload();

        } catch (error: any) {
            console.error("Submit Error:", error);
            setError(error.message || "เกิดข้อผิดพลาดในการดำเนินการ");
        } finally {
            setLoading(false);
        }
    };

    // ตรวจสอบว่าปิด Dialog ถ้า subject ไม่มีค่า
    useEffect(() => {
        if (!subject && open) {
            setOpen(false);
        }
    }, [subject, open]);

    if (!subject) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                if (!newOpen) {
                    // เมื่อปิด dialog (ไม่ว่าจะด้วยวิธีไหน) ให้เรียก handleCancel
                    handleCancel();
                } else {
                    setOpen(newOpen);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost"><PlusCircle color="#00ff00" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>เพิ่มรายละเอียด</DialogTitle>
                    <DialogDescription>
                        {`กรุณากรอกข้อมูลรายละเอียดเพิ่มเติมสำหรับวิชา ${subject.subjectName}`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* ห้องเรียน */}
                        <div className="grid gap-3">
                            <Label htmlFor="room">ห้องเรียน</Label>
                            {subject.dep === "นอกสาขา" ? (
                                <Input
                                    value={subject.room?.roomCode || "ไม่ระบุ"}
                                    disabled
                                    className="bg-muted"
                                />
                            ) : (
                                <Select
                                    value={selectedRoomId || "NONE"}
                                    onValueChange={handleRoomChange}
                                    disabled={loadingRooms}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={loadingRooms ? "กำลังโหลดห้องเรียน..." : "เลือกห้องเรียน"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                                        {rooms.length > 0 ? (
                                            rooms.map((room) => (
                                                <SelectItem key={room.id} value={String(room.id)}>
                                                    {room.roomCode} ({room.roomType})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            !loadingRooms && (
                                                <SelectItem value="no-rooms" disabled>
                                                    ไม่พบข้อมูลห้องเรียน
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            {loadingRooms && (
                                <div className="text-xs text-muted-foreground">
                                    กำลังโหลดข้อมูลห้องเรียน...
                                </div>
                            )}
                        </div>

                        {/* อาจารย์ */}
                        <div className="grid gap-3">
                            <Label htmlFor="teacher">อาจารย์</Label>
                            {subject.dep === "นอกสาขา" ? (
                                <Input
                                    value={subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : "ไม่ระบุ"}
                                    disabled
                                    className="bg-muted"
                                />
                            ) : (
                                <Select
                                    value={selectedTeacherId || "null"}
                                    onValueChange={handleTeacherChange}
                                    disabled={loadingTeachers}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={loadingTeachers ? "กำลังโหลดอาจารย์..." : "เลือกอาจารย์"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">ไม่ระบุ</SelectItem>
                                        {teachers.length > 0 ? (
                                            teachers.map((teacher) => (
                                                <SelectItem key={teacher.id} value={String(teacher.id)}>
                                                    {teacher.tName} {teacher.tLastName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            !loadingTeachers && (
                                                <SelectItem value="no-teachers" disabled>
                                                    ไม่พบข้อมูลอาจารย์
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            {loadingTeachers && (
                                <div className="text-xs text-muted-foreground">
                                    กำลังโหลดข้อมูลอาจารย์...
                                </div>
                            )}
                        </div>

                        {/* Section */}
                        <div className="grid gap-3">
                            <Label htmlFor="section">Section</Label>
                            <div className="relative">
                                <Input
                                    id="section"
                                    name="section"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    placeholder={loadingSection ? "กำลังโหลดข้อมูล..." : "ระบุ section (ตัวเลข)"}
                                    disabled={loadingSection}
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        {subject.dep === "นอกสาขา" && (
                            <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                                หมายเหตุ: วิชานอกสาขาไม่สามารถแก้ไขห้องเรียนและอาจารย์ได้
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || loadingRooms || loadingTeachers}
                        >
                            {loading ? (
                                <>กำลังบันทึก...</>
                            ) : (
                                'บันทึก'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}