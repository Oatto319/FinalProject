import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth';
import { sessionCookieOptions } from '@/lib/session-cookie';
import { User } from '@/lib/models';

// POST /api/logout → clear server session
export async function POST(req: NextRequest) {
  await connectDB();
  const user = await getSessionUser(req);
  if (user) await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });

  const res = NextResponse.json({ ok: true });
  // ต้องส่ง attributes (โดยเฉพาะ secure) ให้ตรงกับตอนตั้ง cookie ไม่งั้นเบราว์เซอร์จะไม่ลบ cookie ที่เป็น Secure ให้
  res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return res;
}
