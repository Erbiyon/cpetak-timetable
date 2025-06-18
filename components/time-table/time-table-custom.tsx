export default function TimeTableCustom() {
    // เพิ่ม 20:30 เป็นคอลัมน์สุดท้าย
    const timeSlots = Array.from({ length: 25 }, (_, i) => {
        const hour = 8 + Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}.${minute}`;
    });
    timeSlots.push("20.30");

    return (
        <table className="table-auto border-collapse w-full">
            <thead>
                <tr>
                    <th className="border px-2 py-1 text-xs">วัน/คาบ</th>
                    {timeSlots.map((slot, i) => (
                        <th key={i} className="border px-2 py-1 text-xs">
                            {slot}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."].map((day, rowIdx) => (
                    <tr key={rowIdx}>
                        <td className="border p-4 text-center text-xs">{day}</td>
                        {timeSlots.map((_, colIdx) => (
                            <td key={colIdx} className="border p-4 text-center">
                                {/* cell content */}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
