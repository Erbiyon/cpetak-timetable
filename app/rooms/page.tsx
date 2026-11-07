"use client";

import InbuildingRoom from "@/components/room-components/in-building-room";
import IndepartmentRoom from "@/components/room-components/in-department-room";

export default function Rooms() {
    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">จัดการข้อมูลห้องเรียน</h1>
                <p className="text-sm text-muted-foreground mt-0.5">ข้อมูลห้องเรียนและห้องปฏิบัติการภายในสาขาและอาคารเรียน</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <IndepartmentRoom />
                </div>
                <div className="space-y-4">
                    <InbuildingRoom />
                </div>
            </div>
        </div>
    )
}