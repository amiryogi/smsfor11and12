import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Controller({ path: 'schools/:schoolId/notifications', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Query() pagination: PaginationDto,
    @Query('unreadOnly') unreadOnly?: string,
    @Req() req?: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.notificationsService.findAllForUser(
      schoolId,
      userId,
      pagination,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  getUnreadCount(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.notificationsService.getUnreadCount(schoolId, userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Param('id', ParseUuidPipe) id: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.notificationsService.markAsRead(schoolId, userId, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(
    @Param('schoolId', ParseUuidPipe) schoolId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.sub;
    return this.notificationsService.markAllAsRead(schoolId, userId);
  }
}
