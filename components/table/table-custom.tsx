import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import DelectSubjectButtonCustom from "../delect-subject-button/delect-subject-button-custom";
import EditSubjectButtonCustom from "../edit-subject-button/edit-subject-button-custom";
import { Badge } from "@/components/ui/badge";
import { FileQuestion } from "lucide-react";

export function TableCustom({
  planType,
  termYear,
  yearLevel,
  curriculumType,
  refreshKey,
}: {
  planType: string;
  termYear: string;
  yearLevel: string;
  curriculumType?: "DVE" | "BACHELOR";
  refreshKey: number;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchPlans() {
      const res = await fetch("/api/subject");
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(
          (plan: any) =>
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
    <div className="w-full overflow-x-auto rounded-lg border border-border/80">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-b border-border/80 hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground font-sans w-[100px]">
              รหัสวิชา
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans min-w-[280px]">
              ชื่อวิชา
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans text-center w-[70px]">
              หน่วยกิต
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans text-center w-[90px]">
              บรรยาย (ชม.)
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans text-center w-[90px]">
              ปฏิบัติ (ชม.)
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans text-center w-[120px]">
              หมวดหมู่วิชา
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground font-sans text-center w-[110px]">
              ดำเนินการ
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length > 0 ? (
            plans.map((plan, idx) => (
              <TableRow key={plan.id || idx} className="hover:bg-muted/30 transition-colors border-b border-border/60">
                <TableCell className="text-xs font-mono font-medium text-foreground">
                  {plan.subjectCode}
                </TableCell>
                <TableCell className="text-xs font-sans text-foreground">
                  {plan.subjectName}
                </TableCell>
                <TableCell className="text-xs font-sans font-semibold text-center text-foreground">
                  {plan.credit}
                </TableCell>
                <TableCell className="text-xs font-sans text-center text-muted-foreground">
                  {plan.lectureHour}
                </TableCell>
                <TableCell className="text-xs font-sans text-center text-muted-foreground">
                  {plan.labHour}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-normal font-sans ${
                      plan.dep === "วิชาในสาขา"
                        ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                        : "border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10"
                    }`}
                  >
                    {plan.dep || "ในสาขา"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <EditSubjectButtonCustom
                      plan={plan}
                      curriculumType={curriculumType}
                      onUpdated={() => setLocalRefreshKey((k) => k + 1)}
                    />
                    <DelectSubjectButtonCustom
                      planId={plan.id}
                      subjectName={plan.subjectName}
                      onDeleted={() => setLocalRefreshKey((k) => k + 1)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-xs text-muted-foreground py-10 font-sans"
              >
                <FileQuestion className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                ยังไม่มีข้อมูลรายวิชาในส่วนนี้
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
