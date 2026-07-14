import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session-cookie';

// หน้าที่เข้าถึงได้โดยไม่ต้อง login (อยู่ระหว่างสมัครสมาชิก/เข้าสู่ระบบเอง)
const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|SVG|PNG|JPG|JPEG|GIF|WEBP|ICO)$).*)'],
};
