import React from "react"

type DisplayCalendarCustomProps = {
    termNumber?: number
    start?: Date
    end?: Date
}

export default function DisplayCalendarCustom({
    termNumber,
    start,
    end
}: DisplayCalendarCustomProps) {
    const year = start ? (start.getFullYear() + 543).toString() : "xxxx"
    const term = termNumber ?? "?"


    React.useEffect(() => {
        if (term !== "?" && year !== "xxxx") {
            const termYear = `${term}/${year}`
            fetch("/api/term-year", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ termYear }),
            })
        }
    }, [term, year])

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mx-12 mb-8 p-4 shadow-sm">
            <div className="text-center text-2xl font-bold my-5">
                ขณะนี้เป็นภาคเรียนที่ {term}/{year}
            </div>
            <div className="text-center text-lg my-3">
                <div className="max-w-7xl mx-auto items-center">
                    {start && end
                        ? `${start.toLocaleDateString()} ถึง ${end.toLocaleDateString()}` : "ว/ด/ป ถึง ว/ด/ป"
                    }
                </div>
            </div>
        </div>
    )
}