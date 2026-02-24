import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { EnrollmentController } from './enrollment.controller.js';
import { EnrollmentService } from './enrollment.service.js';

@Module({
  controllers: [StudentsController, EnrollmentController],
  providers: [StudentsService, EnrollmentService],
  exports: [StudentsService, EnrollmentService],
})
export class StudentsModule {}
