import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import DelectSubjectButtonCustom from "../delect-subject-button/delect-subject-button-custom";
import EditSubjectButtonCustom from "../edit-subject-button/edit-subject-button-custom";

export function TableCustom({ planType, termYear, yearLevel, refreshKey }: {
    planType: string,
    termYear: string,
    yearLevel: string,
    refreshKey: number
}) {
    const [plans, setPlans] = useState<any[]>([]);
    const [localRefreshKey, setLocalRefreshKey] = useState(0);

    useEffect(() => {
        async function fetchPlans() {
            const res = await fetch("/api/subject");
            if (res.ok) {
                const data = await res.json();
                const filtered = data.filter((plan: any) =>
                    plan.planType === planType &&
                    plan.termYear === termYear &&
                    plan.yearLevel === yearLevel
                );
                setPlans(filtered);
            } else {
                setPlans([]);
            }
        }
        if (planType && termYear && yearLevel) {
            fetchPlans();
        }
    }, [planType, termYear, yearLevel, refreshKey, localRefreshKey]);

    return (
        <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                    <TableHead>รหัสวิชา</TableHead>
                    <TableHead>ชื่อวิชา</TableHead>
                    <TableHead>หน่วยกิต</TableHead>
                    <TableHead>ชั่วโมงบรรยาย</TableHead>
                    <TableHead>ชั่วโมงปฎิบัติ</TableHead>
                    <TableHead>ปุ่มดำเนินการ</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {plans.length > 0 ? plans.map((plan, idx) => (
                    <TableRow key={plan.id || idx}>
                        <TableCell>{plan.subjectCode}</TableCell>
                        <TableCell>{plan.subjectName}</TableCell>
                        <TableCell>{plan.credit}</TableCell>
                        <TableCell>{plan.lectureHour}</TableCell>
                        <TableCell>{plan.labHour}</TableCell>
                        <TableCell>
                            <EditSubjectButtonCustom plan={plan} onUpdated={() => setLocalRefreshKey(k => k + 1)} />
                            <DelectSubjectButtonCustom
                                planId={plan.id}
                                subjectName={plan.subjectName}
                                onDeleted={() => setLocalRefreshKey(k => k + 1)}
                            />
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">ไม่มีข้อมูล</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}