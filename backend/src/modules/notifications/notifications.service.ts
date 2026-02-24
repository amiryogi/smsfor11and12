import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import {
  PaginationDto,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto.js';

interface CreateNotificationInput {
  schoolId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityName?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        schoolId: input.schoolId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityName: input.entityName,
        entityId: input.entityId,
      },
    });

    // Push via WebSocket
    this.gateway.sendToUser(input.userId, 'notification', notification);

    return notification;
  }

  async broadcast(
    schoolId: string,
    input: Omit<CreateNotificationInput, 'userId' | 'schoolId'>,
    userIds: string[],
  ) {
    const notifications = await this.prisma.$transaction(
      userIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            schoolId,
            userId,
            type: input.type,
            title: input.title,
            message: input.message,
            entityName: input.entityName,
            entityId: input.entityId,
          },
        }),
      ),
    );

    // Push to school room
    this.gateway.sendToSchool(schoolId, 'notification', {
      type: input.type,
      title: input.title,
      message: input.message,
    });

    return notifications;
  }

  async findAllForUser(
    schoolId: string,
    userId: string,
    pagination: PaginationDto,
    unreadOnly?: boolean,
  ) {
    const where: any = { schoolId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
        take: pagination.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResponse(
      data,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  async markAsRead(schoolId: string, userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, schoolId, userId },
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(schoolId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { schoolId, userId, isRead: false },
      data: { isRead: true },
    });

    return { markedCount: result.count };
  }

  async getUnreadCount(schoolId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { schoolId, userId, isRead: false },
    });

    return { unreadCount: count };
  }
}
