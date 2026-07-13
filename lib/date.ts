// แอปนี้ใช้งานในไทยเป็นหลัก — ใช้เขตเวลาไทยตายตัวสำหรับ "วันนี้" แทนเขตเวลาของเครื่อง server/ผู้ใช้
// เพื่อไม่ให้ผลลัพธ์ต่างกันตาม timezone ของอุปกรณ์ที่รันโค้ด (client เครื่องผู้ใช้ vs server ที่อาจรันเป็น UTC)
export const APP_TIMEZONE = 'Asia/Bangkok';

const bangkokFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE });

/** วันที่ปัจจุบันตามเขตเวลาไทย ในรูปแบบ YYYY-MM-DD */
export function todayDateString(): string {
  return bangkokFormatter.format(new Date());
}

/** แปลง Date เป็น YYYY-MM-DD ตามเขตเวลาไทย */
export function toDateString(date: Date): string {
  return bangkokFormatter.format(date);
}

/** แปลง YYYY-MM-DD (วันที่ตามปฏิทินไทย ไม่มี timezone) ให้เป็น Date ที่เที่ยงคืนตามเขตเวลาไทย */
export function dateStringToUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+07:00`);
}
