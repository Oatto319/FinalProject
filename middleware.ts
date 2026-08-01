import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session-cookie';

// หน้าที่เข้าถึงได้โดยไม่ต้อง login (อยู่ระหว่างสมัครสมาชิก/เข้าสู่ระบบเอง)
const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // เขียน cookie ตัวเดิมซ้ำพร้อม maxAge ใหม่ทุกครั้งที่มี request เข้ามา (sliding expiration)
  // ถ้าผู้ใช้หยุดใช้งานเกิน 10 นาที cookie จะหมดอายุเองฝั่งเบราว์เซอร์ → request ครั้งถัดไปไม่มี token → เด้งไป /login
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|SVG|PNG|JPG|JPEG|GIF|WEBP|ICO)$).*)'],
};
