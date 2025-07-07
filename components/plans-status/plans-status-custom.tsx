import DraggableBox from "./draggable-box";

export default function PlansStatusCustom({
    termYear,
    boxPositions,
    boxes,
    activeBox
}: {
    termYear?: string;
    boxPositions: { [boxId: string]: { row: number, col: number } | null };
    boxes: { id: string; label: string; colSpan?: number }[];
    activeBox?: string;
}) {
    return (
        <div className="flex gap-4 mx-auto my-5 max-w-7xl">
            <div className="flex-[4_4_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
                แผนการเรียน เทียบโอน ปี 1 ภาคเรียนที่ {termYear || "x/xxxx"}
                <div className="rounded-xl border shadow-sm py-4 px-4 overflow-visible">
                    <div className="text-center text-muted-foreground">
                        ข้อมูลอื่นที่ต้องการแสดงในแผนการเรียน
                    </div>
                </div>
            </div>
            <div className="flex-[2_2_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-2 px-4 flex-col gap-4">
                <div className="pb-2">สถานะ</div>
                <div className="rounded-xl border shadow-sm max-h-32 overflow-x-auto">
                    <div className="m-2">5555555</div>
                    {/* เพิ่มข้อมูลสถานะอื่นๆ ตามต้องการ */}
                </div>
            </div>
        </div>
    );
}