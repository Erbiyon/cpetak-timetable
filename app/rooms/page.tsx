"use client";

import InbuildingRoom from "@/components/room-components/in-building-room";
import IndepartmentRoom from "@/components/room-components/in-department-room";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";

export default function Rooms() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Academic Header */}
      <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-foreground font-medium text-xs px-2.5 py-0.5 font-sans"
              >
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              <Badge
                variant="secondary"
                className="font-normal text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 font-sans"
              >
                ฐานข้อมูลสถานที่และห้องปฏิบัติการ
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5 font-sans">
              <School className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              จัดการข้อมูลห้องเรียน
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              จัดการรายการห้องเรียน ห้องปฏิบัติการคอมพิวเตอร์ และห้องบรรยายภายในอาคารสาขาและตึกวิศวกรรมศาสตร์
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: ห้องเรียนภายในอาคารสาขา & ตึกวิศวกรรมศาสตร์ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <IndepartmentRoom />
        </div>
        <div className="space-y-4">
          <InbuildingRoom />
        </div>
      </div>
    </div>
  );
}
