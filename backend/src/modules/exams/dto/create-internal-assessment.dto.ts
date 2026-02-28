import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateInternalAssessmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  gradeSubjectId!: string;

  @IsUUID()
  examId!: string;

  @IsOptional()
  @IsNumber({}, { message: 'projectMarks must be a number' })
  @Min(0)
  projectMarks?: number;

  @IsOptional()
  @IsNumber({}, { message: 'participationMarks must be a number' })
  @Min(0)
  participationMarks?: number;

  @IsOptional()
  @IsNumber({}, { message: 'attendanceMarks must be a number' })
  @Min(0)
  attendanceMarks?: number;

  @IsOptional()
  @IsNumber({}, { message: 'otherMarks must be a number' })
  @Min(0)
  otherMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  fullMarks?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
