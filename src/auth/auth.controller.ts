import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from './auth-cookies';
import { AuthService } from './auth.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTutorDto } from './dto/register-tutor.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type AuthRequest = Request & {
  user: { userId: string; role: string };
  cookies?: Record<string, string>;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setRefreshCookie(
      res,
      result.refreshToken,
      this.authService.refreshCookieMaxAgeMs,
    );
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login/email')
  async loginWithEmail(
    @Body() dto: LoginEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithEmail(dto);
    setRefreshCookie(
      res,
      result.refreshToken,
      this.authService.refreshCookieMaxAgeMs,
    );
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await this.authService.refresh(refreshToken);
    setRefreshCookie(
      res,
      result.refreshToken,
      this.authService.refreshCookieMaxAgeMs,
    );
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(refreshToken);
    clearRefreshCookie(res);
    return { message: 'Signed out.' };
  }

  @Post('register/tutor')
  registerTutor(@Body() dto: RegisterTutorDto) {
    return this.authService.registerTutor(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.authService.me(req.user.userId);
  }
}
