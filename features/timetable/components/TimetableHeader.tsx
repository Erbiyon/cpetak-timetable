import React from "react";
import AutoFullCurriculumButton from "@/components/auto-timetable-button/auto-full-curriculum-button";
import ClearFullCurriculumButton from "@/components/auto-timetable-button/clear-full-curriculum-button";
import DownloadButtonTimetable from "@/components/download-button/download-button-timetable";

export interface TimetableHeaderProps {
  title: string;
  termYear?: string;
  timetableData: any[];
  onRefresh: () => void;
}

export const TimetableHeader: React.FC<TimetableHeaderProps> = ({
  title,
  termYear,
  timetableData,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mx-4 sm:mx-8 pb-3 mb-2 border-b border-border gap-3">
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {title} <span className="text-muted-foreground font-medium text-base ml-1">ภาคเรียนที่ {termYear}</span>
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AutoFullCurriculumButton
          termYear={termYear || ""}
          onScheduleComplete={onRefresh}
        />
        <ClearFullCurriculumButton
          termYear={termYear || ""}
          onClearComplete={onRefresh}
        />
        <DownloadButtonTimetable
          currentTermYear={termYear}
          timetables={timetableData}
        />
      </div>
    </div>
  );
};
