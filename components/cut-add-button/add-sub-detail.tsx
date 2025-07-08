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

            fetchRooms();
            fetchTeachers();
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
            // อัปเดตข้อมูลใน subject object โดยตรง
            // ซึ่งทำไว้แล้วใน useEffect แต่ให้ทำซ้ำอีกครั้งเพื่อความมั่นใจ

            if (selectedRoom) {
                subject.room = selectedRoom;
                subject.roomId = selectedRoom.id;
            } else {
                subject.room = null;
                subject.roomId = null;
            }

            // แก้ไขส่วนการอัปเดตข้อมูลอาจารย์ในฟังก์ชัน handleSubmit

            // เปลี่ยนเงื่อนไขการอัปเดตข้อมูลอาจารย์
            if (selectedTeacher) {
                subject.teacher = selectedTeacher;
                subject.teacherId = selectedTeacher.id;
            } else {
                // ไม่ว่าจะมี teacherId อยู่แล้วหรือไม่ ถ้าไม่ได้เลือก ก็ให้เป็น null
                subject.teacher = null;
                subject.teacherId = null;
            }

            subject.section = section || null;

            console.log("ข้อมูลที่จะแสดงใน tooltip:", {
                room: subject.room?.roomCode || null,
                teacher: subject.teacher ? `${subject.teacher.tName} ${subject.teacher.tLastName}` : null,
                section: subject.section || null
            });

            // ปิด dialog
            setOpen(false);

            // เรียก callback เพื่อรีเรนเดอร์ UI
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error("Submit Error:", error);
            setError(error.message || "เกิดข้อผิดพลาดในการดำเนินการ");
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
                            <Input
                                id="section"
                                name="section"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                placeholder="ระบุ section (ตัวเลข)"
                            />
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
                            >
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <Button type="submit">
                            ตกลง
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}