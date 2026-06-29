import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User, Room } from '@/lib/models';
import { createSessionToken, getSessionUser, SESSION_COOKIE } from '@/lib/auth';

function safeUser(u: Record<string, unknown>) {
  const obj = { ...u };
  delete obj.password;
  delete obj.sessionToken;
  return obj;
}

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
}

// GET /api/users?gmail=xxx  → check duplicate / lookup
// GET /api/users?name=xxx   → lookup by name (fallback)
export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const gmail = searchParams.get('gmail')?.toLowerCase();
  const name  = searchParams.get('name');

  if (!gmail && !name) return NextResponse.json({ error: 'gmail or name required' }, { status: 400 });

  const user = gmail
    ? await User.findOne({ gmail })
    : await User.findOne({ name });
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: safeUser(user.toObject()) });
}

// POST /api/users → register
// POST /api/users (body: {action:'login', gmail, password}) → login
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  if (body.action === 'login') {
    const { gmail, password } = body;
    if (!gmail || !password) return NextResponse.json({ user: null }, { status: 400 });
    const user = await User.findOne({ gmail: gmail.toLowerCase() });
    if (!user) return NextResponse.json({ user: null });

    const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    let passwordOk: boolean;
    if (isHashed) {
      passwordOk = await bcrypt.compare(password, user.password);
    } else {
      // graceful migration: บัญชีเก่าที่ยังเป็น plaintext
      passwordOk = user.password === password;
      if (passwordOk) {
        // อัปเกรดเป็น hash โดยอัตโนมัติเมื่อ login สำเร็จ
        const hashed = await bcrypt.hash(password, 10);
        await User.updateOne({ gmail: user.gmail }, { $set: { password: hashed } });
      }
    }

    if (!passwordOk) return NextResponse.json({ user: null });

    const token = createSessionToken();
    await User.updateOne({ _id: user._id }, { $set: { sessionToken: token } });

    const res = NextResponse.json({ user: safeUser(user.toObject()) });
    setSessionCookie(res, token);
    return res;
  }

  const { name, gender, gmail, password, avatarSeed, avatarImage } = body;
  if (!name || !gmail || !password) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });

  const existing = await User.findOne({ gmail: gmail.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Gmail นี้ถูกใช้งานแล้ว' }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = createSessionToken();
  const user = await User.create({
    name, gender, gmail: gmail.toLowerCase(), password: hashedPassword,
    avatarSeed: avatarSeed ?? 1, avatarImage: avatarImage ?? null, role: 'user', sessionToken: token,
  });

  const res = NextResponse.json({ user: safeUser(user.toObject()) }, { status: 201 });
  setSessionCookie(res, token);
  return res;
}

// PATCH /api/users → update own profile (target user comes from the session, never from the body)
export async function PATCH(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const lowerGmail = sessionUser.gmail;
  const oldName: string = sessionUser.name;

  // Blacklist: ห้าม override password, gmail, sessionToken — อนุญาต role เฉพาะค่า valid
  const { password: _pw, gmail: _g, sessionToken: _st, role: rawRole, ...safeUpdates } = body;
  if (rawRole !== undefined) {
    if (rawRole === 'user' || rawRole === 'host') safeUpdates.role = rawRole;
  }
  const user = await User.findOneAndUpdate(
    { gmail: lowerGmail },
    { $set: safeUpdates },
    { returnDocument: 'after' }
  );

  if (body.name && body.name !== oldName) {
    const newName: string = body.name;

    // Update member name inside room member arrays
    await Room.updateMany(
      { 'members.gmail': lowerGmail },
      { $set: { 'members.$[elem].name': newName } },
      { arrayFilters: [{ 'elem.gmail': lowerGmail }] }
    );

    // Update readyUsers: remove old name then re-add for rooms where user was ready
    const readyRooms = await Room.find(
      { 'members.gmail': lowerGmail, readyUsers: oldName },
      { roomId: 1 }
    );
    await Room.updateMany(
      { 'members.gmail': lowerGmail },
      { $pull: { readyUsers: oldName } }
    );
    if (readyRooms.length > 0) {
      const readyRoomIds = readyRooms.map((r: { roomId: string }) => r.roomId);
      await Room.updateMany(
        { roomId: { $in: readyRoomIds } },
        { $addToSet: { readyUsers: newName } }
      );
    }

    // Update leaderId in matchedGroups
    await Room.updateMany(
      { 'matchedGroups.leaderId': oldName },
      { $set: { 'matchedGroups.$[g].leaderId': newName } },
      { arrayFilters: [{ 'g.leaderId': oldName }] }
    );

    // Update hostName for rooms this user created
    await Room.updateMany(
      { hostName: oldName },
      { $set: { hostName: newName } }
    );
  }

  return NextResponse.json({ user: safeUser(user!.toObject()) });
}
