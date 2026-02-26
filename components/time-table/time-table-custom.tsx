import React, { useMemo, useCallback } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, RefreshCw } from "lucide-react";

class TimeTableErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "TimeTable Error Boundary caught an error:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorDisplay({ error }: { error: Error | null }) {
  const isMaxUpdateDepthError = error?.message?.includes(
    "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.",
  );

  return (
    <>
      {/* Fixed overlay for error popup */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-card rounded-lg border border-destructive/20 shadow-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />

              <h3 className="text-lg font-semibold text-destructive mb-2">
                {isMaxUpdateDepthError ? "เกิดปัญหาแล้วสิ" : "เกิดปัญหาแล้วสิ"}
              </h3>

              <p className="text-sm text-muted-foreground mb-6">
                {isMaxUpdateDepthError
                  ? "ควรหลีกเลี่ยงการลากวิชาไปทับซ้อนกับวิชาอื่น หรือวางลงในคาบที่มีวิชาอยู่แล้ว รวมถึงการลากที่เร็วเกินไปในช่องที่มีวิชาอยู่ด้วย"
                  : "ควรหลีกเลี่ยงการลากวิชาไปทับซ้อนกับวิชาอื่น หรือวางลงในคาบที่มีวิชาอยู่แล้ว รวมถึงการลากที่เร็วเกินไปในช่องที่มีวิชาอยู่ด้วย"}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Render invisible placeholder to maintain layout */}
      <div className="opacity-0 pointer-events-none w-full min-h-[400px]" />
    </>
  );
}

function TimeTableCustomInternal({
  plans = [],
  assignments = {},
  onRemoveAssignment = null,
  activeSubject = null,
  dragOverCell = null,
}: {
  plans: any[];
  assignments: {
    [subjectId: number]: { day: number; periods: number[] } | null;
  };
  onRemoveAssignment?: ((subjectId: number) => void) | null;
  activeSubject?: any;
  dragOverCell?: { day: number; period: number } | null;
}) {
  const days = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

  const { cellToSubject, cellColspan, cellSkip } = useMemo(() => {
    const cellToSubject: { [cellKey: string]: any } = {};
    const cellColspan: { [cellKey: string]: number } = {};
    const cellSkip: Set<string> = new Set();

    Object.entries(assignments).forEach(([subjectId, assignment]) => {
      if (!assignment) return;

      const { day, periods } = assignment;
      const subject = plans.find((plan) => plan.id === parseInt(subjectId));

      if (!subject || periods.length === 0) return;

      const sortedPeriods = [...periods].sort((a, b) => a - b);
      const firstPeriod = sortedPeriods[0];
      const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

      let isConsecutive = true;
      for (let i = firstPeriod; i < lastPeriod; i++) {
        if (day === 2 && i >= 14 && i <= 17) continue;

        if (!sortedPeriods.includes(i)) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        const colspan = lastPeriod - firstPeriod + 1;

        const startCellKey = `${day}-${firstPeriod}`;
        cellToSubject[startCellKey] = {
          ...subject,
          assignmentData: { day, periods: sortedPeriods },
        };
        cellColspan[startCellKey] = colspan;

        for (let p = firstPeriod + 1; p <= lastPeriod; p++) {
          cellSkip.add(`${day}-${p}`);
        }
      } else {
        periods.forEach((period) => {
          const cellKey = `${day}-${period}`;
          cellToSubject[cellKey] = {
            ...subject,
            assignmentData: { day, periods: [period] },
          };
          cellColspan[cellKey] = 1;
        });
      }
    });

    return { cellToSubject, cellColspan, cellSkip };
  }, [assignments, plans]);

  const calculatedHighlight = useMemo(() => {
    if (!activeSubject || !dragOverCell) {
      return {
        startCell: null,
        skipCells: [] as string[],
        colspan: 0,
        invalid: false,
      };
    }

    const { day, period } = dragOverCell;
    const totalHours =
      (activeSubject.lectureHour || 0) + (activeSubject.labHour || 0);
    const totalPeriods = totalHours * 2;

    const startPeriod = period;

    const periods: number[] = [];
    for (let i = 0; i < totalPeriods; i++) {
      const currentPeriod = startPeriod + i;

      if (day === 2 && currentPeriod >= 14 && currentPeriod <= 17) {
        continue;
      }

      if (currentPeriod < 25) {
        periods.push(currentPeriod);
      }
    }

    if (periods.length === 0) {
      return {
        startCell: null,
        skipCells: [],
        colspan: 0,
        invalid: true,
      };
    }

    periods.sort((a, b) => a - b);
    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];

    const invalid = periods.length < totalPeriods;

    const skipCells: string[] = [];
    for (let p = firstPeriod + 1; p <= lastPeriod; p++) {
      if (day === 2 && p >= 14 && p <= 17) continue;
      skipCells.push(`${day}-${p}`);
    }

    return {
      startCell: `${day}-${firstPeriod}`,
      skipCells,
      colspan: lastPeriod - firstPeriod + 1,
      day,
      period: firstPeriod,
      invalid,
    };
  }, [activeSubject, dragOverCell]);

  const memoizedOnRemoveAssignment = useCallback(
    (subjectId: number) => {
      if (onRemoveAssignment) {
        onRemoveAssignment(subjectId);
      }
    },
    [onRemoveAssignment],
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="table-fixed border-collapse w-full">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-xs w-[72px]">วัน/คาบ</th>
            {Array.from({ length: 25 }, (_, i) => (
              <th
                key={i}
                className="border px-2 py-1 text-xs"
                style={{ width: `${100 / 25}%` }}
              >
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, rowIdx) => (
            <tr key={rowIdx}>
              <td className="border text-center text-xs w-[72px]">{day}</td>
              {Array.from({ length: 25 }, (_, colIdx) => {
                if (rowIdx === 2 && colIdx === 14) {
                  return (
                    <td
                      key={`activity-${rowIdx}-${colIdx}`}
                      colSpan={4}
                      className="border text-center bg-muted font-bold text-xs"
                    >
                      กิจกรรม
                    </td>
                  );
                }

                if (rowIdx === 2 && colIdx > 14 && colIdx < 18) {
                  return null;
                }

                const cellKey = `${rowIdx}-${colIdx}`;

                if (cellSkip.has(cellKey)) {
                  return null;
                }

                if (calculatedHighlight.skipCells?.includes(cellKey)) {
                  return null;
                }

                const subject = cellToSubject[cellKey];
                const colspan = cellColspan[cellKey] || 1;

                const isHighlightStart =
                  cellKey === calculatedHighlight.startCell;
                const highlightColspan =
                  isHighlightStart && calculatedHighlight.colspan
                    ? calculatedHighlight.colspan
                    : 1;
                const isInvalidHighlight =
                  isHighlightStart && calculatedHighlight.invalid;

                const uniqueCellKey = `cell-${rowIdx}-${colIdx}`;

                return (
                  <SimpleCell
                    key={uniqueCellKey}
                    id={`cell-${rowIdx}-${colIdx}`}
                    day={rowIdx}
                    period={colIdx}
                    colspan={isHighlightStart ? highlightColspan : colspan}
                    subject={subject}
                    onRemoveAssignment={memoizedOnRemoveAssignment}
                    isHighlighted={isHighlightStart}
                    isInvalidHighlight={isInvalidHighlight}
                    activeSubject={isHighlightStart ? activeSubject : null}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SimpleCell = React.memo(function SimpleCell({
  id,
  day,
  period,
  colspan = 1,
  subject,
  onRemoveAssignment,
  isHighlighted = false,
  isInvalidHighlight = false,
  activeSubject = null,
}: {
  id: string;
  day: number;
  period: number;
  colspan?: number;
  subject?: any;
  onRemoveAssignment?: (subjectId: number) => void;
  isHighlighted?: boolean;
  isInvalidHighlight?: boolean;
  activeSubject?: any;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { day, period },
  });

  let cellClasses =
    "border text-center h-[36px] p-0 align-middle overflow-hidden text-xs transition-colors";

  if (isOver) {
    cellClasses += isInvalidHighlight
      ? " bg-red-300 dark:bg-red-700 border-2 border-red-500 dark:border-red-500"
      : " bg-green-300 dark:bg-green-700 border-2 border-green-500 dark:border-green-500";
  } else if (isHighlighted) {
    cellClasses += isInvalidHighlight
      ? " bg-red-200 dark:bg-red-800 border border-red-400 dark:border-red-600"
      : " bg-green-200 dark:bg-green-600 border border-green-400 dark:border-green-400";
  } else if (subject) {
    cellClasses +=
      " bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 p-0";
  } else {
    cellClasses += " bg-card hover:bg-slate-50 dark:hover:bg-slate-800";
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (subject && onRemoveAssignment) {
        e.preventDefault();
        onRemoveAssignment(subject.id);
      }
    },
    [subject, onRemoveAssignment],
  );

  return (
    <td
      ref={setNodeRef}
      className={cellClasses}
      style={{ width: `${100 / 25}%` }}
      colSpan={colspan}
      onContextMenu={handleContextMenu}
    >
      {subject ? (
        <SubjectInCell subject={subject} />
      ) : isHighlighted && activeSubject ? (
        <HighlightPreview
          subject={activeSubject}
          isInvalid={isInvalidHighlight}
        />
      ) : null}
    </td>
  );
});

const HighlightPreview = React.memo(function HighlightPreview({
  subject,
  isInvalid = false,
}: {
  subject: any;
  isInvalid?: boolean;
}) {
  const lectureHours = subject.lectureHour || 0;
  const labHours = subject.labHour || 0;
  const totalHours = lectureHours + labHours;
  const totalPeriods = totalHours * 2;

  return (
    <div
      className={`w-full h-full p-1 ${isInvalid ? "opacity-50" : "opacity-80"}`}
    >
      <div className="text-center">
        <div
          className={`font-medium ${isInvalid ? "text-red-950 dark:text-red-50" : "text-green-950 dark:text-green-50"}`}
        >
          {subject.subjectCode}
          {subject.section && (
            <span
              className={`text-[9px] ml-1 px-1 py-0.5 rounded ${
                isInvalid
                  ? "bg-red-200 dark:bg-red-700"
                  : "bg-green-200 dark:bg-green-700"
              }`}
            >
              sec.{subject.section}
            </span>
          )}
        </div>
        <div
          className={`text-[10px] truncate ${isInvalid ? "text-red-900 dark:text-red-100" : "text-green-900 dark:text-green-100"}`}
        >
          {subject.subjectName}
        </div>
        <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
          <span
            className={`${isInvalid ? "bg-red-200/50 dark:bg-red-700/50" : "bg-green-200/50 dark:bg-green-700/50"} px-1 rounded`}
          >
            {totalHours} ชม. ({lectureHours}/{labHours})
          </span>
          <span
            className={`${isInvalid ? "bg-red-300/30 dark:bg-red-600/30" : "bg-green-300/30 dark:bg-green-600/30"} px-1 rounded`}
          >
            {totalPeriods} คาบ
          </span>
        </div>
        {isInvalid && (
          <div className="text-[8px] mt-1 bg-red-300/30 dark:bg-red-600/30 px-1 rounded text-red-800 dark:text-red-200">
            ไม่สามารถวางได้
          </div>
        )}
      </div>
    </div>
  );
});

const SubjectInCell = React.memo(function SubjectInCell({
  subject,
}: {
  subject: any;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `table-subject-${subject.id}`,
    data: {
      subject,
      fromTable: true,
    },
  });

  const lectureHours = subject.lectureHour || 0;
  const labHours = subject.labHour || 0;
  const totalHours = lectureHours + labHours;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`w-full h-full p-1 cursor-grab ${isDragging ? "opacity-30" : ""}`}
            title="คลิกลากเพื่อย้าย หรือคลิกขวาเพื่อนำออก"
          >
            <div className="text-center">
              <div className="font-medium text-green-950 dark:text-green-50">
                {subject.subjectCode}
                {subject.section && (
                  <span className="text-[9px] ml-1 bg-green-200 dark:bg-green-700 px-1 py-0.5 rounded">
                    sec.{subject.section}
                  </span>
                )}
              </div>
              <div className="text-[10px] truncate text-green-900 dark:text-green-100">
                {subject.subjectName}
              </div>
              <div className="text-[8px] mt-1 flex items-center justify-center gap-1">
                <span className="bg-green-200/50 dark:bg-green-700/50 px-1 rounded">
                  {totalHours} ชม. ({lectureHours}/{labHours})
                </span>
                <span className="bg-green-300/30 dark:bg-green-600/30 px-1 rounded">
                  {totalHours * 2} คาบ
                </span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="bg-slate-950 text-slate-50 dark:bg-slate-900"
        >
          <div className="text-xs p-1">
            <div className="font-medium">
              {subject.subjectCode}
              {subject.section && (
                <span className="ml-2">กลุ่มเรียน: {subject.section}</span>
              )}
            </div>
            <div className="mt-1">{subject.subjectName}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>จำนวนหน่วยกิต:</div>
              <div className="text-right">{subject.credit}</div>
              <div>ชั่วโมงบรรยาย:</div>
              <div className="text-right">{lectureHours} ชม.</div>
              <div>ชั่วโมงปฏิบัติ:</div>
              <div className="text-right">{labHours} ชม.</div>
              <div>รวม:</div>
              <div className="text-right">
                {totalHours} ชม. ({totalHours * 2} คาบ)
              </div>

              {subject.section && (
                <>
                  <div>กลุ่มเรียน:</div>
                  <div className="text-right">{subject.section}</div>
                </>
              )}
              {subject.room && (
                <>
                  <div>ห้องเรียน:</div>
                  <div className="text-right">{subject.room.roomCode}</div>
                </>
              )}
              {subject.teacher && (
                <>
                  <div>อาจารย์:</div>
                  <div className="text-right">
                    {subject.teacher.tName} {subject.teacher.tLastName}
                  </div>
                </>
              )}
            </div>
            <div className="mt-1 text-[10px] opacity-75 text-center">
              คลิกขวาเพื่อนำออก หรือคลิกลากเพื่อย้าย
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default function TimeTableCustom({
  plans = [],
  assignments = {},
  onRemoveAssignment = null,
  activeSubject = null,
  dragOverCell = null,
}: {
  plans?: any[];
  assignments?: {
    [subjectId: number]: { day: number; periods: number[] } | null;
  };
  onRemoveAssignment?: ((subjectId: number) => void) | null;
  activeSubject?: any;
  dragOverCell?: { day: number; period: number } | null;
}) {
  return (
    <TimeTableErrorBoundary
      onReset={() => {
        console.log("TimeTable Error Boundary Reset");
      }}
    >
      <TimeTableCustomInternal
        plans={plans}
        assignments={assignments}
        onRemoveAssignment={onRemoveAssignment}
        activeSubject={activeSubject}
        dragOverCell={dragOverCell}
      />
    </TimeTableErrorBoundary>
  );
}
