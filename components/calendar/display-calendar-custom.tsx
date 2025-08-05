import React from "react"

type DisplayCalendarCustomProps = {
    termNumber?: number
    start?: Date
    end?: Date
}

const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

function formatThaiDate(date: Date) {
    return `${date.getDate()}/${thaiMonths[date.getMonth()]}/${date.getFullYear() + 543}`
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
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border mx-4 lg:mx-12 mb-4 lg:mb-8 p-4 shadow-sm">
            <div className="text-center text-lg lg:text-2xl font-bold my-3 lg:my-5 px-4">
                ขณะนี้เป็นภาคเรียนที่ {term}/{year}
            </div>
            <div className="text-center text-base lg:text-lg my-2 lg:my-3">
                <div className="max-w-7xl mx-auto px-4">
                    {start && end
                        ? `${formatThaiDate(start)} ถึง ${formatThaiDate(end)}`
                        : "ว/ด/ป ถึง ว/ด/ป"
                    }
                </div>
            </div>
        </div>
    )
}