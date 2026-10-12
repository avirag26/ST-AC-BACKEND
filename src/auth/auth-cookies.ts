import type { Response } from 'express';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
  });
}
