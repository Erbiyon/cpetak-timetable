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
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-48">
            {children({ onAdded: handleAdded })}
            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8 overflow-y-auto">
                <TableCustom
                    planType={planType}
                    termYear={termYear}
                    yearLevel={yearLevel}
                    refreshKey={refreshKey}
                />
            </div>
        </div>
    )
}