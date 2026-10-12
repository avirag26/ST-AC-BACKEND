"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE_NAME = void 0;
exports.setRefreshCookie = setRefreshCookie;
exports.clearRefreshCookie = clearRefreshCookie;
exports.REFRESH_COOKIE_NAME = 'refresh_token';
function setRefreshCookie(res, token, maxAgeMs) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(exports.REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/api/auth',
        maxAge: maxAgeMs,
    });
}
function clearRefreshCookie(res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(exports.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/api/auth',
    });
}
//# sourceMappingURL=auth-cookies.js.map