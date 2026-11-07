import { useState } from "react";
import { TableCustom } from "../table/table-custom";

export default function CardStudyPlansCustom({
  children,
  planType,
  termYear,
  yearLevel,
  curriculumType,
}: {
  children: (props: { onAdded: () => void }) => React.ReactNode;
  planType: string;
  termYear: string;
  yearLevel: string;
  curriculumType?: "DVE" | "BACHELOR";
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdded = () => setRefreshKey((k) => k + 1);

  // Border theme by planType
  let borderTheme = "border-border";
  if (planType === "TRANSFER") {
    borderTheme = "border-sky-300/80 dark:border-sky-800/80";
  } else if (planType === "FOUR_YEAR") {
    borderTheme = "border-indigo-300/80 dark:border-indigo-800/80";
  } else if (planType === "DVE-LVC") {
    borderTheme = "border-amber-300/80 dark:border-amber-800/80";
  } else if (planType === "DVE-MSIX") {
    borderTheme = "border-emerald-300/80 dark:border-emerald-800/80";
  }

  return (
    <div className={`bg-card text-card-foreground flex flex-col gap-4 rounded-xl border ${borderTheme} shadow-xs p-5 transition-all`}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        {children({ onAdded: handleAdded })}
      </div>

      <div className="overflow-hidden">
        <TableCustom
          planType={planType}
          termYear={termYear}
          yearLevel={yearLevel}
          curriculumType={curriculumType}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
