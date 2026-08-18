// แยกจาก lib/auth.ts เพราะไฟล์นั้น import mongoose/mongodb ซึ่งรันบน Edge Runtime (middleware.ts) ไม่ได้
export const SESSION_COOKIE = 'session';

// ไม่มี request ใหม่เข้ามาเกิน 10 นาที ถือว่า session หมดอายุ → auto logout
// middleware.ts เลื่อนอายุออกไปอีก 10 นาทีทุกครั้งที่มี request (sliding expiration)
// จึงยังนับเป็น "ปิดเว็บ/หยุดใช้งาน" แม้ปิด browser process จริงๆ ไม่ได้ (ต่างจาก session cookie เดิมที่พึ่งพฤติกรรมเบราว์เซอร์ล้วนๆ)
export const SESSION_MAX_AGE_SECONDS = 10 * 60;

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  };
}
