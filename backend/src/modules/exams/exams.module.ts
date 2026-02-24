import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';
import { ExamResultController } from './exam-result.controller.js';
import { ExamResultService } from './exam-result.service.js';

@Module({
  controllers: [ExamsController, ExamResultController],
  providers: [ExamsService, ExamResultService],
  exports: [ExamsService, ExamResultService],
})
export class ExamsModule {}
