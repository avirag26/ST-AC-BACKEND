import type { Response } from 'express';
export declare const REFRESH_COOKIE_NAME = "refresh_token";
export declare function setRefreshCookie(res: Response, token: string, maxAgeMs: number): void;
export declare function clearRefreshCookie(res: Response): void;
