import React from "react";
import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground font-sans">
              {yearLevelName} {termName}
            </h2>
            <Badge variant="outline" className="text-xs font-mono border-border">
              ปีการศึกษา {academicYear}
            </Badge>
          </div>
          <div className="shrink-0">
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
