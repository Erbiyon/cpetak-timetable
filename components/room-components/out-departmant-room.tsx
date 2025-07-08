import { useEffect, useState } from "react";
import AddRoomSubjectOutCustom from "../add-room-subject-out/add-room-subject-out-custom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";

type Subject = {
    id: number;
    subjectName: string;
    subjectCode: string;
    yearLevel: string;
    planType: string;
    dep?: string;
    roomId?: number | null;
    room?: {
        id: number;
        roomCode: string;
    } | null;
};

export default function OutdepartmentRoom() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [termYear, setTermYear] = useState<string>("x/xxxx");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchSubjects = async () => {
        try {
            const res = await fetch("/api/subject");
            if (res.ok) {
                const data = await res.json();
                console.log("API response:", data); // ดูข้อมูลที่ได้จาก API

                // กรองเฉพาะวิชานอกสาขาในภาคเรียนปัจจุบัน
                const filteredSubjects = data.filter((s: any) =>
                    s.dep === "นอกสาขา" &&
                    s.termYear === `ภาคเรียนที่ ${termYear}`
                );
                console.log("Filtered subjects:", filteredSubjects); // ดูข้อมูลหลังกรอง

                setSubjects(filteredSubjects);
            }
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        }
    };

    // โหลดข้อมูล term year ปัจจุบัน
    useEffect(() => {
        async function fetchTermYear() {
            try {
                const res = await fetch("/api/term-year");
                if (res.ok) {
                    const data = await res.json();
                    setTermYear(data.termYear);
                }
            } catch (error) {
                console.error("Failed to fetch term year:", error);
            }
        }
        fetchTermYear();
    }, []);

    // โหลดข้อมูลวิชาเมื่อมีการเปลี่ยน term year หรือมีการรีเฟรช
    useEffect(() => {
        if (termYear !== "x/xxxx") {
            fetchSubjects();
        }
    }, [termYear, refreshKey]);

    // ฟังก์ชันสำหรับแปลง planType เป็นข้อความภาษาไทย
    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DEV-MSIX": return "ม.6 ขึ้น ปวส.";
            case "DVE-LVC": return "ปวช. ขึ้น ปวส.";
            default: return planType;
        }
    };

    // ฟังก์ชันสำหรับรีโหลดข้อมูลหลังจากอัปเดต
    const handleRoomUpdated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-4">อาคารนอกสาขา ภาคเรียนที่ {termYear}</h1>
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-5 shadow-sm max-h-[71vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                            <TableRow>
                                <TableHead>เลขห้อง</TableHead>
                                <TableHead>รหัสวิชา</TableHead>
                                <TableHead>ชื่อวิชา</TableHead>
                                <TableHead className="text-center">ดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.length > 0 ? (
                                subjects.map(subject => (
                                    <TableRow key={subject.id}>
                                        <TableCell>{subject.room?.roomCode || "-"}</TableCell>
                                        <TableCell>{subject.subjectCode}</TableCell>
                                        <TableCell>
                                            {subject.subjectName} ({getPlanTypeText(subject.planType)}) ({subject.yearLevel})
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <AddRoomSubjectOutCustom
                                                subjectId={subject.id}
                                                roomCode={subject.room?.roomCode || ""}
                                                onUpdate={handleRoomUpdated}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        ไม่มีวิชานอกสาขาในภาคเรียนนี้
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}