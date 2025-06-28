"use client";

import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";
import React, { useState } from "react";

export default function TransferOneYear() {
    const [termYear, setTermYear] = useState<string>("x/xxxx")

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

    return (
        <div>
            <div className="bg-card text-card-foreground rounded-xl border my-5 py-4 shadow-sm mx-auto max-w-fit">
                <div className="mx-4 pb-1">แผนการเรียน เทียบโอน ปี 1 ภาคเรียนที่ {termYear}</div>
                <div className="bg-card text-card-foreground px-4">
                    <TimeTableCustom />
                </div>
            </div>
            <PlansStatusCustom
                termYear={termYear}
            />
        </div>
    )
}