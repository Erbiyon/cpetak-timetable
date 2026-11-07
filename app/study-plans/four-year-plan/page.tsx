"use client";

import { useMemo } from "react";
import { SelectCustom } from "@/components/select/select-custom";
import { useStudyPlanMeta } from "@/features/subjects/hooks/useStudyPlanMeta";
import { StudyPlanSectionCard } from "@/features/subjects/components/StudyPlanSectionCard";

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
    <div className="container mx-auto px-4 py-4">
      <div className="py-4 sm:py-6 lg:py-8 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-48">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 break-words leading-tight">
          แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYears.year1}
        </h1>
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
          หลักสูตรวิศวกรรมคอมพิวเตอร์{" "}
          <span className="text-green-600 font-medium">4 ปี</span> มทร.ล้านนา ตาก
        </h3>
      </div>

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <SelectCustom
          currentYear={year}
          onYearChange={handleYearChange}
          planType="FOUR_YEAR"
        />
      </div>

      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
