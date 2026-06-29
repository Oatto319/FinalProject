import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models';
import { getSessionUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_TOTAL_MEMBERS = 300;
const MAX_GROUP_SIZE = 50;

// POST /api/rooms → create room (host identity comes from the session, not the body)
export async function POST(req: NextRequest) {
  await connectDB();
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!checkRateLimit(`create-room:${sessionUser.gmail}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'สร้างห้องบ่อยเกินไป กรุณาลองใหม่ในอีกสักครู่' }, { status: 429 });
  }

  const body = await req.json();
  const { roomId, title, description, totalMembers, groupSize, template, matchMode } = body;
  if (!roomId || !title) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  if (String(title).length > TITLE_MAX_LENGTH) {
    return NextResponse.json({ error: `ชื่อห้องต้องไม่เกิน ${TITLE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
  }
  if (description && String(description).length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json({ error: `รายละเอียดต้องไม่เกิน ${DESCRIPTION_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
  }
  if (!(Number(totalMembers) >= 1) || Number(totalMembers) > MAX_TOTAL_MEMBERS) {
    return NextResponse.json({ error: `จำนวนคนทั้งหมดต้องอยู่ระหว่าง 1-${MAX_TOTAL_MEMBERS} คน` }, { status: 400 });
  }
  if (!(Number(groupSize) >= 1) || Number(groupSize) > MAX_GROUP_SIZE) {
    return NextResponse.json({ error: `จำนวนคนต่อกลุ่มต้องอยู่ระหว่าง 1-${MAX_GROUP_SIZE} คน` }, { status: 400 });
  }

  try {
    const room = await Room.create({
      roomId, title, description, totalMembers, groupSize, template, matchMode,
      hostName: sessionUser.name,
      hostGmail: sessionUser.gmail,
      hostAvatarSeed: sessionUser.avatarSeed,
      hostAvatarImage: sessionUser.avatarImage,
    });
    return NextResponse.json({ room: room.toObject() }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Room ID นี้ถูกใช้ไปแล้ว กรุณาลองใหม่' }, { status: 409 });
    }
    throw err;
  }
}
