import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const schoolId = client.handshake.query.schoolId as string;

    if (userId) {
      client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} joined user_${userId}`);
    }

    if (schoolId) {
      client.join(`school_${schoolId}`);
      this.logger.log(`Client ${client.id} joined school_${schoolId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('markRead')
  handleMarkRead(client: Socket, payload: { notificationId: string }) {
    // This is handled by the REST API, but we acknowledge the event
    return { event: 'markRead', data: { received: true } };
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  sendToSchool(schoolId: string, event: string, data: any) {
    this.server.to(`school_${schoolId}`).emit(event, data);
  }
}
