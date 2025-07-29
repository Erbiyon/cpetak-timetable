import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            id: "teacher-login",
            name: "Teacher",
            credentials: {
                teacherId: { label: "รหัสประจำตัวอาจารย์", type: "text" },
                password: { label: "รหัสผ่าน", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.teacherId || !credentials?.password) {
                    return null
                }

                try {
                    // หาอาจารย์จาก tId
                    const teacher = await prisma.teacher_tb.findFirst({
                        where: {
                            tId: credentials.teacherId
                        }
                    })

                    // ตรวจสอบว่าพบอาจารย์และรหัสผ่านตรงกัน (tId เป็นทั้ง username และ password)
                    if (teacher && credentials.password === teacher.tId) {
                        return {
                            id: teacher.id.toString(),
                            name: `${teacher.tName} ${teacher.tLastName}`,
                            email: teacher.tId,
                            teacherId: teacher.tId,
                            teacherType: teacher.teacherType
                        }
                    }

                    return null
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            }
        }),
        CredentialsProvider({
            id: "admin-login",
            name: "Admin",
            credentials: {
                adminId: { label: "รหัสผู้ดูแล", type: "text" },
                password: { label: "รหัสผ่าน", type: "password" }
            },
            async authorize(credentials) {
                // ตรวจสอบ admin (hardcode หรือจาก database)
                if (credentials?.adminId === "admin" && credentials?.password === "admin123") {
                    return {
                        id: "admin",
                        name: "ผู้ดูแลระบบ",
                        email: "admin@system.com",
                        role: "admin"
                    }
                }
                return null
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.teacherId = user.teacherId
                token.teacherType = user.teacherType
                token.role = user.role || "teacher"
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub as string
                session.user.teacherId = token.teacherId as string
                session.user.teacherType = token.teacherType as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }