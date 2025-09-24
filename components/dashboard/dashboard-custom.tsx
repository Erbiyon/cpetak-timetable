"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
   NotebookPen,
   School,
   SquareUser,
   Table,
   Grid2x2Check,
   House,
   Calendar,
   ArrowRight
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export default function DashboardCustom() {
   const { data: session } = useSession()
   const [isTerm3, setIsTerm3] = useState<boolean>(false)
   const [currentTime, setCurrentTime] = useState<string>("")
   const [currentTermYear, setCurrentTermYear] = useState<string>("")

   useEffect(() => {
      const updateTime = () => {
         const now = new Date()
         const timeString = now.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
         })
         setCurrentTime(timeString)
      }

      updateTime()
      const interval = setInterval(updateTime, 1000)

      return () => clearInterval(interval)
   }, [])

   useEffect(() => {
      const fetchCurrentTermYear = async () => {
         try {
            const response = await fetch('/api/current-term-year')
            if (response.ok) {
               const data = await response.json()
               const termNumber = parseInt(data.termYear.split('/')[0])
               setIsTerm3(termNumber === 3)
               setCurrentTermYear(data.termYear)
            }
         } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลปีการศึกษา:', error)
         }
      }

      fetchCurrentTermYear()
   }, [])

   const quickActions = [
      {
         title: "แผนการเรียน",
         description: "จัดการแผนการเรียน",
         icon: <NotebookPen className="h-8 w-8" />,
         color: "text-blue-700",
         items: [
            { href: "/study-plans/transfer-plan", label: "เทียบโอน" },
            { href: "/study-plans/four-year-plan", label: "4 ปี" },
            { href: "/study-plans/dve-lvc-plan", label: "ปวส. (ปวช.)" },
            { href: "/study-plans/dve-msix-plan", label: "ปวส. (ม.6)" },
         ]
      },
      {
         title: "ห้องเรียน",
         description: "จัดการข้อมูลห้องเรียน",
         icon: <School className="h-8 w-8" />,
         color: "text-green-700",
         items: [
            { href: "/rooms", label: "จัดการห้องเรียน" },
            { href: "/rooms/room-out", label: "ห้องวิชานอกสาขา" }
         ]
      },
      {
         title: "อาจารย์",
         description: "จัดการข้อมูลอาจารย์",
         icon: <SquareUser className="h-8 w-8" />,
         color: "text-purple-700",
         items: [
            { href: "/teachers", label: "จัดการรายชื่ออาจารย์" },
            { href: "/teachers/in-teacher", label: "อาจารย์วิชาในสาขา" },
            { href: "/teachers/out-teacher", label: "อาจารย์วิชานอกสาขา" },
         ]
      }
   ]

   const timetableActions = [
      {
         title: "จัดตารางเรียน เทียบโอน",
         icon: <Table className="h-6 w-6" />,
         color: "border-blue-600",
         iconColor: "text-blue-600 dark:text-blue-400",
         items: [
            { href: "/adjust-time-tables/adjust-plan-transfer/transfer-one-year", label: "ปี 1" },
            { href: "/adjust-time-tables/adjust-plan-transfer/transfer-two-year", label: "ปี 2" },
            ...(isTerm3 ? [] : [{ href: "/adjust-time-tables/adjust-plan-transfer/transfer-three-year", label: "ปี 3" }]),
         ]
      },
      ...(isTerm3 ? [] : [{
         title: "จัดตารางเรียน 4 ปี",
         icon: <Table className="h-6 w-6" />,
         color: "border-green-600",
         iconColor: "text-green-600 dark:text-green-400",
         items: [
            { href: "/adjust-time-tables/adjust-plan-four-year/four-one-year", label: "ปี 1" },
            { href: "/adjust-time-tables/adjust-plan-four-year/four-two-year", label: "ปี 2" },
            { href: "/adjust-time-tables/adjust-plan-four-year/four-three-year", label: "ปี 3" },
            { href: "/adjust-time-tables/adjust-plan-four-year/four-four-year", label: "ปี 4" },
         ]
      }]),
      {
         title: "จัดตารางเรียน ปวส.",
         icon: <Table className="h-6 w-6" />,
         color: "border-orange-600",
         iconColor: "text-orange-600 dark:text-orange-400",
         items: [
            { href: "/adjust-time-tables/adjust-plan-dve/dve-one-year", label: "ปวส. ปี 1 (ปวช.)" },
            { href: "/adjust-time-tables/adjust-plan-dve/dve-two-year", label: "ปวส. ปี 2 (ปวช.)" },
            { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-one-year", label: "ปวส. ปี 1 (ม.6)" },
            { href: "/adjust-time-tables/adjust-plan-dve/dve-ms-two-year", label: "ปวส. ปี 2 (ม.6)" },
         ]
      }
   ]

   const utilityActions = [
      {
         title: "ตารางสอน",
         description: "ดูตารางสอนทั้งหมด",
         icon: <Grid2x2Check className="h-6 w-6" />,
         href: "/class-schedule",
         color: "text-indigo-600 dark:text-indigo-400"
      },
      {
         title: "การใช้ห้อง",
         description: "ตรวจสอบการใช้ห้องเรียน",
         icon: <House className="h-6 w-6" />,
         href: "/rooms-use",
         color: "text-emerald-600 dark:text-emerald-400"
      },
      {
         title: "ปฏิทินการศึกษา",
         description: "ดูปฏิทินและกำหนดการ",
         icon: <Calendar className="h-6 w-6" />,
         href: "/academic-calendar",
         color: "text-rose-600 dark:text-rose-400"
      }
   ]

   return (
      <div className="space-y-6">

         <div className="bg-gradient-to-r bg-blue-600 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ, {session?.user?.name || "ผู้ดูแลระบบ"}</h1>
                  <p className="text-white">ระบบจัดตารางเรียน สาขาวิศวกรรมคอมพิวเตอร์</p>
               </div>
               <div className="text-right">
                  <p className="text-sm text-white mb-1">{currentTime}</p>
                  {currentTermYear && (
                     <p className="text-sm text-white">ภาคเรียนที่ {currentTermYear}</p>
                  )}
               </div>
            </div>
            <div className="flex gap-2">
               <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {session?.user?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}
               </Badge>
               {currentTermYear && (
                  <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                     ปัจจุบัน: {currentTermYear}
                  </Badge>
               )}
            </div>
         </div>


         <div>
            <h2 className="text-xl font-semibold mb-4">จัดการข้อมูล</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {quickActions.map((action) => (
                  <Card key={action.title}>
                     <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                           <div className={`p-3 rounded-lg ${action.color}`}>
                              {action.icon}
                           </div>
                           <div>
                              <CardTitle className="text-lg">{action.title}</CardTitle>
                              <CardDescription className="text-sm dark:text-white text-black">{action.description}</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2">
                           {action.items.map((item) => (
                              <Link key={item.href} href={item.href}>
                                 <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                                    {item.label}
                                 </Button>
                              </Link>
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>


         <div>
            <h2 className="text-xl font-semibold mb-4">จัดการตารางเรียน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {timetableActions.map((action) => (
                  <Card key={action.title} className={`cursor-pointer transition-all ${action.color}`}>
                     <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                           <CardTitle className="text-base flex items-center gap-2">
                              <span className={action.iconColor}>{action.icon}</span>
                              {action.title}
                           </CardTitle>
                        </div>
                     </CardHeader>
                     <CardContent className="pt-0">
                        <div className="space-y-1">
                           {action.items.map((item) => (
                              <Link key={item.href} href={item.href}>
                                 <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
                                    {item.label}
                                    <ArrowRight className="h-3 w-3" />
                                 </Button>
                              </Link>
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>


         <div>
            <h2 className="text-xl font-semibold mb-4">ตารางและปฏิทิน</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {utilityActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                     <Card>
                        <CardContent className="p-6">
                           <div className="flex items-center justify-between">
                              <div>
                                 <h3 className="font-medium text-base mb-1">{action.title}</h3>
                                 <p className="text-sm">{action.description}</p>
                              </div>
                              <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                                 {action.icon}
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </Link>
               ))}
            </div>
         </div>
      </div>
   )
}