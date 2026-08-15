import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { NextRequest } from 'next/server';
import { signSessionJWT } from './jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
});

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));

interface MockUser { gmail: string; tokenVersion?: number }
let mockUsers: MockUser[] = [];

vi.mock('@/lib/models', () => ({
  User: {
    findOne: vi.fn((filter: { gmail: string }) =>
      Promise.resolve(mockUsers.find((u) => u.gmail === filter.gmail) ?? null)
    ),
  },
}));

const { getSessionUser } = await import('./auth');

function reqWithCookie(value: string | undefined): NextRequest {
  return {
    cookies: { get: () => (value === undefined ? undefined : { value }) },
  } as unknown as NextRequest;
}

describe('getSessionUser', () => {
  it('returns null when no cookie is present', async () => {
    expect(await getSessionUser(reqWithCookie(undefined))).toBeNull();
  });

  it('returns null for a malformed/invalid token', async () => {
    expect(await getSessionUser(reqWithCookie('garbage'))).toBeNull();
  });

  it('returns null when the user no longer exists', async () => {
    mockUsers = [];
    const token = await signSessionJWT({ sub: 'ghost@gmail.com', tv: 0 });
    expect(await getSessionUser(reqWithCookie(token))).toBeNull();
  });

  it('returns null when tokenVersion does not match (revoked by logout)', async () => {
    mockUsers = [{ gmail: 'user@gmail.com', tokenVersion: 1 }];
    // token ออกตอน tokenVersion ยังเป็น 0 — จำลอง token เก่าที่ถูก revoke ไปแล้วหลัง logout เพิ่มค่าเป็น 1
    const staleToken = await signSessionJWT({ sub: 'user@gmail.com', tv: 0 });
    expect(await getSessionUser(reqWithCookie(staleToken))).toBeNull();
  });

  it('returns the user for a valid, current token', async () => {
    mockUsers = [{ gmail: 'user@gmail.com', tokenVersion: 2 }];
    const token = await signSessionJWT({ sub: 'user@gmail.com', tv: 2 });
    const user = await getSessionUser(reqWithCookie(token));
    expect(user).toEqual({ gmail: 'user@gmail.com', tokenVersion: 2 });
  });
});
