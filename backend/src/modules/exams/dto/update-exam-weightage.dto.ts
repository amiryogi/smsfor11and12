import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExamWeightageDto } from './create-exam-weightage.dto.js';

export class UpdateExamWeightageDto extends PartialType(
  OmitType(CreateExamWeightageDto, ['examType', 'gradeId', 'academicYearId'] as const),
) {}
