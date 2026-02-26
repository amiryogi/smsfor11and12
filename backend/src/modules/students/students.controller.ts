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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequireRoles } from '../../common/decorators/require-roles.decorator.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { StudentQueryDto } from './dto/student-query.dto.js';
import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { LinkParentDto } from './dto/link-parent.dto.js';
import { EnrollmentService } from './enrollment.service.js';
import { Role, StudentStatus } from '@prisma/client';

@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: StudentQueryDto,
  ) {
    return this.studentsService.findAll(
      req.user.schoolId,
      query,
      query.status as StudentStatus | undefined,
      query.gradeId,
      query.search,
    );
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.studentsService.findOne(req.user.schoolId, id);
  }

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.create(req.user.schoolId, dto, req.user.sub);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(
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
    await this.studentsService.remove(req.user.schoolId, id, req.user.sub);
  }

  // --- Parent linking ---

  @Post(':studentId/parents')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async linkParent(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Body() dto: LinkParentDto,
  ) {
    return this.studentsService.linkParent(req.user.schoolId, studentId, dto);
  }

  @Get(':studentId/parents')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async findParents(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.studentsService.findParents(req.user.schoolId, studentId);
  }

  @Delete(':studentId/parents/:parentId')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkParent(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
    @Param('parentId', ParseUuidPipe) parentId: string,
  ) {
    await this.studentsService.unlinkParent(
      req.user.schoolId,
      studentId,
      parentId,
    );
  }

  // --- Photo upload ---

  @Post(':id/photo')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.uploadPhoto(req.user.schoolId, id, file);
  }

  // --- Enrollment history ---

  @Get(':studentId/enrollments')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  async findEnrollmentsByStudent(
    @Request() req: { user: { schoolId: string } },
    @Param('studentId', ParseUuidPipe) studentId: string,
  ) {
    return this.enrollmentService.findByStudent(req.user.schoolId, studentId);
  }
}
