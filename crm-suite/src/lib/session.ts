import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UserWithPermissions = {
  role: { permissions: { key: string }[] } | null;
} | null;

export async function getCurrentUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload?.sub) return null;
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) }, include: { role: { include: { permissions: true } } } });
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function hasPermission(user: UserWithPermissions, key: string) {
  return user?.role?.permissions?.some((p) => p.key === key) ?? false;
}

export async function requirePermission(key: string) {
  const user = await requireAuth();
  if (!hasPermission(user as unknown as UserWithPermissions, key)) throw new Error("FORBIDDEN");
  return user;
}