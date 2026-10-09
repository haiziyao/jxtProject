import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export function signToken() {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: "14d", algorithm: "HS256" });
}

export function verifyToken(token: string) {
  try {
    if (!JWT_SECRET) return false;
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return typeof payload !== "string" && payload.auth === true;
  } catch {
    return false;
  }
}

export { COOKIE_MAX_AGE, COOKIE_NAME };
