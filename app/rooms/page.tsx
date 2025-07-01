"use client";

import InbuildingRoom from "@/components/room-components/in-building-room";
import IndepartmentRoom from "@/components/room-components/in-department-room";
import OutdepartmentRoom from "@/components/room-components/out-departmant-room";

export default function Rooms() {
    return (
        <>
            <div className="grid grid-cols-4 gap-4 p-5">
                <div className="flex-col col-span-1">
                    <IndepartmentRoom />
                </div>
                <div className="flex-col col-span-1">
                    <InbuildingRoom />
                </div>
                <div className="flex-col col-span-2">
                    <OutdepartmentRoom />
                </div>
            </div>
        </>
    )
}