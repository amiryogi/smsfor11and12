import { Module } from '@nestjs/common';
import { AcademicYearController } from './academic-year.controller.js';
import { AcademicYearService } from './academic-year.service.js';
import { SubjectController } from './subject.controller.js';
import { SubjectService } from './subject.service.js';
import { GradeController } from './grade.controller.js';
import { GradeService } from './grade.service.js';

@Module({
  controllers: [AcademicYearController, SubjectController, GradeController],
  providers: [AcademicYearService, SubjectService, GradeService],
  exports: [AcademicYearService, SubjectService, GradeService],
})
export class AcademicModule {}
