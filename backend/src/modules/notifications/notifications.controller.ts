import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Query() query: NotificationQueryDto,
  ) {
    // Support both ?unreadOnly=true and ?isRead=false from frontend
    const onlyUnread = query.unreadOnly === 'true' || query.isRead === 'false';
    return this.notificationsService.findAllForUser(
      req.user.schoolId,
      req.user.sub,
      query,
      onlyUnread,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: { user: { sub: string; schoolId: string } }) {
    return this.notificationsService.getUnreadCount(
      req.user.schoolId,
      req.user.sub,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(
      req.user.schoolId,
      req.user.sub,
      id,
    );
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllAsReadPost(
    @Request() req: { user: { sub: string; schoolId: string } },
  ) {
    return this.notificationsService.markAllAsRead(
      req.user.schoolId,
      req.user.sub,
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@Request() req: { user: { sub: string; schoolId: string } }) {
    return this.notificationsService.markAllAsRead(
      req.user.schoolId,
      req.user.sub,
    );
  }
}
