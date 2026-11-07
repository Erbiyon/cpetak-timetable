import OutdepartmentTeacher from "@/components/teacher-table/out-department-teacher";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

export default function OutTeacherPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Academic Header */}
      <div className="rounded-xl border border-violet-200/80 dark:border-violet-900/60 bg-card p-6 shadow-xs transition-all">
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
                className="font-normal text-xs bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 font-sans"
              >
                วิชานอกสาขา
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <UserPlus className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              เพิ่มอาจารย์วิชาภายนอกสาขา
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              มอบหมายอาจารย์ผู้สอนสำหรับรายวิชาศึกษาทั่วไปและวิชาบูรณาการที่จัดการเรียนการสอนโดยหน่วยงานภายนอก
            </p>
          </div>
        </div>
      </div>

      <OutdepartmentTeacher />
    </div>
  );
}
