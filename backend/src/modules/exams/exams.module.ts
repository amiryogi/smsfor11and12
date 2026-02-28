import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';
import { ExamResultController } from './exam-result.controller.js';
import { ExamResultService } from './exam-result.service.js';
import { ExamWeightageController } from './exam-weightage.controller.js';
import { ExamWeightageService } from './exam-weightage.service.js';
import { InternalAssessmentController } from './internal-assessment.controller.js';
import { InternalAssessmentService } from './internal-assessment.service.js';
import { CumulativeResultService } from './cumulative-result.service.js';

@Module({
  controllers: [
    ExamsController,
    ExamResultController,
    ExamWeightageController,
    InternalAssessmentController,
  ],
  providers: [
    ExamsService,
    ExamResultService,
    ExamWeightageService,
    InternalAssessmentService,
    CumulativeResultService,
  ],
  exports: [
    ExamsService,
    ExamResultService,
    ExamWeightageService,
    InternalAssessmentService,
    CumulativeResultService,
  ],
})
export class ExamsModule {}
