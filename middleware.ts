import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session-cookie';
import { signSessionJWT, verifySessionJWT } from '@/lib/jwt';

// หน้าที่เข้าถึงได้โดยไม่ต้อง login (อยู่ระหว่างสมัครสมาชิก/เข้าสู่ระบบเอง)
const PUBLIC_PATHS = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ตรวจ signature + วันหมดอายุได้จริงตั้งแต่ชั้น Edge (เดิมเช็คได้แค่ "มี cookie ไหม" เพราะต่อ DB ไม่ได้)
  // หมายเหตุ: ยังไม่เช็ค tokenVersion (revocation) ตรงนี้ เพราะ Edge runtime ต่อ Mongo ไม่ได้ — เช็คที่ getSessionUser() ต่อ ไม่ใช่ regression จากพฤติกรรมเดิม
  const payload = await verifySessionJWT(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
    return res;
  }

  // เซ็น JWT ใหม่พร้อมวันหมดอายุที่ต่ออายุแล้วทุกครั้งที่มี request เข้ามา (sliding expiration)
  // ถ้าผู้ใช้หยุดใช้งานเกิน 10 นาที cookie จะหมดอายุเองฝั่งเบราว์เซอร์ → request ครั้งถัดไปไม่มี token/verify ไม่ผ่าน → เด้งไป /login
  const refreshedToken = await signSessionJWT(payload);
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, refreshedToken, sessionCookieOptions());
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|SVG|PNG|JPG|JPEG|GIF|WEBP|ICO)$).*)'],
};
