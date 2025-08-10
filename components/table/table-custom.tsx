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
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                        <TableHead className="text-xs lg:text-sm">รหัสวิชา</TableHead>
                        <TableHead className="text-xs lg:text-sm">ชื่อวิชา</TableHead>
                        <TableHead className="text-xs lg:text-sm text-center">หน่วยกิต</TableHead>
                        <TableHead className="text-xs lg:text-sm text-center">ชั่วโมงบรรยาย</TableHead>
                        <TableHead className="text-xs lg:text-sm text-center">ชั่วโมงปฎิบัติ</TableHead>
                        <TableHead className="text-xs lg:text-sm text-center">สาขา</TableHead>
                        <TableHead className="text-xs lg:text-sm text-center">ดำเนินการ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans.length > 0 ? plans.map((plan, idx) => (
                        <TableRow key={plan.id || idx}>
                            <TableCell className="text-xs lg:text-sm font-mono">
                                {plan.subjectCode}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm">
                                {plan.subjectName}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm text-center">
                                {plan.credit}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm text-center">
                                {plan.lectureHour}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm text-center">
                                {plan.labHour}
                            </TableCell>
                            <TableCell className="text-xs lg:text-sm text-center">
                                {plan.dep}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex flex-col lg:flex-row gap-1 lg:gap-2 justify-center">
                                    <EditSubjectButtonCustom
                                        plan={plan}
                                        onUpdated={() => setLocalRefreshKey(k => k + 1)}
                                    />
                                    <DelectSubjectButtonCustom
                                        planId={plan.id}
                                        subjectName={plan.subjectName}
                                        onDeleted={() => setLocalRefreshKey(k => k + 1)}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                                ไม่มีข้อมูล
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}