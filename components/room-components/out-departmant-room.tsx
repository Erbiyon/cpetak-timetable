import { teardownTraceSubscriber } from "next/dist/build/swc/generated-native";
import AddRoomSubjectOutCustom from "../add-room-subject-out/add-room-subject-out-custom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";
import { useEffect, useState } from "react";

type Subject = {
    id: number;
    subjectName: string;
    roomCode?: string;
    yearLevel: string;
    room?: {
        roomCode?: string;
    };
};

export default function OutdepartmentRoom() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [termYear, setTermYear] = useState<string>("x/xxxx")

    const fetchSubjects = async () => {
        const res = await fetch("/api/subject");
        const data = await res.json();
        setSubjects(data.filter((s: any) => s.dep === "นอกสาขา" && s.termYear === `ภาคเรียนที่ ${termYear}`));
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        async function fetchTermYear() {
            const res = await fetch("/api/term-year")
            if (res.ok) {
                const data = await res.json()
                setTermYear(data.termYear)
            }
        }
        fetchTermYear()
    }, []);

    useEffect(() => {
        if (termYear !== "x/xxxx") {
            fetchSubjects();
        }
    }, [termYear]);

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-5 shadow-sm mx-auto">
            <div className="mx-4">
                <h1 className="py-4">อาคารนอกสาขา ภาคเรียนที่ {termYear}</h1>
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mb-5 shadow-sm max-h-[71vh] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-card">
                            <TableRow>
                                <TableHead>เลขห้อง</TableHead>
                                <TableHead>ชื่อวิชา</TableHead>
                                <TableHead>ปุ่มดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.length > 0 ? (
                                subjects.map(subject => (
                                    <TableRow key={subject.id}>
                                        <TableCell>{subject.room?.roomCode ?? "-"}</TableCell>
                                        <TableCell>{subject.subjectName} ({subject.yearLevel})</TableCell>
                                        <TableCell className="text-center">
                                            <AddRoomSubjectOutCustom
                                                subjectId={subject.id}
                                                roomCode={subject.room?.roomCode ?? ""}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">ไม่มีข้อมูล</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}