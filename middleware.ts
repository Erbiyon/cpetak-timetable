import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(_req) {

    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
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