import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { AdminService } from './admin.service.js';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/queue-stats – summary counts for every registered queue */
  @Get('queue-stats')
  getQueueStats() {
    return this.adminService.getQueueStats();
  }

  /** GET /admin/failed-jobs?queue=pdf-generation&start=0&limit=50 */
  @Get('failed-jobs')
  listFailedJobs(
    @Query('queue') queueName?: string,
    @Query('start', new DefaultValuePipe(0), ParseIntPipe) start?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.listFailedJobs(queueName, start, limit);
  }

  /** POST /admin/failed-jobs/:queue/:jobId/retry */
  @Post('failed-jobs/:queue/:jobId/retry')
  retryJob(
    @Param('queue') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    return this.adminService.retryJob(queueName, jobId);
  }

  /** DELETE /admin/failed-jobs/:queue/:jobId */
  @Delete('failed-jobs/:queue/:jobId')
  removeJob(
    @Param('queue') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    return this.adminService.removeJob(queueName, jobId);
  }
}
