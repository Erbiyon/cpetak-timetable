import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TimeTableCustom() {
    return (
        <table className="table-auto border-collapse w-full">
            <thead>
                <tr>
                    {[...Array(26)].map((_, i) => (
                        <th key={i} className="border px-2 py-1">
                            {(8 + i)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {[...Array(8)].map((_, rowIdx) => (
                    <tr key={rowIdx}>
                        {[...Array(26)].map((_, colIdx) => (
                            <td key={colIdx} className="border p-5 text-center">
                                {/* cell content */}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
