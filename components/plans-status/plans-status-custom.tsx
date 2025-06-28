type PlansStatusCustomProps = {
    termYear?: string;
}

export default function PlansStatusCustom({
    termYear
}: PlansStatusCustomProps) {
    return (
        <div className="flex gap-4 mx-auto my-5 max-w-7xl">
            <div className="flex-[4_4_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-6 flex-col gap-4">
                <div>แผนการเรียน ภาคเรียนที่ {termYear}</div>
                <div className="rounded-xl border shadow-sm py-4 px-4 overflow-y-auto">
                    <div className="flex gap-4 overflow-x-auto">
                        <div className="rounded-xl border shadow-sm py-7 px-4">
                            ssss
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-[2_2_0%] bg-card text-card-foreground rounded-xl border shadow-sm p-2 px-4 flex-col gap-4">
                <div className="pb-2">สถานะ</div>
                <div className="rounded-xl border shadow-sm max-h-32 overflow-x-auto">
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                    <div className="m-2">5555555</div>
                </div>
            </div>
        </div>
    )
}