"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoginPage from "./login/page"
import { LoaderCircle } from "lucide-react"

export default function Home() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === "loading") return


        if (status === "authenticated" && session?.user) {
            if (session.user.role === "admin") {
                router.push("/dashboard")
            } else if (session.user.role === "teacher") {
                router.push("/teacher-use/time-table")
            }
        }

    }, [session, status, router])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <LoaderCircle className="animate-spin mx-auto h-8 w-8 mb-4 text-white" />
                    <p className="text-white">กำลังโหลด...</p>
                </div>
            </div>
        )
    }


    if (status === "authenticated" && session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <LoaderCircle className="animate-spin mx-auto h-8 w-8 mb-4 text-white" />
                    <p className="text-white">กำลัง redirect...</p>
                </div>
            </div>
        )
    }


    return <LoginPage />
}
