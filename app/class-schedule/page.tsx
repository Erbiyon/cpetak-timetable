import TimeTableCustom from "@/components/time-table/time-table-custom";

export default function ClassSchedule() {
    return (
        <div>

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-8 shadow-sm mx-auto max-w-7xl">
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border shadow-sm overflow-y-auto">
                    <TimeTableCustom />
                </div>
            </div>
            {/* <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 pt-2 pb-8 shadow-sm mx-auto max-w-7xl">
                <div className="mx-auto">แผนการเรียน ภาคเรียนที่ 1/xxxx</div>
                <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border shadow-sm py-4 mx-8 overflow-y-auto">
                    <div className="flex flex-row gap-4 overflow-x-auto">
                        <div className="bg-card text-card-foreground flex flex-col gap-1 rounded-xl border shadow-sm py-7 ml-2">
                            <div className="mx-4">
                                ssss
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    )
}