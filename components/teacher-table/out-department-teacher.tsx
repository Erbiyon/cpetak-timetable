"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { AddTeacherSubjectOutCustom } from "../add-teacher-subject-out/add-teacher-subject-out-custom";
import { Badge } from "@/components/ui/badge";
import CoTeachingInfo from "../co-teaching-Info/co-teaching-Info-custom";

type Subject = {
  id: number;
  subjectName: string;
  subjectCode: string;
  yearLevel: string;
  planType: string;
  termYear: string;
  dep?: string;
  teacherId?: number | null;
  teacher?: {
    id: number;
    tName: string;
    tLastName: string;
  } | null;
};

type GroupedSubjects = {
  [planType: string]: {
    [yearLevel: string]: Subject[];
  };
};

export default function OutdepartmentTeacher() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [termYear, setTermYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subject");
      if (res.ok) {
        const data = await res.json();
        console.log("API response:", data);

        const filteredSubjects = data.filter(
          (s: any) =>
            s.dep === "นอกสาขา" && s.termYear === `ภาคเรียนที่ ${termYear}`,
        );
        console.log("Filtered subjects:", filteredSubjects);

        setSubjects(filteredSubjects);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    } finally {
      setLoading(false);
    }
  }, [termYear]);

  useEffect(() => {
    async function fetchTermYear() {
      try {
        const res = await fetch("/api/current-term-year");
        if (res.ok) {
          const data = await res.json();
          setTermYear(data.termYear);
        }
      } catch (error) {
        console.error("Failed to fetch term year:", error);
        setLoading(false);
      }
    }
    fetchTermYear();
  }, []);

  useEffect(() => {
    if (termYear) {
      fetchSubjects();
    }
  }, [termYear, refreshKey, fetchSubjects]);

  const getPlanTypeText = (planType: string) => {
    switch (planType) {
      case "TRANSFER":
        return "เทียบโอน";
      case "FOUR_YEAR":
        return "4 ปี";
      case "DVE-MSIX":
        return "ปวส. (ม.6)";
      case "DVE-LVC":
        return "ปวส. (ปวช.)";
      default:
        return planType;
    }
  };

  const handleTeacherUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const groupedSubjects: GroupedSubjects = subjects.reduce((acc, subject) => {
    if (!acc[subject.planType]) {
      acc[subject.planType] = {};
    }
    if (!acc[subject.planType][subject.yearLevel]) {
      acc[subject.planType][subject.yearLevel] = [];
    }
    acc[subject.planType][subject.yearLevel].push(subject);
    return acc;
  }, {} as GroupedSubjects);

  const sortYearLevels = (yearLevels: string[]) => {
    return yearLevels.sort((a, b) => {
      const getYearNumber = (yearLevel: string) => {
        const match = yearLevel.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const yearA = getYearNumber(a);
      const yearB = getYearNumber(b);

      return yearA - yearB;
    });
  };

  const isDVE = (planType: string) => {
    return planType.startsWith("DVE");
  };

  const sortPlanTypes = (planTypes: string[]) => {
    const order = ["DVE-MSIX", "DVE-LVC", "TRANSFER", "FOUR_YEAR"];
    return planTypes.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const getPlanTypeTheme = (planType: string) => {
    switch (planType) {
      case "DVE-LVC":
        return {
          border: "border-amber-300/80 dark:border-amber-800/80",
          badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          dot: "bg-amber-500",
        };
      case "DVE-MSIX":
        return {
          border: "border-emerald-300/80 dark:border-emerald-800/80",
          badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          dot: "bg-emerald-500",
        };
      case "TRANSFER":
        return {
          border: "border-sky-300/80 dark:border-sky-800/80",
          badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          dot: "bg-sky-500",
        };
      case "FOUR_YEAR":
        return {
          border: "border-indigo-300/80 dark:border-indigo-800/80",
          badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          dot: "bg-indigo-500",
        };
      default:
        return {
          border: "border-border",
          badge: "bg-secondary text-secondary-foreground border-border",
          dot: "bg-zinc-500",
        };
    }
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 border-b border-border/80 bg-muted/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground font-sans">
              กำหนดผู้สอนในแต่ละรายวิชาภายนอกสาขา
            </h2>
            {termYear && (
              <Badge variant="outline" className="text-xs font-mono font-medium border-border">
                {termYear}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            รายวิชาศึกษาทั่วไปและวิชาที่เรียนกับอาจารย์ภายนอกสาขา
          </p>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground font-sans">
              กำลังโหลดข้อมูลวิชานอกสาขา...
            </span>
          </div>
        ) : Object.keys(groupedSubjects).length > 0 ? (
          <div className="space-y-6">
            {sortPlanTypes(Object.keys(groupedSubjects)).map((planType) => {
              const yearLevels = groupedSubjects[planType];
              const theme = getPlanTypeTheme(planType);

              return (
                <div key={planType} className={`space-y-4 rounded-xl border p-4 bg-card/60 shadow-2xs ${theme.border}`}>
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                      <h3 className="font-bold text-sm sm:text-base text-foreground font-sans">
                        {getPlanTypeText(planType)}
                      </h3>
                    </div>
                    <Badge variant="outline" className={`text-xs font-normal font-sans ${theme.badge}`}>
                      {Object.values(yearLevels).flat().length} รายวิชา
                    </Badge>
                  </div>

                  {sortYearLevels(Object.keys(yearLevels)).map((yearLevel) => {
                    const subjects = yearLevels[yearLevel];

                    return (
                      <div
                        key={`${planType}-${yearLevel}`}
                        className="space-y-2 pt-1"
                      >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border/50">
                          <span className="font-semibold text-xs text-foreground font-sans">
                            {yearLevel}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border">
                            {subjects.length} วิชา
                          </Badge>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-border/70">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow className="border-b border-border/60 hover:bg-transparent">
                                <TableHead className="w-[130px] text-xs font-semibold text-foreground font-sans">
                                  ชื่อจริง
                                </TableHead>
                                <TableHead className="w-[130px] text-xs font-semibold text-foreground font-sans">
                                  นามสกุล
                                </TableHead>
                                <TableHead className="w-[110px] text-xs font-semibold text-foreground font-sans">
                                  รหัสวิชา
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-foreground font-sans">
                                  ชื่อวิชา
                                </TableHead>
                                <TableHead className="text-center w-[120px] text-xs font-semibold text-foreground font-sans">
                                  สอนร่วม
                                </TableHead>
                                <TableHead className="text-center w-[110px] text-xs font-semibold text-foreground font-sans">
                                  ดำเนินการ
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subjects.map((subject) => (
                                <TableRow
                                  key={subject.id}
                                  className="hover:bg-muted/30 transition-colors border-b border-border/60"
                                >
                                  <TableCell className="text-xs font-sans font-medium text-foreground">
                                    {subject.teacher?.tName || "-"}
                                  </TableCell>
                                  <TableCell className="text-xs font-sans text-foreground">
                                    {subject.teacher?.tLastName || "-"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-foreground">
                                    {subject.subjectCode}
                                  </TableCell>
                                  <TableCell className="text-xs font-sans text-foreground">
                                    {subject.subjectName}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isDVE(subject.planType) ? null : (
                                      <CoTeachingInfo subjectId={subject.id} />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <AddTeacherSubjectOutCustom
                                      subjectId={subject.id}
                                      teacherName={`${subject.teacher?.tName || ""} ${subject.teacher?.tLastName || ""}`.trim()}
                                      onUpdate={handleTeacherUpdated}
                                      subjectCode={subject.subjectCode}
                                      planType={subject.planType}
                                      termYear={termYear}
                                      yearLevel={subject.yearLevel}
                                      subjectName={subject.subjectName}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12 text-xs font-sans">
            {termYear
              ? `ไม่มีวิชานอกสาขาในภาคเรียน ${termYear}`
              : "ไม่มีข้อมูลภาคเรียน"}
          </div>
        )}
      </div>
    </div>
  );
}
