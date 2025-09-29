"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoaderCircle } from "lucide-react"
import DashboardCustom from "@/components/dashboard/dashboard-custom"

export default function DashboardPage() {
   const { data: session, status } = useSession()
   const router = useRouter()

   useEffect(() => {
      if (status === "loading") return


      if (status === "unauthenticated" || !session) {
         router.push("/login")
         return
      }


      if (status === "authenticated" && session.user?.role === "teacher") {
         router.push("/teacher-use/time-table")
         return
      }
   }, [session, status, router])

   if (status === "loading") {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
               <LoaderCircle className="animate-spin mx-auto h-8 w-8 mb-4" />
               <p className="text-muted-foreground">กำลังโหลด...</p>
            </div>
         </div>
      )
   }


   if (status !== "authenticated" || !session || session.user?.role !== "admin") {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
               <LoaderCircle className="animate-spin mx-auto h-8 w-8 mb-4" />
               <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
            </div>
         </div>
      )
   }

   return (
      <div className="container mx-auto py-6 px-4">
         <DashboardCustom />
      </div>
   )
}