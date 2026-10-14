import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { HttpError } from "./response";

export type SessionPayload = {
  sub: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
};

const COOKIE_NAME = "session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s;
}

export async function createSession(userId: string, role: "user" | "admin") {
  const token = jwt.sign({ sub: userId, role }, secret(), { expiresIn: "7d" });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "user" && payload.role !== "admin") ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    return { sub: payload.sub, role: payload.role, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "You must be logged in.");
  return s;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "You must be logged in.");
  if (s.role !== "admin") throw new HttpError(403, "You do not have permission to do that.");
  return s;
}
