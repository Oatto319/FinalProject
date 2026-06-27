import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth';
import { User } from '@/lib/models';

// POST /api/logout → clear server session
export async function POST(req: NextRequest) {
  await connectDB();
  const user = await getSessionUser(req);
  if (user) await User.updateOne({ _id: user._id }, { $set: { sessionToken: null } });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
