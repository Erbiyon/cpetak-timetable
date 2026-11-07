import React from "react";
import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";

export interface StudyPlanSectionCardProps {
  planType: string;
  termName?: string;
  yearLevelName?: string;
  academicYear: string | number;
  curriculumType?: "DVE" | "BACHELOR";
}

export const StudyPlanSectionCard = React.memo(function StudyPlanSectionCard({
  planType,
  termName,
  yearLevelName,
  academicYear,
  curriculumType = "BACHELOR",
}: StudyPlanSectionCardProps) {
  const termYear = `${termName || ""}/${academicYear}`;

  return (
    <CardStudyPlansCustom
      planType={planType}
      termYear={termYear}
      yearLevel={yearLevelName || ""}
      curriculumType={curriculumType}
    >
      {({ onAdded }) => (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
            {yearLevelName} {termName}/{academicYear}
          </h2>
          <div className="shrink-0 self-start sm:self-center">
            <AddSubjectCustom
              planType={planType}
              termYear={termYear}
              yearLevel={yearLevelName || ""}
              curriculumType={curriculumType}
              onAdded={onAdded}
            />
          </div>
        </div>
      )}
    </CardStudyPlansCustom>
  );
});

