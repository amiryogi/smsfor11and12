import { Module } from '@nestjs/common';
import { AcademicYearController } from './academic-year.controller.js';
import { AcademicYearService } from './academic-year.service.js';
import { SubjectController } from './subject.controller.js';
import { SubjectService } from './subject.service.js';
import { GradeController } from './grade.controller.js';
import { GradeService } from './grade.service.js';
import { SubjectSelectionController } from './subject-selection.controller.js';
import { SubjectSelectionService } from './subject-selection.service.js';

@Module({
  controllers: [AcademicYearController, SubjectController, GradeController, SubjectSelectionController],
  providers: [AcademicYearService, SubjectService, GradeService, SubjectSelectionService],
  exports: [AcademicYearService, SubjectService, GradeService, SubjectSelectionService],
})
export class AcademicModule {}
