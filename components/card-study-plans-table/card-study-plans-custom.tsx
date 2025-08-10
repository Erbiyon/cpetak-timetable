import { useState } from "react";
import { TableCustom } from "../table/table-custom";

export default function CardStudyPlansCustom({
    children,
    planType,
    termYear,
    yearLevel,
}: {
    children: (props: { onAdded: () => void }) => React.ReactNode,
    planType: string,
    termYear: string,
    yearLevel: string,
}) {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAdded = () => setRefreshKey(k => k + 1);

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border shadow-sm mx-4 sm:mx-8 lg:mx-16 xl:mx-32 2xl:mx-48 py-4 sm:py-5">
            {/* Header Section */}
            <div className="px-4 sm:px-6">
                {children({ onAdded: handleAdded })}
            </div>

            {/* Table Section */}
            <div className="bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm mx-2 sm:mx-4 lg:mx-8 overflow-hidden">
                <div className="overflow-x-auto">
                    <TableCustom
                        planType={planType}
                        termYear={termYear}
                        yearLevel={yearLevel}
                        refreshKey={refreshKey}
                    />
                </div>
            </div>
        </div>
    )
}