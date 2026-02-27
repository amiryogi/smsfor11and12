import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Response,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

const REFRESH_COOKIE = 'sms_refresh_token';

@Controller({ path: 'auth', version: '1' })
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly isProd: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(dto.email, dto.password);

    this.setRefreshCookie(res, result.refreshToken);

    // Return access+refresh in body; web ignores refreshToken (uses cookie), mobile stores it
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Body() body: { refreshToken?: string },
  ) {
    // Accept refresh token from cookie (web) or body (mobile)
    const rawToken =
      (req.cookies?.[REFRESH_COOKIE] as string | undefined) ??
      body.refreshToken;

    if (!rawToken) throw new BadRequestException('No refresh token provided');

    const result = await this.authService.refreshToken(rawToken);

    this.setRefreshCookie(res, result.refreshToken);

    // Return refreshToken in body too so mobile clients (no cookies) can persist it
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(rawToken);

    // Clear the refresh cookie
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'strict' : 'lax',
      path: '/api/v1/auth',
    });

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req: { user: { sub: string; schoolId: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.authService.uploadAvatar(req.user.sub, req.user.schoolId, file);
  }

  // ==========================================================================
  // Private
  // ==========================================================================

  private setRefreshCookie(res: ExpressResponse, token: string) {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'strict' : 'lax',
      path: '/api/v1/auth',
      maxAge,
    });
  }
}
