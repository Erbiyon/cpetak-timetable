import { useDroppable } from "@dnd-kit/core";
import DraggableBox from "../plans-status/draggable-box";

export default function TimeTableCustom({
    boxPositions,
    boxes,
    activeBox
}: {
    boxPositions: { [boxId: string]: { row: number, col: number } | null },
    boxes: { id: string, label: string, colSpan?: number }[],
    activeBox?: string
}) {
    const getBoxInCell = (row: number, col: number) => {
        return Object.entries(boxPositions).find(
            ([, pos]) => pos?.row === row && pos?.col === col
        );
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="table-fixed border-collapse w-full">
                <thead>
                    <tr>
                        <th className="border px-2 py-1 text-xs w-[72px]">วัน/คาบ</th>
                        {Array.from({ length: 25 }, (_, i) => (
                            <th key={i} className="border px-2 py-1 text-xs" style={{ width: `${100 / 25}%` }}>
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."].map((day, rowIdx) => (
                        <tr key={rowIdx}>
                            <td className="border text-center text-xs w-[72px]">{day}</td>
                            {(() => {
                                const skip = Array(25).fill(false);
                                return Array.from({ length: 25 }, (_, colIdx) => {
                                    const { setNodeRef, isOver } = useDroppable({ id: `cell-${rowIdx}-${colIdx}` });

                                    // เฉพาะวันพุธ (rowIdx === 2) คาบ 15-18 (colIdx 14-17)
                                    if (rowIdx === 2 && colIdx === 14) {
                                        skip[15] = true;
                                        skip[16] = true;
                                        skip[17] = true;
                                        return (
                                            <td
                                                key={`activity-${rowIdx}-${colIdx}`}
                                                colSpan={4}
                                                className="border text-center bg-card font-bold text-xs"
                                            >
                                                กิจกรรม
                                            </td>
                                        );
                                    }
                                    if (rowIdx === 2 && colIdx > 14 && colIdx < 18) {
                                        return null;
                                    }

                                    // เช็ค skip หลังจากเรียก useDroppable
                                    if (skip[colIdx]) return null;

                                    const boxInCell = getBoxInCell(rowIdx, colIdx);
                                    const boxObj = boxes.find(b => b.id === boxInCell?.[0]);
                                    const colSpan = boxObj?.colSpan || 1;

                                    // กันไม่ให้ render box ที่ colSpan ไปกินกิจกรรม
                                    if (
                                        rowIdx === 2 &&
                                        boxInCell &&
                                        colSpan > 1 &&
                                        colIdx <= 17 &&
                                        colIdx + colSpan - 1 >= 14
                                    ) {
                                        return null;
                                    }

                                    // แสดง box ที่ colSpan > 1
                                    if (boxInCell && colSpan > 1) {
                                        for (let i = 1; i < colSpan; i++) {
                                            if (colIdx + i < 25) skip[colIdx + i] = true;
                                        }
                                        return (
                                            <td
                                                key={`${boxInCell[0]}-${rowIdx}-${colIdx}`}
                                                ref={setNodeRef}
                                                colSpan={colSpan}
                                                className={`border text-center h-[36px] p-0 align-middle overflow-hidden ${isOver ? "bg-blue-100" : ""}`}
                                            >
                                                <DraggableBox
                                                    id={boxInCell[0]}
                                                    label={boxObj?.label || ""}
                                                />
                                            </td>
                                        );
                                    }

                                    // Preview ขณะลาก (ขยายตาม colSpan)
                                    if (
                                        activeBox &&
                                        isOver &&
                                        !skip[colIdx]
                                    ) {
                                        const previewBox = boxes.find(b => b.id === activeBox);
                                        const previewColSpan = previewBox?.colSpan || 1;
                                        // กันไม่ให้ preview ทับกิจกรรม
                                        if (
                                            rowIdx === 2 &&
                                            colIdx <= 17 &&
                                            colIdx + previewColSpan - 1 >= 14
                                        ) {
                                            return null;
                                        }
                                        for (let i = 1; i < previewColSpan; i++) {
                                            if (colIdx + i < 25) skip[colIdx + i] = true;
                                        }
                                        return (
                                            <td
                                                key={`preview-${rowIdx}-${colIdx}`}
                                                ref={setNodeRef}
                                                colSpan={previewColSpan}
                                                className="border bg-green-200 opacity-80 h-[36px] p-0 align-middle overflow-hidden relative"
                                            >
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full flex justify-center items-center">
                                                    <DraggableBox
                                                        id={activeBox}
                                                        label={previewBox?.label || ""}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    }

                                    // cell ปกติ
                                    return (
                                        <td
                                            key={colIdx}
                                            ref={setNodeRef}
                                            className="border text-center h-[36px] p-0 align-middle overflow-hidden"
                                            style={{ width: "60px" }}
                                        >
                                            {boxInCell && colSpan === 1 && (
                                                <DraggableBox
                                                    id={boxInCell[0]}
                                                    label={boxObj?.label || ""}
                                                />
                                            )}
                                        </td>
                                    );
                                });
                            })()}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
