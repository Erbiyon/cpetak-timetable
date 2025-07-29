import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role?: string
            userType?: string
            teacherId?: string
            teacherType?: string
            adminId?: string
            loginType?: string
        }
    }

    interface User {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
        userType?: string
        teacherId?: string
        teacherType?: string
        adminId?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string
        userType?: string
        teacherId?: string
        teacherType?: string
        adminId?: string
        loginType?: string
    }
}