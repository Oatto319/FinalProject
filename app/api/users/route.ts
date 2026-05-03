import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models';

// GET /api/users?gmail=xxx&password=xxx  → login
// GET /api/users?gmail=xxx              → check duplicate
// GET /api/users?name=xxx               → lookup by name (fallback)
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const gmail    = searchParams.get('gmail')?.toLowerCase();
  const password = searchParams.get('password');
  const name     = searchParams.get('name');

  if (!gmail && !name) return NextResponse.json({ error: 'gmail or name required' }, { status: 400 });

  const user = gmail
    ? await User.findOne({ gmail })
    : await User.findOne({ name });
  if (!user) return NextResponse.json({ user: null });

  if (password !== undefined) {
    if (user.password !== password) return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: user.toObject() });
}

// POST /api/users → register
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { name, gender, gmail, password, avatarSeed, role } = body;

  const existing = await User.findOne({ gmail: gmail.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Gmail นี้ถูกใช้งานแล้ว' }, { status: 409 });

  const user = await User.create({ name, gender, gmail: gmail.toLowerCase(), password, avatarSeed: avatarSeed ?? 1, role: role ?? 'user' });
  return NextResponse.json({ user: user.toObject() }, { status: 201 });
}

// PATCH /api/users → update profile
export async function PATCH(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { gmail, ...updates } = body;
  if (!gmail) return NextResponse.json({ error: 'gmail required' }, { status: 400 });

  const user = await User.findOneAndUpdate(
    { gmail: gmail.toLowerCase() },
    { $set: updates },
    { new: true }
  );
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: user.toObject() });
}
