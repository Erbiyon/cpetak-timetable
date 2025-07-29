import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name: string
            email: string
            teacherId?: string
            teacherType?: string
            role?: string
        }
    }

    interface User {
        id: string
        name: string
        email: string
        teacherId?: string
        teacherType?: string
        role?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        teacherId?: string
        teacherType?: string
        role?: string
    }
}