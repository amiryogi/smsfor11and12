import {
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ExamType } from '@prisma/client';

export class CreateExamWeightageDto {
  @IsEnum(ExamType)
  examType!: ExamType;

  @IsUUID()
  gradeId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  weightPercent!: number;
}
