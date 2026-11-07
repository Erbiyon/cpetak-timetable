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
    <div className="flex justify-between items-center mx-8 pb-2 text-lg font-semibold">
      <div className="flex items-center gap-4">
        <span>{title} ภาคเรียนที่ {termYear}</span>
      </div>
      <div className="flex items-center gap-2">
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
