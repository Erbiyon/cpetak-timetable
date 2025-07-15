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
    onUpdate?: () => void
}) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); // เพิ่มตัวแปรเก็บห้องที่เลือก
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null); // เพิ่มตัวแปรเก็บอาจารย์ที่เลือก
    const [section, setSection] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // เพิ่ม state สำหรับแสดงสถานะการโหลด section
    const [loadingSection, setLoadingSection] = useState(false);

    // อัปเดตเมื่อมีการเลือกห้อง
    useEffect(() => {
        if (selectedRoomId && selectedRoomId !== "NONE") {
            const roomId = parseInt(selectedRoomId, 10);
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                setSelectedRoom(room);
                // อัปเดต subject.room ด้วย แทนที่จะส่งไป API
                if (subject) {
                    subject.room = room;
                    subject.roomId = room.id;
                }
            }
        } else if (selectedRoomId === "NONE") {
            setSelectedRoom(null);
            if (subject) {
                subject.room = null;
                subject.roomId = null;
            }
        }
    }, [selectedRoomId, rooms, subject]);

    // อัปเดตเมื่อมีการเลือกอาจารย์
    useEffect(() => {
        if (selectedTeacherId && selectedTeacherId !== "null") {
            const teacherId = parseInt(selectedTeacherId, 10);
            const teacher = teachers.find(t => t.id === teacherId);
            if (teacher) {
                setSelectedTeacher(teacher);
                // อัปเดต subject.teacher โดยไม่ต้องมีเงื่อนไข
                if (subject) {
                    subject.teacher = teacher;
                    subject.teacherId = teacher.id;
                }
            }
        } else if (selectedTeacherId === "null") {
            setSelectedTeacher(null);
            if (subject) {
                // เมื่อเลือก "ไม่ระบุ" ให้ล้างข้อมูลอาจารย์โดยไม่ต้องมีเงื่อนไข
                subject.teacher = null;
                subject.teacherId = null;
            }
        }
    }, [selectedTeacherId, teachers, subject]);

    // อัปเดต section
    useEffect(() => {
        if (subject) {
            subject.section = section || null;
        }
    }, [section, subject]);

    // โหลดข้อมูลห้องและอาจารย์เมื่อเปิด Dialog
    useEffect(() => {
        if (open && subject) {
            setSelectedRoomId(subject.roomId ? String(subject.roomId) : "NONE");
            setSelectedTeacherId(subject.teacherId ? String(subject.teacherId) : "null");
            setSection(subject.section || "");
            setSelectedRoom(subject.room || null);
            setSelectedTeacher(subject.teacher || null);
            setError(null);

            // โหลดข้อมูลห้องเรียน
            const fetchRooms = async () => {
                try {
                    const res = await fetch("/api/room");
                    if (res.ok) {
                        const data = await res.json();
                        // กรองเฉพาะห้องที่อยู่ในอาคารที่กำหนด
                        const filteredRooms = data.filter((room: Room) =>
                            room.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์" ||
                            room.roomType === "ตึกวิศวกรรมศาสตร์"
                        );
                        setRooms(filteredRooms);
                    }
                } catch (error) {
                    console.error("Failed to fetch rooms:", error);
                }
            };

            // โหลดข้อมูลอาจารย์
            const fetchTeachers = async () => {
                try {
                    // ดึงเฉพาะอาจารย์ภายในสาขา
                    const res = await fetch("/api/teacher?inDepartment=true");
                    if (res.ok) {
                        const data = await res.json();
                        setTeachers(data);

                        // ถ้ามีอาจารย์อยู่แล้ว ให้เช็คว่าอาจารย์คนนั้นอยู่ในรายการที่โหลดมาหรือไม่
                        if (subject.teacherId) {
                            const currentTeacher = data.find((t: Teacher) => t.id === subject.teacherId);
                            if (currentTeacher) {
                                // ถ้าอาจารย์ปัจจุบันอยู่ในรายการ ให้เซ็ตค่า selectedTeacher
                                setSelectedTeacher(currentTeacher);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch teachers:", error);
                }
            };

            // เพิ่มฟังก์ชันดึงข้อมูล section จาก timetable_tb
            const fetchTimetableSection = async () => {
                if (subject.id) {
                    try {
                        setLoadingSection(true);
                        const res = await fetch(`/api/timetable?planId=${subject.id}`);
                        if (res.ok) {
                            const timetableData = await res.json();
                            // ถ้ามีข้อมูลในตาราง timetable และมี section
                            if (timetableData.length > 0 && timetableData[0].section) {
                                setSection(timetableData[0].section);
                                // อัปเดต section ในอ็อบเจกต์ subject ด้วย
                                if (subject) {
                                    subject.section = timetableData[0].section;
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch timetable section:", error);
                    } finally {
                        setLoadingSection(false);
                    }
                }
            };

            fetchRooms();
            fetchTeachers();
            fetchTimetableSection(); // เรียกฟังก์ชันใหม่
        }
    }, [open, subject]);

    // แก้ไขเมื่อกดปุ่มบันทึก - ไม่ต้องส่ง API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) {
            setError("ไม่พบข้อมูลวิชา");
            return;
        }

        try {
            setLoading(true);

            // อัปเดตข้อมูลใน subject object
            if (selectedRoom) {
                subject.room = selectedRoom;
                subject.roomId = selectedRoom.id;
            } else {
                subject.room = null;
                subject.roomId = null;
            }

            if (selectedTeacher) {
                subject.teacher = selectedTeacher;
                subject.teacherId = selectedTeacher.id;
            } else {
                subject.teacher = null;
                subject.teacherId = null;
            }

            subject.section = section || null;

            console.log("ข้อมูลที่จะส่งไปอัปเดต:", {
                id: subject.id,
                roomId: subject.roomId,
                teacherId: subject.teacherId,
                section: subject.section
            });

            // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
            const updateResponse = await fetch(`/api/subject/${subject.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: subject.roomId,
                    teacherId: subject.teacherId,
                    section: subject.section
                }),
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`การอัปเดตข้อมูลล้มเหลว: ${errorText}`);
            }

            const updatedData = await updateResponse.json();
            console.log("อัปเดตข้อมูลสำเร็จ:", updatedData);
            // Add this logging to confirm section is correctly updated
            console.log("Section after update:", updatedData.section);

            // ปิด dialog
            setOpen(false);

            // Force a refresh of the subject data to ensure section is loaded
            try {
                const refreshResponse = await fetch(`/api/subject/${subject.id}`);
                if (refreshResponse.ok) {
                    const refreshedData = await refreshResponse.json();
                    // Update the local subject object with refreshed data
                    Object.assign(subject, refreshedData);
                    console.log("Subject refreshed:", subject);
                }
            } catch (error) {
                console.error("Failed to refresh subject data:", error);
            }

            // เรียก callback เพื่ออัปเดต UI
            if (onUpdate) onUpdate();
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
        return null; // ไม่แสดงอะไรถ้า subject เป็น undefined
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            // เมื่อปิด dialog แบบคลิกข้างนอก ให้เรียก callback
            if (open && !newOpen && onUpdate) {
                onUpdate();
            }
            setOpen(newOpen);
        }}>
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
                                    onValueChange={setSelectedRoomId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกห้องเรียน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={String(room.id)}>
                                                {room.roomCode} ({room.roomType})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="teacher">อาจารย์</Label>
                            {/* แก้ไขเงื่อนไขการแสดง select อาจารย์ ให้เปลี่ยนแปลงได้เสมอ ยกเว้นวิชานอกสาขา */}
                            {subject.dep === "นอกสาขา" ? (
                                <Input
                                    value={subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : "ไม่ระบุ"}
                                    disabled
                                    className="bg-muted"
                                />
                            ) : (
                                <Select
                                    value={selectedTeacherId || "null"}
                                    onValueChange={setSelectedTeacherId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกอาจารย์" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">ไม่ระบุ</SelectItem>
                                        {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={String(teacher.id)}>
                                                {teacher.tName} {teacher.tLastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    if (onUpdate) onUpdate(); // เรียก callback เมื่อกดยกเลิก
                                }}
                                disabled={loading}
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                'ตกลง'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}