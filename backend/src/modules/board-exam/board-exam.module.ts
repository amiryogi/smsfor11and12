import { Module } from '@nestjs/common';
import { BoardExamController } from './board-exam.controller.js';
import { BoardExamService } from './board-exam.service.js';

@Module({
  controllers: [BoardExamController],
  providers: [BoardExamService],
  exports: [BoardExamService],
})
export class BoardExamModule {}
