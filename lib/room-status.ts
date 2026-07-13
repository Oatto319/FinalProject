// ระยะเวลา fallback สำหรับห้องที่ไม่ได้ตั้ง deadline ไว้ — ถือว่าจบกิจกรรมหลังจับกลุ่มเสร็จไปแล้ว 7 วัน
export const EVALUATION_FALLBACK_DAYS = 7;

interface RoomLifecycleFields {
  matchDone?: boolean;
  deadline?: Date | string | null;
  matchedAt?: Date | string | null;
  endedManually?: boolean;
  // ห้องทุกห้องมี timestamps (Mongoose timestamps: true) แม้ห้องเก่าก่อนมี matchedAt — ใช้เป็น fallback anchor
  updatedAt?: Date | string | null;
}

/** ห้องถือว่า "สิ้นสุด" เมื่อจับกลุ่มไปแล้ว และ (host กดจบเอง หรือ เลยกำหนดส่ง หรือ เลย 7 วันหลังจับกลุ่มในกรณีไม่ได้ตั้งกำหนดส่ง)
 *  ห้องที่จับกลุ่มไปแล้วก่อนมีฟิลด์ matchedAt (ข้อมูลเก่า) จะใช้ updatedAt แทน — ถ้าไม่มีการอัปเดตห้องนั้นมา 7 วันแล้ว ถือว่าจบ */
export function isRoomEnded(room: RoomLifecycleFields): boolean {
  if (!room.matchDone) return false;
  if (room.endedManually) return true;
  if (room.deadline) return Date.now() >= new Date(room.deadline).getTime();
  const anchor = room.matchedAt ?? room.updatedAt ?? null;
  if (anchor) {
    return Date.now() - new Date(anchor).getTime() >= EVALUATION_FALLBACK_DAYS * 24 * 60 * 60 * 1000;
  }
  return false;
}
