import PlansStatusCustom from "@/components/plans-status/plans-status-custom";
import TimeTableCustom from "@/components/time-table/time-table-custom";

export default function DveOneYear() {
    return (
        <div>
            <div className="bg-card text-card-foreground rounded-xl border my-5 py-4 shadow-sm mx-auto max-w-fit">
                <div className="mx-4 pb-1">แผนการเรียน ปวส. ปี 1 ภาคเรียนที่ { }/{ }</div>
                <div className="bg-card text-card-foreground px-4">
                    <TimeTableCustom />
                </div>
            </div>
            <PlansStatusCustom />
        </div>
    )
}
