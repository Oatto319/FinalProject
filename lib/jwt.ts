import { SignJWT, jwtVerify } from 'jose';
import { SESSION_MAX_AGE_SECONDS } from './session-cookie';

// แยกจาก lib/auth.ts เพราะไฟล์นั้น import mongoose ซึ่งรันบน Edge Runtime (middleware.ts) ไม่ได้
// jose ใช้ Web Crypto จึงทำงานได้ทั้ง Edge และ Node ต่างจาก jsonwebtoken ที่พึ่ง Node crypto module

export type SessionJWTPayload = {
  sub: string; // gmail
  tv: number;  // tokenVersion ตอนออก token — ใช้เทียบกับ DB เพื่อ revoke ตอน logout
};

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signSessionJWT(payload: SessionJWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getJwtSecretKey());
}

// ไม่ throw — คืน null เสมอเมื่อ token ไม่ valid (หมดอายุ/ปลอม/ผิดรูปแบบ) เพราะ caller (middleware, getSessionUser) ต้องการแค่ valid/invalid
export async function verifySessionJWT(token: string): Promise<SessionJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (typeof payload.sub !== 'string' || typeof payload.tv !== 'number') return null;
    return { sub: payload.sub, tv: payload.tv };
  } catch {
    return null;
  }
}
