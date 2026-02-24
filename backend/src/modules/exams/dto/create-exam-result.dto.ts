import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamResultDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  gradeSubjectId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  theoryMarksObtained?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  practicalMarksObtained?: number;
}

export class BulkCreateExamResultDto {
  results!: CreateExamResultDto[];
}
