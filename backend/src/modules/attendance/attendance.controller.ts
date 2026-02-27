import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { AttendanceQueryDto } from './dto/attendance-query.dto.js';
import { AttendanceService } from './attendance.service.js';
import { TakeAttendanceDto } from './dto/take-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'attendance', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async takeAttendance(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: TakeAttendanceDto,
  ) {
    return this.attendanceService.takeAttendance(
      req.user.schoolId,
      dto,
      req.user.sub,
    );
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.findAll(
      req.user.schoolId,
      query,
      query.gradeId,
      query.academicYearId,
      query.fromDate,
      query.toDate,
    );
  }

  @Get('student/:studentId/summary')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  async getStudentSummary(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(
      req.user.schoolId,
      studentId,
      academicYearId,
    );
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.attendanceService.findOne(req.user.schoolId, id);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(
      req.user.schoolId,
      id,
      dto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    await this.attendanceService.remove(req.user.schoolId, id, req.user.sub);
  }
}
