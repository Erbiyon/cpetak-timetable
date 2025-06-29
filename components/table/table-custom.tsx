import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"

export function TableCustom({ planType, termYear, yearLevel }: {
    planType: string,
    termYear: string,
    yearLevel: string,
}) {
    const [plans, setPlans] = useState<any[]>([]);

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
    }, [planType, termYear, yearLevel]);

    return (
        <Table>
            <TableHeader className="sticky top-0 z-10">
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
                            {/* ปุ่มดำเนินการ */}
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