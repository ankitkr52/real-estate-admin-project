import jwt from "jsonwebtoken";
import { HttpError } from "./response";

export type ActionPurpose = "verify-email" | "reset-password";

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s;
};

export function createActionToken(userId: string, purpose: ActionPurpose) {
  return jwt.sign({ sub: userId, purpose }, SECRET(), {
    expiresIn: purpose === "verify-email" ? "24h" : "1h",
  });
}

export function verifyActionToken(token: string, expected: ActionPurpose): string {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, SECRET()) as jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(400, "This link has expired. Request a new one.");
    }
    throw new HttpError(400, "This link is not valid.");
  }
  if (payload.purpose !== expected || typeof payload.sub !== "string") {
    throw new HttpError(400, "This link is not valid.");
  }
  return payload.sub;
}
