"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTeacherCustom } from "../add-teacher/add-teacher-custom";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
import EditTeacherButtonCustom from "../edit-delect-teacher-buttom/edit-teacher-buttom-custom";
import DeleteTeacherButtonCustom from "../edit-delect-teacher-buttom/delect-teacher-buttom-custom";
import { Badge } from "@/components/ui/badge";

type Teacher = {
  id: number;
  tId: string;
  tName: string;
  tLastName: string;
  teacherType: string;
};

export default function OutTeacher() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/teacher?inDepartment=false");
      if (res.ok) {
        const data = await res.json();

        const filteredTeachers = data.filter(
          (teacher: Teacher) => teacher.teacherType === "อาจารย์ภายนอกสาขา",
        );
        setTeachers(filteredTeachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 border-b border-border/80 bg-muted/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-sans">
              <UserPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              อาจารย์ภายนอกสาขา
            </h2>
            <Badge variant="outline" className="text-xs font-mono font-medium border-border">
              {teachers.length} ท่าน
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            อาจารย์ผู้สอนรายวิชาศึกษาทั่วไปและวิชาบูรณาการนอกสาขา
          </p>
        </div>
        <AddTeacherCustom
          onAdded={fetchTeachers}
          teacherType="อาจารย์ภายนอกสาขา"
        />
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground font-sans">
              กำลังโหลดข้อมูลอาจารย์...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-foreground font-sans">
                    รหัสประจำตัว
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground font-sans">
                    ชื่อจริง
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground font-sans">
                    นามสกุล
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-foreground font-sans">
                    ดำเนินการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length > 0 ? (
                  teachers.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors border-b border-border/60">
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        {t.tId}
                      </TableCell>
                      <TableCell className="text-xs font-sans text-foreground">
                        {t.tName}
                      </TableCell>
                      <TableCell className="text-xs font-sans text-foreground">
                        {t.tLastName}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <EditTeacherButtonCustom
                            teacher={t}
                            onUpdated={fetchTeachers}
                          />
                          <DeleteTeacherButtonCustom
                            teacherId={t.id}
                            teacherName={`${t.tName} ${t.tLastName}`}
                            onDeleted={fetchTeachers}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="text-center text-muted-foreground py-10 text-xs font-sans"
                      colSpan={4}
                    >
                      <Users className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                      ไม่มีข้อมูลอาจารย์ภายนอกสาขา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
