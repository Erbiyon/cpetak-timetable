"use client";

import InbuildingRoom from "@/components/room-components/in-building-room";
import IndepartmentRoom from "@/components/room-components/in-department-room";

export default function Rooms() {
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                <div className="space-y-4">
                    <IndepartmentRoom />
                </div>
                <div className="space-y-4">
                    <InbuildingRoom />
                </div>
            </div>
        </>
    )
}