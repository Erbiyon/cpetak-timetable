"use client";

import { useMemo } from "react";
import { SelectCustom } from "@/components/select/select-custom";
import { useStudyPlanMeta } from "@/features/subjects/hooks/useStudyPlanMeta";
import { StudyPlanSectionCard } from "@/features/subjects/components/StudyPlanSectionCard";
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck } from "lucide-react";

export default function FourYearPlan() {
  const { year, handleYearChange, terms, yearLevels } = useStudyPlanMeta();

  const currentBuddhistYear = useMemo(() => new Date().getFullYear() + 543, []);
  const baseYear = useMemo(
    () => (year ? parseInt(year, 10) : currentBuddhistYear),
    [year, currentBuddhistYear]
  );

  const academicYears = useMemo(
    () => ({
      year1: baseYear,
      year2: baseYear + 1,
      year3: baseYear + 2,
      year4: baseYear + 3,
    }),
    [baseYear]
  );

  const planSections = useMemo(
    () => [
      // ปี 1
      {
        yearLevel: yearLevels[0]?.name,
        term: terms[0]?.name,
        academicYear: academicYears.year1,
      },
      {
        yearLevel: yearLevels[0]?.name,
        term: terms[1]?.name,
        academicYear: academicYears.year1,
      },
      // ปี 2
      {
        yearLevel: yearLevels[1]?.name,
        term: terms[0]?.name,
        academicYear: academicYears.year2,
      },
      {
        yearLevel: yearLevels[1]?.name,
        term: terms[1]?.name,
        academicYear: academicYears.year2,
      },
      // ปี 3
      {
        yearLevel: yearLevels[2]?.name,
        term: terms[0]?.name,
        academicYear: academicYears.year3,
      },
      {
        yearLevel: yearLevels[2]?.name,
        term: terms[1]?.name,
        academicYear: academicYears.year3,
      },
      // ปี 4
      {
        yearLevel: yearLevels[3]?.name,
        term: terms[0]?.name,
        academicYear: academicYears.year4,
      },
      {
        yearLevel: yearLevels[3]?.name,
        term: terms[1]?.name,
        academicYear: academicYears.year4,
      },
    ],
    [terms, yearLevels, academicYears]
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Academic Header */}
      <div className="rounded-xl border border-indigo-300/80 dark:border-indigo-800/80 bg-card p-6 shadow-xs transition-all">
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
                className="font-normal text-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-sans"
              >
                หลักสูตร 4 ปี
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <BookOpenCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              แผนการเรียนหลักสูตร 4 ปี
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYears.year1}
            </p>
          </div>
          <div className="w-full md:w-auto">
            <SelectCustom
              currentYear={year}
              onYearChange={handleYearChange}
              planType="FOUR_YEAR"
            />
          </div>
        </div>
      </div>

      {/* Plan Sections */}
      <div className="space-y-6">
        {planSections.map((section, idx) => (
          <StudyPlanSectionCard
            key={`${section.yearLevel}-${section.term}-${section.academicYear}-${idx}`}
            planType="FOUR_YEAR"
            termName={section.term}
            yearLevelName={section.yearLevel}
            academicYear={section.academicYear}
            curriculumType="BACHELOR"
          />
        ))}
      </div>
    </div>
  );
}
