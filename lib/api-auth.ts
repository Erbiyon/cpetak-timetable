import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export type Role = "admin" | "teacher";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  role?: string;
  teacherId?: string;
  teacherType?: string;
}

export interface AuthSuccess {
  authorized: true;
  user: AuthenticatedUser;
}

export interface AuthFailure {
  authorized: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Validates whether the incoming request has a valid active session or JWT token.
 * Works seamlessly in both live Next.js App Router server execution and test contexts.
 */
export async function requireAuth(req?: NextRequest | Request): Promise<AuthResult> {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch (_err) {
    // In headless test environments or when headers context is missing, fall back to getToken
    if (req) {
      try {
        const token = await getToken({
          req: req as any,
          secret: authOptions.secret as string,
        });
        if (token) {
          session = {
            user: {
              id: (token.sub as string) || "user",
              name: (token.name as string) || null,
              role: token.role as string,
              teacherId: token.teacherId as string,
              teacherType: token.teacherType as string,
            },
          };
        }
      } catch (_e) {
        // Fallback failed
      }
    }
  }

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ (Unauthorized)" },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    user: session.user as AuthenticatedUser,
  };
}

/**
 * Validates that the user is authenticated and possesses one of the allowed roles.
 */
export async function requireRole(
  allowedRoles: Role[],
  req?: NextRequest | Request
): Promise<AuthResult> {
  const authResult = await requireAuth(req);
  if (!authResult.authorized) {
    return authResult;
  }

  const userRole = authResult.user.role as Role | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Forbidden: Insufficient permissions)" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Convenience helper specifically for Admin-only operations.
 */
export async function requireAdmin(req?: NextRequest | Request): Promise<AuthResult> {
  return requireRole(["admin"], req);
}

/**
 * Convenience helper for either Teacher or Admin.
 */
export async function requireTeacherOrAdmin(req?: NextRequest | Request): Promise<AuthResult> {
  return requireRole(["admin", "teacher"], req);
}
