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
import { BoardExamService } from './board-exam.service.js';
import { CreateBoardExamRegistrationDto } from './dto/create-board-exam-registration.dto.js';
import { UpdateBoardExamRegistrationDto } from './dto/update-board-exam-registration.dto.js';
import { BoardExamQueryDto } from './dto/board-exam-query.dto.js';
import { Role } from '@prisma/client';

@Controller({ path: 'board-exam-registrations', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoardExamController {
  constructor(private readonly boardExamService: BoardExamService) {}

  @Post()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: CreateBoardExamRegistrationDto,
  ) {
    return this.boardExamService.create(req.user.schoolId, dto, req.user.sub);
  }

  @Get()
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findAll(
    @Request() req: { user: { schoolId: string } },
    @Query() query: BoardExamQueryDto,
  ) {
    return this.boardExamService.findAll(
      req.user.schoolId,
      query,
      query.academicYearId,
      query.studentId,
      query.search,
    );
  }

  @Get(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async findOne(
    @Request() req: { user: { schoolId: string } },
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.boardExamService.findOne(req.user.schoolId, id);
  }

  @Patch(':id')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateBoardExamRegistrationDto,
  ) {
    return this.boardExamService.update(
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
    await this.boardExamService.remove(req.user.schoolId, id, req.user.sub);
  }
}
