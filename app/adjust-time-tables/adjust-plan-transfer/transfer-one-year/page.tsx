"use client";

import React, { useState } from "react";
import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";

export default function TransferOneYear() {
    const [termYear, setTermYear] = useState<string | null>(null);

    React.useEffect(() => {
        async function fetchTermYear() {
            const res = await fetch("/api/term-year")
            if (res.ok) {
                const data = await res.json()
                setTermYear(data.termYear)
            }
        }
        fetchTermYear()
    }, []);

    if (termYear === null) {
        // render loading หรือ skeleton เพื่อให้ SSR/CSR ตรงกัน
        return <div>Loading...</div>;
    }

    return (
        <div className="mx-auto px-4">
            <div className="bg-card text-card-foreground rounded-xl border my-5 py-6 shadow-sm mx-auto max-w-7xl">
                <div className="mx-8 pb-2 text-lg font-semibold">
                    ตารางเรียน เทียบโอน ปี 1 ภาคเรียนที่ {termYear}
                </div>
                <div className="bg-card text-card-foreground px-8">
                    <TimeTableCustom
                        boxPositions={{}}
                        boxes={[]}
                    />
                </div>
            </div>
            <PlansStatusCustom
                termYear={termYear}
                boxPositions={{}}
                boxes={[]}
            />
        </div>
    )
}