import { TableCustom } from "../table/table-custom";

export default function CardStudyPlansCustom({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 py-5 shadow-sm mx-48">

            {children}

            <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border my-5 shadow-sm mx-8">
                <TableCustom />
            </div>
        </div>
    )
}