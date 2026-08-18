import { describe, it, expect, beforeAll } from 'vitest';
import { signSessionJWT, verifySessionJWT } from './jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
});

describe('signSessionJWT / verifySessionJWT', () => {
  it('round-trips a valid token', async () => {
    const token = await signSessionJWT({ sub: 'user@gmail.com', tv: 3 });
    const payload = await verifySessionJWT(token);
    expect(payload).toEqual({ sub: 'user@gmail.com', tv: 3 });
  });

  it('rejects a malformed token', async () => {
    expect(await verifySessionJWT('not-a-jwt')).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signSessionJWT({ sub: 'user@gmail.com', tv: 0 });
    process.env.JWT_SECRET = 'a-different-secret';
    expect(await verifySessionJWT(token)).toBeNull();
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
  });

  it('rejects an expired token', async () => {
    // ปลอมเวลาปัจจุบันให้เป็นก่อนหน้านี้พอที่ exp (max age) จะผ่านไปแล้วตอน verify
    const realNow = Date.now;
    Date.now = () => realNow() - 11 * 60 * 1000; // 11 นาทีที่แล้ว (session max age = 10 นาที)
    const token = await signSessionJWT({ sub: 'user@gmail.com', tv: 0 });
    Date.now = realNow;

    expect(await verifySessionJWT(token)).toBeNull();
  });
});
