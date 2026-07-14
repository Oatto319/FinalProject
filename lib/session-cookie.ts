// แยกจาก lib/auth.ts เพราะไฟล์นั้น import mongoose/mongodb ซึ่งรันบน Edge Runtime (middleware.ts) ไม่ได้
export const SESSION_COOKIE = 'session';
