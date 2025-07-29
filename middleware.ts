import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(req) {
        // สามารถเพิ่ม logic เพิ่มเติมได้ที่นี่
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // ตรวจสอบ role สำหรับหน้าต่างๆ
                if (req.nextUrl.pathname.startsWith("/teacher-use")) {
                    return token?.role === "teacher"
                }
                if (req.nextUrl.pathname.startsWith("/study-plans")) {
                    return token?.role === "admin"
                }
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        "/teacher-use/:path*",
        "/study-plans/:path*",
        "/adjust-time-tables/:path*"
    ]
}