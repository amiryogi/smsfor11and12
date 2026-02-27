import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import {
  InvalidCredentialsException,
  AccountDeactivatedException,
  InvalidResetTokenException,
} from '../../common/exceptions/business.exceptions.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import type { EmailJobData } from './processors/email.processor.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new InvalidCredentialsException();

    if (!user.isActive) throw new AccountDeactivatedException();

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new InvalidCredentialsException();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    // Create server-side refresh token with rotation
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Refresh token rotation: verify the old token, revoke it, issue a new pair.
   * If the token was already revoked (replay attack), revoke ALL tokens for that user.
   */
  async refreshToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (!storedToken) throw new InvalidCredentialsException();

    // Replay detection: if the token was already revoked, revoke entire family
    if (storedToken.isRevoked) {
      this.logger.warn(
        `Refresh token replay detected for user ${storedToken.userId}. Revoking all tokens.`,
      );
      await this.revokeAllUserTokens(storedToken.userId);
      throw new InvalidCredentialsException();
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new InvalidCredentialsException();
    }

    // Revoke the old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Check user is still active
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user || !user.isActive) {
      await this.revokeAllUserTokens(storedToken.userId);
      throw new InvalidCredentialsException();
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const newRefreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke a specific refresh token (logout).
   */
  async logout(rawToken: string | undefined) {
    if (!rawToken) return { message: 'Logged out successfully' };

    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Revoke ALL refresh tokens for a user (deactivation, password change, etc.).
   */
  async revokeAllUserTokens(userId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    this.logger.log(`Revoked ${result.count} refresh tokens for user ${userId}`);
    return result.count;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new InvalidCredentialsException();

    const passwordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) throw new InvalidCredentialsException();

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens on password change
    await this.revokeAllUserTokens(userId);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        phone: true,
        profilePicS3Key: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new InvalidCredentialsException();
    return user;
  }

  async uploadAvatar(
    userId: string,
    schoolId: string,
    file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new InvalidCredentialsException();

    const { s3Key, size } = await this.storage.uploadBuffer(
      file.buffer,
      `users/${schoolId}/avatars`,
      file.mimetype,
    );

    // Save file asset record
    await this.prisma.fileAsset.create({
      data: {
        schoolId,
        s3Key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: size,
        context: 'PROFILE_PIC',
      },
    });

    // Update user photo reference
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicS3Key: s3Key },
    });

    return { s3Key };
  }

  // ==========================================================================
  // Forgot / Reset Password
  // ==========================================================================

  /**
   * Generate a 6-digit OTP, hash it, store in PasswordResetToken, queue email.
   * Always returns success to prevent email enumeration.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.isActive) {
      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const tokenHash = this.hashToken(otp);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      // Invalidate any existing unused tokens for this user
      await this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      // Queue email via BullMQ
      const appName = this.config.get<string>('APP_NAME', 'SMS Nepal');
      await this.emailQueue.add(
        'password-reset',
        {
          to: user.email,
          subject: `${appName} — Password Reset OTP`,
          html: `
            <h2>Password Reset</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your password reset OTP is:</p>
            <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center;">${otp}</h1>
            <p>This code expires in <strong>15 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
          text: `Your password reset OTP is: ${otp}. It expires in 15 minutes.`,
          context: 'password-reset',
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 50,
          removeOnFail: false,
        },
      );

      this.logger.log(`Password reset OTP queued for ${email}`);
    }

    // Always return same response to prevent email enumeration
    return {
      message:
        'If the email exists, a password reset OTP has been sent.',
    };
  }

  /**
   * Verify OTP token and reset the password.
   */
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
    });

    if (!resetToken) throw new InvalidResetTokenException();

    if (resetToken.expiresAt < new Date()) {
      // Mark as used so it can't be retried
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
      throw new InvalidResetTokenException();
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Revoke all refresh tokens (force re-login everywhere)
    await this.revokeAllUserTokens(resetToken.userId);

    this.logger.log(`Password reset completed for user ${resetToken.userId}`);
    return { message: 'Password has been reset successfully. Please log in.' };
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Create a new server-side refresh token.
   * Returns the raw opaque token string (to be sent to the client).
   */
  private async createRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawToken);

    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date(
      Date.now() + this.parseDuration(refreshExpiresIn!),
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return rawToken;
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private parseDuration(str: string): number {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
