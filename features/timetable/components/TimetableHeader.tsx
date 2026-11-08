import React from "react";
import AutoFullCurriculumButton from "@/components/auto-timetable-button/auto-full-curriculum-button";
import ClearFullCurriculumButton from "@/components/auto-timetable-button/clear-full-curriculum-button";
import DownloadButtonTimetable from "@/components/download-button/download-button-timetable";
import { Badge } from "@/components/ui/badge";
import { Table as TableIcon } from "lucide-react";

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
  // Determine curriculum category token
  let borderTheme = "border-border";
  let badgeTheme = "bg-secondary text-secondary-foreground";

  if (title.includes("เทียบโอน")) {
    borderTheme = "border-sky-300/80 dark:border-sky-800/80";
    badgeTheme = "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  } else if (title.includes("4 ปี")) {
    borderTheme = "border-indigo-300/80 dark:border-indigo-800/80";
    badgeTheme = "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  } else if (title.includes("ปวช.")) {
    borderTheme = "border-amber-300/80 dark:border-amber-800/80";
    badgeTheme = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  } else if (title.includes("ม.6")) {
    borderTheme = "border-emerald-300/80 dark:border-emerald-800/80";
    badgeTheme = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  }

  return (
    <div className={`rounded-xl border ${borderTheme} bg-card p-5 mb-4 shadow-xs transition-all mx-2 sm:mx-4`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
              className={`font-normal text-xs font-sans ${badgeTheme}`}
            >
              การจัดตารางเรียน
            </Badge>
            {termYear && (
              <Badge variant="outline" className="font-mono text-xs border-border">
                ภาคเรียน {termYear}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 font-sans">
            <TableIcon className="h-5 w-5 text-foreground" />
            {title}
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            ลากและวางรายวิชาเพื่อจัดสรรช่วงเวลาเรียนและห้องเรียนประจำแผนการเรียน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
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
    </div>
  );
};
