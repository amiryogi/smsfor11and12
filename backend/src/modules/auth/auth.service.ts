import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import {
  InvalidCredentialsException,
  AccountDeactivatedException,
} from '../../common/exceptions/business.exceptions.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
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

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      }),
    ]);

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

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive) throw new InvalidCredentialsException();

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
      });

      return { accessToken };
    } catch {
      throw new InvalidCredentialsException();
    }
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
}
