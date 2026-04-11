import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-jwt-secret-change-me";
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export function signToken() {
  return jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: "14d" });
}

export function verifyToken(token: string) {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_MAX_AGE, COOKIE_NAME };
